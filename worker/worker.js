export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

    // ВЕБХУК ТЕЛЕГРАМА: Telegram присылает secret_token из setWebhook в этом заголовке.
    // Без совпадения ветка Телеграма не выполняется вовсе. Env-переменная: TG_WEBHOOK_SECRET.
    const tgSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    const isTgWebhook = !!(tgSecret && env.TG_WEBHOOK_SECRET && tgSecret === env.TG_WEBHOOK_SECRET);

    // ВСТРОЕННЫЙ RATE LIMIT ЧЕРЕЗ KV (валидные вебхуки Телеграма не считаем —
    // все апдейты ходят из общего пула IP Телеграма и легко поймают ложный 429)
    if (!isTgWebhook) {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const rateLimitKey = `limit_${ip}`;

      if (env.RATE_LIMIT_KV) {
        // Получаем текущее количество запросов для этого IP
        let currentCount = await env.RATE_LIMIT_KV.get(rateLimitKey);
        currentCount = currentCount ? parseInt(currentCount) : 0;

        // Если больше 10 запросов — блок
        if (currentCount >= 10) {
          return new Response('Слишком много запросов. Подожди минуту.', { status: 429, headers: corsHeaders });
        }

        // Увеличиваем счётчик и сохраняем на 60 секунд
        await env.RATE_LIMIT_KV.put(rateLimitKey, (currentCount + 1).toString(), { expirationTtl: 60 });
      }
    }

    const authHeader = request.headers.get('Authorization');

    // 1. ЗАПРОСЫ С САЙТА
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const verifyResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: idToken })
        });

        if (!verifyResponse.ok) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });

        const verifyData = await verifyResponse.json();
        if (!verifyData.users || verifyData.users.length === 0) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        const { message } = await request.json();
        if (message) {
          await sendTgMessage(env, env.TG_CHAT_ID, message);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 2. ЗАПРОСЫ ОТ ТЕЛЕГРАМА (только с валидным секретом вебхука)
    if (isTgWebhook) {
      try {
        const update = await request.json();
        if (update.message) {
          const chatId = update.message.chat.id;
          const text = update.message.text || '';
          const document = update.message.document;
          const replyToMessage = update.message.reply_to_message;

          if (chatId.toString() === env.TG_CHAT_ID.toString()) {
            if (text.startsWith('/help')) {
              await sendTgMessage(env, chatId, `🛠 <b>Команды бота:</b>\n/stats\n/backup\n/restore (ответом на файл)\n/help`);
            } else if (text.startsWith('/stats')) {
              const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Omsk' });
              await sendTgMessage(env, chatId, `📊 <b>Статус:</b>\nБот жив. Время: ${now}`);
            } else if (text.startsWith('/backup')) {
              await sendTgMessage(env, chatId, `⏳ <i>Собираю бэкап...</i>`);
              await makeAndSendBackup(env, chatId);
            } else if (text.startsWith('/restore') && replyToMessage && replyToMessage.document) {
              const doc = replyToMessage.document;
              if (!doc.file_name.endsWith('.json')) {
                await sendTgMessage(env, chatId, `❌ <b>Ошибка:</b> Файл должен быть .json`);
              } else {
                await sendTgMessage(env, chatId, `⏳ <i>Восстанавливаю...</i>`);
                try {
                  await restoreFromBackup(env, chatId, doc.file_id);
                } catch (err) {
                  // escapeHtml: err.message с < или > сломал бы HTML-разметку и телега не доставила бы сообщение
                  await sendTgMessage(env, chatId, `❌ <b>Ошибка:</b>\n${escapeHtml(err.message)}`);
                }
              }
            }
          }
          return new Response('OK', { status: 200 });
        }
      } catch (e) {}
    }

    return new Response('Bad Request', { status: 400, headers: corsHeaders });
  },

  // 3. CRON
  async scheduled(event, env, ctx) {
    try {
      // Утренняя сводка на отдельном триггере (см. CRON_DIGEST в конце файла),
      // остальные триггеры — как раньше: проверка + бэкап
      if (event.cron === CRON_DIGEST) {
        await sendDailyDigest(env);
        return;
      }
      const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Omsk' });
      await sendTgMessage(env, env.TG_CHAT_ID, `🤖 <b>Плановая проверка:</b>\nВсё работает. Время: ${now}`);
      await makeAndSendBackup(env, env.TG_CHAT_ID);
    } catch (err) {
      await sendTgMessage(env, env.TG_CHAT_ID, `❌ <b>Ошибка в Cron:</b>\n${err.message}`);
    }
  }
};

// ФУНКЦИИ
const DB_URL = 'https://ibd2026-31a00-default-rtdb.firebaseio.com/IBD2026.json';
// Сводка приходит в 7:30 по Омску (1:30 UTC). Триггер добавить в CF: Triggers → Cron Triggers.
const CRON_DIGEST = '30 1 * * *';
const OMSK_TZ = 'Asia/Omsk';
const DIGEST_PAIR_TIMES = { 1: '9:00–10:30', 2: '10:45–12:15', 3: '12:30–14:00', 4: '14:40–16:10', 5: '16:20–17:50', 6: '18:00–19:30' };
const WEEKDAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Дата ДД.ММ.ГГГГ (формат редактора расписания) — или null
function parseRuDateW(s) {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

// Утренняя сводка: сегодня по Омску (пары с учетом дат и отмен) + дедлайны на неделю
async function sendDailyDigest(env) {
  const dbResponse = await fetch(DB_URL);
  if (!dbResponse.ok) throw new Error(`Firebase: ${dbResponse.statusText}`);
  const data = await dbResponse.json();

  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: OMSK_TZ, weekday: 'short' }).format(new Date());
  const dayIndex = WEEKDAY_INDEX[weekday] ?? 0;
  const label = new Intl.DateTimeFormat('ru-RU', { timeZone: OMSK_TZ, day: 'numeric', month: 'long', weekday: 'long' }).format(new Date());
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);

  const lines = [`🌅 <b>Доброе утро, Б-31ЛЕС!</b>`, `📆 Сегодня ${label}\n`];

  const schedule = data.schedule || {};
  let pairCount = 0;
  for (let pair = 1; pair <= 6; pair++) {
    const l = schedule[dayIndex] ? schedule[dayIndex][pair] : null;
    if (!l || !l.subject) continue;
    const sD = parseRuDateW(l.startDate), eD = parseRuDateW(l.endDate);
    if (sD && todayMid < sD) continue; // пара еще не началась
    if (eD && todayMid > eD) continue; // пара уже закончилась
    pairCount++;
    const cancel = l.isCancelled ? ' 🚫 <b>ОТМЕНА</b>' : '';
    lines.push(`${pair}. ${DIGEST_PAIR_TIMES[pair] || ''} — ${escapeHtml(l.subject)}${l.room ? ` (ауд. ${escapeHtml(l.room)})` : ''}${cancel}`);
  }
  if (!pairCount) lines.push('🌴 Пар сегодня нет. Гуляй, лесник.');

  const subjects = (data.homework && Array.isArray(data.homework.subjects)) ? data.homework.subjects : [];
  const items = [];
  subjects.forEach(subj => {
    if (!subj) return;
    (Array.isArray(subj.tasks) ? subj.tasks : []).forEach(t => {
      if (!t || !t.deadline) return;
      const d = new Date(t.deadline);
      if (isNaN(d)) return;
      const diffDays = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - todayMid) / 86400000);
      if (diffDays < 0 || diffDays > 7) return;
      const text = String(t.desc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
      items.push({ diffDays, name: subj.name || '', text });
    });
  });
  if (items.length) {
    items.sort((a, b) => a.diffDays - b.diffDays);
    lines.push('\n⏰ <b>Дедлайны:</b>');
    items.slice(0, 5).forEach(t => {
      const when = t.diffDays === 0 ? 'сегодня!' : t.diffDays === 1 ? 'завтра' : `через ${t.diffDays} дн.`;
      lines.push(`• ${escapeHtml(t.name)} — ${escapeHtml(t.text || 'задание')} (${when})`);
    });
  }

  await sendTgMessage(env, env.TG_CHAT_ID, lines.join('\n'));
}

async function sendTgMessage(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
  });
}

async function makeAndSendBackup(env, chatId) {
  const dbResponse = await fetch(DB_URL);
  if (!dbResponse.ok) throw new Error(`Firebase: ${dbResponse.statusText}`);
  
  const dbData = await dbResponse.json();
  const jsonString = JSON.stringify(dbData, null, 2);
  const fileName = `backup_${new Date().toISOString().slice(0, 10)}.json`;
  
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', new Blob([jsonString], { type: 'application/json' }), fileName);
  formData.append('caption', `📦 <b>Бэкап базы данных</b>`);

  await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendDocument`, {
    method: 'POST',
    body: formData
  });
}

async function restoreFromBackup(env, chatId, fileId) {
  const getFileRes = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/getFile?file_id=${fileId}`);
  const getFileData = await getFileRes.json();
  if (!getFileData.ok) throw new Error('Не удалось скачать файл из TG');
  
  const fileRes = await fetch(`https://api.telegram.org/file/bot${env.TG_TOKEN}/${getFileData.result.file_path}`);
  const fileText = await fileRes.text();
  
  try { JSON.parse(fileText); } catch (e) { throw new Error('Файл не JSON'); }

  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.BOT_EMAIL, password: env.BOT_PASSWORD, returnSecureToken: true })
  });
  
  const authData = await authRes.json();
  if (!authRes.ok) throw new Error(`Ошибка авторизации: ${authData.error.message}`);
  
  const putRes = await fetch(`https://ibd2026-31a00-default-rtdb.firebaseio.com/IBD2026.json?auth=${authData.idToken}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: fileText
  });

  if (!putRes.ok) throw new Error(`Firebase отклонил запись`);

  await sendTgMessage(env, chatId, `✅ <b>База данных успешно восстановлена!</b>`);
}