# Б-31ЛЕС — единый портал группы

Учебный SPA-портал группы Б-31ЛЕС: расписание, экзамены, домашка, ресурсы,
внеурочка, преподаватели. Работает на GitHub Pages, данные — в Firebase,
уведомления — через Telegram-бота.

## Стек

- Чистый JavaScript (ES-модули), без фреймворков и сборки
- Firebase: Auth + Realtime Database (`IBD2026`)
- Чистый CSS (`css/variables.css` — темы, `base.css` — сетка, `components.css` — компоненты, `animations.css`)
- PWA: `sw.js` (network-first для js/css) + `manifest.json`
- Cloudflare Worker: Telegram-бот (JWT-проверка, rate-limit через KV, cron-бэкапы) — код воркера живёт вне репозитория

## Структура

```
app.js          — хэш-роутер, развеска страниц из routes/
routes/         — по файлу на страницу (home, schedule, exam, resources, homework, extracurricular, teacher)
state.js        — глобальное состояние
dataManager.js  — загрузка/сохранение в Firebase с кэшем в localStorage и прогресс-баром
auth.js         — вход, isEditor() по списку ALLOWED_UIDS
utils.js        — модалки, тосты, отправка в ТГ
index.html      — разметка, все модалки, подключение скриптов с ?v=N
app-settings.js — вход/выход редактора, экспорт/импорт данных
```

## Деплой

Пуш в `main` = деплой: GitHub Pages подхватывает сам.

**Перед коммитом изменений js/css — поднять версии кэша:**

```
bump-version.bat
```

Скрипт увеличивает все `?v=N` в index.html до max+1. Без этого браузеры
пользователей могут тянуть старые файлы из кэша.

## Данные

- Разделы: `schedule`, `homework`, `exams`, `resources`, `extracurricular`, `teachers`, `settings` (даты таймеров главной), `theme`
- Экспорт/импорт полного бэкапа — кнопки в сайдбаре сайта
- Запись в базу — только редакторам (UID в `auth.js`), проверь правила в консоли Firebase
