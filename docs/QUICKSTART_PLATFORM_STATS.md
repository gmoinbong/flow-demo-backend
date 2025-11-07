# Platform Stats - Быстрый старт

## Что сделано

✅ Расширена схема БД (4 новых таблицы)  
✅ Сервис для интеграции с Apify/RapidAPI  
✅ REST API для управления social accounts и stats  
✅ Postman коллекция готова к импорту  
✅ Автоматическое кэширование (TTL 6 часов)

---

## Запуск за 5 минут

### 1. Установить зависимости

```bash
cd backend
npm install
```

### 2. Настроить переменные окружения

Создай файл `.env` в `backend/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/creatorflow
APIFY_API_TOKEN=твой_токен_apify
RAPIDAPI_KEY=твой_ключ_rapidapi
PORT=3000
```

**Получить токены:**
- Apify: https://console.apify.com/account/integrations (получи $5 бесплатно)
- RapidAPI: https://rapidapi.com/developer/security (100-500 free requests)

### 3. Применить миграции

```bash
npm run drizzle-kit generate
npm run drizzle-kit migrate
```

### 4. Запустить backend

```bash
npm run start:dev
```

API работает на `http://localhost:3000`

---

## Использование

### Шаг 1: Создать social account

```bash
curl -X POST http://localhost:3000/api/social-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "YOUR_CREATOR_UUID",
    "platform": "youtube",
    "platform_user_id": "UCUsbfdhYigUiXCaLnHareuQ",
    "username": "BK42Cycles",
    "profile_url": "https://www.youtube.com/@BK42Cycles",
    "is_primary": true
  }'
```

**Ответ:**
```json
{
  "data": {
    "id": "uuid-социального-аккаунта",
    "creator_id": "...",
    "platform": "youtube",
    ...
  }
}
```

Скопируй `id` из ответа.

---

### Шаг 2: Запустить скрапинг

```bash
curl -X POST http://localhost:3000/api/platform-stats/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "socialAccountId": "uuid-из-предыдущего-шага",
    "forceRefresh": false
  }'
```

**Ответ:**
```json
{
  "jobId": "job-uuid",
  "status": "pending",
  "message": "Scraping started"
}
```

---

### Шаг 3: Проверить статус job

```bash
curl http://localhost:3000/api/platform-stats/job/job-uuid
```

Жди пока `status` станет `"completed"` (обычно 5-30 секунд).

**Ответ (completed):**
```json
{
  "data": {
    "id": "job-uuid",
    "status": "completed",
    "result_data": {
      "platform": "youtube",
      "followers_count": 105000,
      "following_count": 0,
      "total_posts": 725,
      "total_views": 50004249,
      "engagement_rate": "0.65%",
      "raw_data": {
        "channelId": "UCUsbfdhYigUiXCaLnHareuQ",
        "title": "BK42 Cycles",
        "subscriberCountText": "105K subscribers",
        "videoCountText": "725 videos",
        ...
      }
    }
  }
}
```

---

### Шаг 4: Получить статистику

```bash
curl http://localhost:3000/api/platform-stats/uuid-социального-аккаунта
```

**Ответ:**
```json
{
  "data": [
    {
      "id": "stats-uuid",
      "social_account_id": "...",
      "platform": "youtube",
      "followers_count": 105000,
      "following_count": 0,
      "total_posts": 725,
      "total_views": 50004249,
      "engagement_rate": "0.65%",
      "scraped_at": "2025-10-21T...",
      "ttl_expires_at": "2025-10-21T...",
      ...
    }
  ],
  "latest": { ... }
}
```

---

## Postman

Импортируй коллекцию:

1. Открой Postman
2. Import → Upload Files
3. Выбери `backend/CreatorFlow_Platform_Stats.postman_collection.json`
4. Настрой переменные (`apify_token`, `rapidapi_key`, `social_account_id`)
5. Запускай запросы

---

## Таблицы БД

### `creator_profiles`
Профили креаторов (influencer).

### `social_accounts`
Привязанные соц. аккаунты (YouTube/TikTok/Instagram).

### `platform_stats`
Собранная статистика с кэшем (TTL).

### `scraper_jobs`
Очередь и история scraping задач.

---

## Как работает кэширование

1. При запросе `/scrape` проверяется `ttl_expires_at`
2. Если кэш валиден → возвращается сразу
3. Если устарел или `forceRefresh: true` → запускается новый job
4. TTL по умолчанию: **6 часов**

Настроить в `platform-stats.controller.ts`:
```typescript
ttlExpiry.setHours(ttlExpiry.getHours() + 6); // измени 6 на нужное
```

---

## Стоимость

**Пример для 100 креаторов:**
- 100 creators × 3 platforms = 300 accounts
- Обновление каждые 6 часов = 4 раза/день
- 300 × 4 × 30 = **36,000 requests/мес**

**Apify:** ~$50/мес (100K requests)  
**RapidAPI:** ~$30-50/мес (зависит от провайдера)

---

## Troubleshooting

### Ошибка "Apify run failed"
- Проверь токен в `.env`
- Проверь URL канала (должен быть полный)
- Логи в Apify Console: https://console.apify.com

### Данные не обновляются
- Используй `forceRefresh: true`
- Проверь `ttl_expires_at` в таблице `platform_stats`

### "Social account not found"
- Сначала создай account через `/api/social-accounts`
- Проверь что передаёшь правильный UUID

---

## Следующие шаги

- [ ] Добавить Cron для авто-обновления (каждые 6 часов)
- [ ] Интегрировать во frontend (metrek)
- [ ] Добавить очередь (BullMQ) для batch jobs
- [ ] Настроить мониторинг (Sentry/LogTail)
- [ ] Добавить rate limiting

Детали в `PLATFORM_STATS_SETUP.md`.





