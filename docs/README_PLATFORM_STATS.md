# Platform Stats - Сбор статистики с соц. сетей

## Что это?

Система автоматического сбора статистики креаторов с YouTube, TikTok и Instagram **без использования платных API токенов**. Использует embedded data через провайдеров Apify/RapidAPI.

---

## Возможности

✅ **Поддержка 3 платформ:** YouTube, TikTok, Instagram  
✅ **Без расхода API квот:** парсинг публичных данных  
✅ **Автоматическое кэширование:** TTL 6 часов (настраивается)  
✅ **Унифицированный формат:** одинаковая структура для всех платформ  
✅ **Очередь заданий:** отслеживание статуса scraping  
✅ **REST API:** готовые endpoints для интеграции  
✅ **Postman коллекция:** готова к импорту  

---

## Быстрый старт (5 минут)

### 1. Установка

```bash
cd backend
npm install
```

### 2. Настройка `.env`

Создай файл `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/creatorflow
APIFY_API_TOKEN=твой_токен_apify
PORT=3000
```

Получить токен: https://console.apify.com/account/integrations (бесплатно $5)

### 3. Миграция БД

```bash
npm run db:migrate
```

### 4. Запуск

```bash
npm run start:dev
```

### 5. Тест

```bash
# Создать social account
curl -X POST http://localhost:3000/api/social-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "00000000-0000-0000-0000-000000000000",
    "platform": "youtube",
    "username": "BK42Cycles",
    "profile_url": "https://www.youtube.com/@BK42Cycles"
  }'

# Скопируй "id" из ответа, затем:
curl -X POST http://localhost:3000/api/platform-stats/scrape \
  -H "Content-Type: application/json" \
  -d '{"socialAccountId": "UUID_ИЗ_ПРЕДЫДУЩЕГО_ОТВЕТА"}'
```

Через 10-30 секунд проверь результат:

```bash
curl http://localhost:3000/api/platform-stats/UUID_SOCIAL_ACCOUNT
```

Готово! 🎉

---

## Структура проекта

```
backend/
├── src/
│   ├── drizzle/
│   │   ├── schema.ts                    ← Новые таблицы (4 шт)
│   │   └── migrations/
│   │       └── 0001_funny_silver_samurai.sql
│   ├── types/
│   │   └── platform-stats.types.ts      ← Типы для провайдеров
│   ├── services/
│   │   └── platform-scraper.service.ts  ← Интеграция Apify/RapidAPI
│   ├── controllers/
│   │   ├── platform-stats.controller.ts ← API endpoints
│   │   └── social-accounts.controller.ts
│   └── modules/
│       └── platform-stats.module.ts
│
├── QUICKSTART_PLATFORM_STATS.md         ← Начни отсюда! ⭐
├── PLATFORM_STATS_SETUP.md              ← Детальная настройка
├── PLATFORM_STATS_SUMMARY.md            ← Общий обзор
├── ENV_SETUP_INSTRUCTIONS.md            ← Настройка .env
├── INSTALLATION_CHECKLIST.md            ← Checklist установки
├── PLATFORM_RESPONSES_EXAMPLES.md       ← Примеры данных
└── CreatorFlow_Platform_Stats.postman_collection.json
```

---

## API Endpoints

### Social Accounts

```
POST   /api/social-accounts              - Создать аккаунт
GET    /api/social-accounts/:id          - Получить аккаунт
GET    /api/social-accounts/creator/:id  - Список по креатору
PUT    /api/social-accounts/:id          - Обновить
DELETE /api/social-accounts/:id          - Удалить
```

### Platform Stats

```
POST   /api/platform-stats/scrape        - Запустить scraping
GET    /api/platform-stats/:id           - Получить статистику
GET    /api/platform-stats/job/:jobId    - Статус задания
```

---

## Формат данных

### Входные данные (создание social account)

```json
{
  "creator_id": "uuid",
  "platform": "youtube",
  "username": "BK42Cycles",
  "profile_url": "https://www.youtube.com/@BK42Cycles"
}
```

### Выходные данные (статистика)

```json
{
  "platform": "youtube",
  "followers_count": 105000,
  "following_count": 0,
  "total_posts": 725,
  "total_views": 50004249,
  "engagement_rate": "0.65%",
  "raw_data": {
    "channelId": "UCUsbfdhYigUiXCaLnHareuQ",
    "subscriberCountText": "105K subscribers",
    "country": "Poland",
    ...
  },
  "scraped_at": "2025-10-21T15:30:00Z",
  "ttl_expires_at": "2025-10-21T21:30:00Z"
}
```

---

## Таблицы БД

### `creator_profiles`
Профили influencer-креаторов
- `id`, `user_id`, `display_name`, `bio`, `avatar_url`, `is_verified`

### `social_accounts`
Привязанные социальные аккаунты
- `id`, `creator_id`, `platform`, `username`, `profile_url`, `last_sync_at`

### `platform_stats`
Собранная статистика с кэшированием
- `id`, `social_account_id`, `platform`, `followers_count`, `total_views`, `engagement_rate`, `raw_data`, `ttl_expires_at`

### `scraper_jobs`
Очередь и история scraping заданий
- `id`, `social_account_id`, `status`, `started_at`, `completed_at`, `result_data`, `error_message`

---

## Провайдеры

### Apify (рекомендуется) 

**Плюсы:**
- Стабильный, обходит блокировки
- Готовые акторы для всех платформ
- $5 бесплатно при регистрации

**Стоимость:** $49/мес (100K requests)

**Актеры:**
- YouTube: `bernardo/youtube-channel-scraper`
- TikTok: `clockworks/tiktok-profile-scraper`
- Instagram: `apify/instagram-profile-scraper`

**Регистрация:** https://apify.com

### RapidAPI (дешевле, менее надёжно)

**Плюсы:**
- Очень дёшево ($10-50/мес)
- Быстрый старт

**Минусы:**
- Риск блокировок
- Разные форматы данных

**Регистрация:** https://rapidapi.com

---

## Стоимость для MVP

**Пример:** 100 креаторов

- 100 creators × 3 platforms = 300 accounts
- Обновление каждые 6 часов = 4 раза/день
- 300 × 4 × 30 = **36,000 requests/мес**

**Итого:** ~$50-80/мес (Apify $49 + запас)

vs официальные API:
- YouTube Data API: 10K quota/день (очень мало, не хватит)
- Instagram Graph API: требует review + business account
- TikTok API: закрыт для большинства

**Вывод:** Embedded data выгоднее и проще! 🎯

---

## Кэширование

1. При запросе `/scrape` проверяется `ttl_expires_at`
2. Если TTL валиден → возврат кэша (мгновенно)
3. Если устарел → новый scrape (10-30 сек)
4. TTL по умолчанию: **6 часов**

Настроить в `platform-stats.controller.ts`:

```typescript
ttlExpiry.setHours(ttlExpiry.getHours() + 6); // измени 6
```

---

## Интеграция во frontend

### Пример для metrek (Next.js)

Создай `metrek/lib/platform-stats.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchCreatorStats(socialAccountId: string) {
  const res = await fetch(`${API_URL}/api/platform-stats/${socialAccountId}`);
  const data = await res.json();
  return data.latest; // последняя запись
}

export async function refreshStats(socialAccountId: string, force = false) {
  const res = await fetch(`${API_URL}/api/platform-stats/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ socialAccountId, forceRefresh: force }),
  });
  return res.json();
}
```

Использование в компоненте:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchCreatorStats, refreshStats } from '@/lib/platform-stats';

export default function CreatorStatsCard({ socialAccountId }: { socialAccountId: string }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCreatorStats(socialAccountId).then(setStats);
  }, [socialAccountId]);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshStats(socialAccountId, true);
    const updated = await fetchCreatorStats(socialAccountId);
    setStats(updated);
    setLoading(false);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="card">
      <h3>{stats.platform.toUpperCase()}</h3>
      <p>Followers: {stats.followers_count.toLocaleString()}</p>
      <p>Posts: {stats.total_posts.toLocaleString()}</p>
      <p>Views: {stats.total_views.toLocaleString()}</p>
      <p>Engagement: {stats.engagement_rate}</p>
      <button onClick={handleRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
```

---

## Следующие шаги

### Обязательно

- [ ] Получить токены Apify/RapidAPI
- [ ] Применить миграцию в production БД
- [ ] Настроить `.env` на сервере
- [ ] Добавить rate limiting
- [ ] Настроить мониторинг (Sentry)

### Рекомендуется

- [ ] Настроить Cron для авто-обновления (каждые 6 часов)
- [ ] Добавить очередь (BullMQ) для batch jobs
- [ ] Интегрировать во frontend (metrek)
- [ ] Добавить webhook уведомления (completed/failed)
- [ ] Dashboard для мониторинга scraper jobs

### Опционально

- [ ] Поддержка X/Twitter, LinkedIn
- [ ] Исторические графики (followers growth)
- [ ] Экспорт в CSV/Excel
- [ ] Self-hosted scraper (Puppeteer)

---

## Документация

- **`QUICKSTART_PLATFORM_STATS.md`** ⭐ - Начни отсюда!
- **`INSTALLATION_CHECKLIST.md`** - Пошаговая установка
- **`ENV_SETUP_INSTRUCTIONS.md`** - Настройка токенов
- **`PLATFORM_STATS_SETUP.md`** - Детальная настройка провайдеров
- **`PLATFORM_RESPONSES_EXAMPLES.md`** - Примеры API ответов и SQL
- **`PLATFORM_STATS_SUMMARY.md`** - Общий обзор архитектуры

---

## Troubleshooting

### "Cannot connect to database"
Проверь что PostgreSQL запущен и `DATABASE_URL` правильный.

### "Invalid Apify token"
Сгенерируй новый: https://console.apify.com/account/integrations

### "Social account not found"
Сначала создай account через `POST /api/social-accounts`

### "Scraper job failed"
Проверь логи job: `GET /api/platform-stats/job/:jobId`

Детали в `INSTALLATION_CHECKLIST.md` → Troubleshooting.

---

## Поддержка

**Вопросы по настройке:** смотри документацию выше  
**Вопросы по Apify:** https://apify.com/contact  
**Вопросы по RapidAPI:** https://rapidapi.com/support  

---

## Лицензия

Часть проекта CreatorFlow (private).

---

**Готово к использованию! 🚀**

Начни с `QUICKSTART_PLATFORM_STATS.md` для запуска за 5 минут.





