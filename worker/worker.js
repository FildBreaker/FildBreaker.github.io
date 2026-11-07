export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

        // ВСТРОЕННЫЙ RATE LIMIT ЧЕРЕЗ KV
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

    // 2. ЗАПРОСЫ ОТ ТЕЛЕГРАМА
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
                await sendTgMessage(env, chatId, `❌ <b>Ошибка:</b>\n${err.message}`);
              }
            }
          }
        }
        return new Response('OK', { status: 200 });
      }
    } catch (e) {}

    return new Response('Bad Request', { status: 400, headers: corsHeaders });
  },

  // 3. CRON
  async scheduled(event, env, ctx) {
    try {
      const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Omsk' });
      await sendTgMessage(env, env.TG_CHAT_ID, `🤖 <b>Плановая проверка:</b>\nВсё работает. Время: ${now}`);
      await makeAndSendBackup(env, env.TG_CHAT_ID);
    } catch (err) {
      await sendTgMessage(env, env.TG_CHAT_ID, `❌ <b>Ошибка в Cron:</b>\n${err.message}`);
    }
  }
};

// ФУНКЦИИ
async function sendTgMessage(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
  });
}

async function makeAndSendBackup(env, chatId) {
  const dbUrl = 'https://ibd2026-31a00-default-rtdb.firebaseio.com/IBD2026.json';
  const dbResponse = await fetch(dbUrl);
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