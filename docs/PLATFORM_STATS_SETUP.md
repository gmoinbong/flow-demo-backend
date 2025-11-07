# Platform Stats Scraper - Setup Guide

## Обзор

Система для сбора статистики с социальных платформ (YouTube, TikTok, Instagram) без использования платных API токенов. Использует embedded data через провайдеров.

---

## 1. Выбор провайдера

### Вариант А: Apify (рекомендуется)

**Плюсы:**
- Готовые акторы для всех платформ
- Обходит блокировки
- Стабильный JSON на выходе
- 100K бесплатных credits при регистрации

**Стоимость:** $49/мес (100K requests) или $0 при малых объемах

**Регистрация:**
1. Перейди на https://apify.com
2. Создай аккаунт (получишь $5 бесплатно)
3. В Console → Settings → Integrations → скопируй API Token
4. Добавь в `.env`: `APIFY_API_TOKEN=apify_api_...`

**Нужные акторы:**
- YouTube: `bernardo/youtube-channel-scraper` или `streamers/youtube-scraper`
- TikTok: `clockworks/tiktok-profile-scraper`
- Instagram: `apify/instagram-profile-scraper`

---

### Вариант Б: RapidAPI (дешевле, менее надёжно)

**Плюсы:**
- Очень дёшево ($10-50/мес)
- Быстрый старт

**Минусы:**
- Могут блокировать API
- Разные провайдеры = разные форматы данных

**Регистрация:**
1. https://rapidapi.com → Sign Up
2. Subscribe на нужные API (есть бесплатные tier)
3. В Dashboard → My Apps → Default Application → скопируй API Key
4. Добавь в `.env`: `RAPIDAPI_KEY=...`

**Рекомендуемые API:**
- YouTube: https://rapidapi.com/ytdlfree/api/youtube-v31
- TikTok: https://rapidapi.com/ti-tiger/api/tiktok-video-no-watermark2
- Instagram: https://rapidapi.com/logicbuilder/api/instagram-scraper-api2

---

## 2. Настройка БД

### Применить миграции

```bash
cd backend
npm run drizzle-kit generate
npm run drizzle-kit migrate
```

### Проверить таблицы

```sql
-- Должны быть созданы:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('creator_profiles', 'social_accounts', 'platform_stats', 'scraper_jobs');
```

---

## 3. Запуск API

```bash
cd backend
npm install
npm run start:dev
```

API будет доступен на `http://localhost:3000`

---

## 4. Postman коллекция

### Создать social account

```http
POST http://localhost:3000/api/social-accounts
Content-Type: application/json

{
  "creator_id": "uuid-creator-id",
  "platform": "youtube",
  "platform_user_id": "UCUsbfdhYigUiXCaLnHareuQ",
  "username": "BK42Cycles",
  "profile_url": "https://www.youtube.com/@BK42Cycles",
  "is_primary": true
}
```

### Запустить скрапинг

```http
POST http://localhost:3000/api/platform-stats/scrape
Content-Type: application/json

{
  "socialAccountId": "uuid-social-account-id",
  "forceRefresh": false
}
```

**Ответ:**
```json
{
  "jobId": "uuid-job-id",
  "status": "pending",
  "message": "Scraping started"
}
```

### Проверить статус job

```http
GET http://localhost:3000/api/platform-stats/job/{jobId}
```

**Ответ:**
```json
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "result_data": {
      "platform": "youtube",
      "followers_count": 105000,
      "following_count": 0,
      "total_posts": 725,
      "total_views": 50004249,
      "engagement_rate": "0.65%",
      "raw_data": { ... }
    }
  }
}
```

### Получить последнюю статистику

```http
GET http://localhost:3000/api/platform-stats/{socialAccountId}
```

---

## 5. Прямые запросы к провайдерам (для Postman)

### Apify - YouTube Channel

```http
POST https://api.apify.com/v2/acts/bernardo~youtube-channel-scraper/runs?token=YOUR_TOKEN
Content-Type: application/json

{
  "startUrls": [
    {
      "url": "https://www.youtube.com/@BK42Cycles"
    }
  ],
  "maxResults": 1
}
```

**Получить результаты:**
1. Из ответа возьми `runId`
2. Жди пока `status` не станет `SUCCEEDED` (проверяй через GET)
3. Получи `defaultDatasetId`
4. Запроси данные:

```http
GET https://api.apify.com/v2/datasets/{datasetId}/items?token=YOUR_TOKEN
```

**Пример ответа:**
```json
[
  {
    "channelId": "UCUsbfdhYigUiXCaLnHareuQ",
    "title": "BK42 Cycles",
    "subscriberCountText": "105K subscribers",
    "viewCountText": "50,004,249 views",
    "videoCountText": "725 videos",
    "description": "Welcome to BK42 Cycles!...",
    "country": "Poland",
    "customUrl": "@BK42Cycles"
  }
]
```

---

### Apify - TikTok Profile

```http
POST https://api.apify.com/v2/acts/clockworks~tiktok-profile-scraper/runs?token=YOUR_TOKEN
Content-Type: application/json

{
  "profiles": ["@bakc42"],
  "resultsPerPage": 1
}
```

**Формат ответа:**
```json
[
  {
    "uniqueId": "bakc42",
    "follower_count": 48,
    "following_count": 350,
    "aweme_count": 0,
    "total_favorited": 0
  }
]
```

---

### RapidAPI - Instagram

```http
GET https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=bk42cycles
X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
X-RapidAPI-Host: instagram-scraper-api2.p.rapidapi.com
```

**Формат ответа:**
```json
{
  "data": {
    "user": {
      "id": "7945858114",
      "username": "bk42cycles",
      "full_name": "BK42 Cycles",
      "edge_followed_by": {
        "count": 5495
      },
      "edge_follow": {
        "count": 350
      },
      "is_verified": true
    }
  }
}
```

---

## 6. Автоматическое обновление (Cron)

Для автоматического обновления статистики используй Supabase Cron или node-cron:

```typescript
// В отдельном файле cron.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlatformStatsController } from './controllers/platform-stats.controller';

@Injectable()
export class CronService {
  constructor(private statsController: PlatformStatsController) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshAllStats() {
    // Fetch all social accounts
    // Trigger scraping for each
  }
}
```

---

## 7. Оптимизация и кэширование

### TTL (Time To Live)

Данные кэшируются на 6 часов по умолчанию. Настраивается в контроллере:

```typescript
const ttlExpiry = new Date();
ttlExpiry.setHours(ttlExpiry.getHours() + 6); // 6 часов
```

### Rate Limiting

Добавь лимиты в Apify/RapidAPI dashboard чтобы не превысить квоту.

### Батчинг

Для массового скрапинга используй очередь (BullMQ):

```bash
npm install @nestjs/bull bull
```

---

## 8. Стоимость и лимиты

### Apify
- Free tier: $5 credit (~500 запросов)
- Personal: $49/мес (100K requests)
- 1 YouTube scrape ≈ 10 credits
- 1 TikTok scrape ≈ 5 credits
- 1 Instagram scrape ≈ 8 credits

### RapidAPI
- Free tier: 100-500 requests/мес
- Basic: $10-30/мес (10K requests)
- Pro: $50+/мес (100K+ requests)

### Рекомендация для MVP
- 100 creators × 3 platforms = 300 accounts
- Обновление каждые 6 часов = 4 раза/день
- 300 × 4 × 30 = 36,000 requests/мес
- **Стоимость: ~$50-80/мес**

---

## 9. Troubleshooting

### Ошибка "Apify run failed"

Проверь:
- Правильность URL (должен быть полный)
- Лимиты на аккаунте Apify
- Логи в Apify Console

### Ошибка "Social account not found"

Сначала создай social_account через отдельный endpoint (нужно добавить).

### Данные устарели

Используй `forceRefresh: true` в запросе.

---

## 10. Следующие шаги

1. ✅ Настроить провайдера (Apify/RapidAPI)
2. ✅ Применить миграции БД
3. ✅ Запустить backend
4. ⬜ Создать endpoint для CRUD social_accounts
5. ⬜ Настроить Cron для авто-обновления
6. ⬜ Интегрировать во frontend (metrek)
7. ⬜ Добавить очередь (BullMQ) для батчинга

---

## Контакты провайдеров

- Apify: https://apify.com/contact
- RapidAPI: https://rapidapi.com/support
- Альтернатива (ScraperAPI): https://scraperapi.com





