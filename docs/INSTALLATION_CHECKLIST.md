# Installation Checklist - Platform Stats Feature

## ✅ Pre-requisites

- [x] Node.js >= 18.0 (для встроенного fetch API)
- [x] PostgreSQL >= 13 (локально или Supabase)
- [x] npm >= 8.0

**Проверка версий:**

```bash
node -v   # Должно быть >= v18.0.0
npm -v    # Должно быть >= 8.0.0
psql --version  # Если используешь локальную БД
```

**Если Node.js < 18:**

Обнови Node.js:
- Windows: https://nodejs.org/en/download
- Mac: `brew install node@20`
- Linux: `nvm install 20`

Или установи polyfill для fetch:

```bash
cd backend
npm install node-fetch
```

Добавь в начало `src/main.ts`:

```typescript
// Only for Node.js < 18
import fetch from 'node-fetch';
if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
}
```

---

## 📦 1. Установка зависимостей

```bash
cd backend
npm install
```

**Уже установлено (из существующего package.json):**
- ✅ `@nestjs/common`, `@nestjs/core`, `@nestjs/config`
- ✅ `drizzle-orm`, `drizzle-kit`
- ✅ `pg` (PostgreSQL driver)
- ✅ `typescript`

**Не требуется дополнительных пакетов!** Все работает out-of-the-box.

---

## 🗄️ 2. Настройка БД

### Вариант А: Локальная БД (Docker)

Создай `docker-compose.yml` если его нет:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: creatorflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Запусти:

```bash
cd backend
docker-compose up -d
```

### Вариант Б: Supabase

1. Создай проект: https://supabase.com/dashboard
2. Settings → Database → Connection string
3. Скопируй URI

---

## 🔐 3. Настройка переменных окружения

Создай файл `backend/.env`:

```bash
cd backend
touch .env  # Mac/Linux
# или создай вручную в редакторе (Windows)
```

**Минимальная конфигурация:**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/creatorflow
APIFY_API_TOKEN=your_token_here
PORT=3000
```

**Получить токены:**
- Apify: https://console.apify.com/account/integrations (бесплатно $5)
- RapidAPI: https://rapidapi.com/developer/security (опционально)

Детальная инструкция: `ENV_SETUP_INSTRUCTIONS.md`

---

## 🔄 4. Применение миграций

### Сгенерировать миграции (уже сделано!)

Файл `src/drizzle/migrations/0001_funny_silver_samurai.sql` уже создан.

### Применить миграции

```bash
cd backend
npm run db:migrate
```

**Ожидаемый вывод:**

```
✓ Applying migration: 0000_outgoing_darkstar.sql
✓ Applying migration: 0001_funny_silver_samurai.sql
✓ Migrations applied successfully
✓ Created roles: ...
```

### Проверка таблиц

```bash
psql $DATABASE_URL -c "\dt"
```

Должны быть:
- `users`
- `user_role`
- `creator_profiles` ← новая
- `social_accounts` ← новая
- `platform_stats` ← новая
- `scraper_jobs` ← новая

---

## 🚀 5. Запуск backend

### Development mode

```bash
cd backend
npm run start:dev
```

**Ожидаемый вывод:**

```
[Nest] 12345  - 10/21/2025, 3:45:00 PM   LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 10/21/2025, 3:45:01 PM   LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 10/21/2025, 3:45:01 PM   LOG [InstanceLoader] PlatformStatsModule dependencies initialized
[Nest] 12345  - 10/21/2025, 3:45:01 PM   LOG [RoutesResolver] PlatformStatsController {/api/platform-stats}:
[Nest] 12345  - 10/21/2025, 3:45:01 PM   LOG [RouterExplorer] Mapped {/api/platform-stats/scrape, POST} route
[Nest] 12345  - 10/21/2025, 3:45:01 PM   LOG [RouterExplorer] Mapped {/api/platform-stats/:id, GET} route
[Nest] 12345  - 10/21/2025, 3:45:01 PM   LOG [NestApplication] Nest application successfully started
```

### Production mode

```bash
npm run build
npm run start:prod
```

---

## ✔️ 6. Проверка работы

### Проверка 1: Health check

```bash
curl http://localhost:3000
```

**Ожидается:** JSON ответ от NestJS ✅

### Проверка 2: Создание social account

```bash
curl -X POST http://localhost:3000/api/social-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "00000000-0000-0000-0000-000000000000",
    "platform": "youtube",
    "platform_user_id": "UCUsbfdhYigUiXCaLnHareuQ",
    "username": "BK42Cycles",
    "profile_url": "https://www.youtube.com/@BK42Cycles",
    "is_primary": true
  }'
```

**Ожидается:** `{ "data": { "id": "uuid-...", ... } }` ✅

Скопируй `id` из ответа.

### Проверка 3: Запуск scraping

```bash
curl -X POST http://localhost:3000/api/platform-stats/scrape \
  -H "Content-Type: application/json" \
  -d '{"socialAccountId": "UUID_FROM_STEP_2"}'
```

**Ожидается:** `{ "jobId": "uuid-...", "status": "pending" }` ✅

### Проверка 4: Проверка статуса (через 10-30 сек)

```bash
curl http://localhost:3000/api/platform-stats/job/JOB_UUID
```

**Ожидается:**

```json
{
  "data": {
    "id": "...",
    "status": "completed",
    "result_data": {
      "platform": "youtube",
      "followers_count": 105000,
      "total_views": 50004249,
      ...
    }
  }
}
```

✅ **Если все 4 проверки прошли - установка завершена!**

---

## 📋 7. Импорт Postman коллекции

1. Открой Postman
2. File → Import
3. Upload `backend/CreatorFlow_Platform_Stats.postman_collection.json`
4. Настрой переменные:
   - `base_url`: `http://localhost:3000`
   - `apify_token`: твой токен
   - `rapidapi_key`: твой ключ (опционально)
5. Запускай готовые запросы 🎉

---

## 🛠️ Troubleshooting

### ❌ "Cannot connect to database"

**Проблема:** БД не запущена или неправильный URL.

**Решение:**

```bash
# Проверь что PostgreSQL запущен
docker ps  # Должен быть контейнер с postgres

# Проверь подключение
psql $DATABASE_URL -c "SELECT 1"

# Проверь .env файл
cat backend/.env
```

### ❌ "Table 'creator_profiles' does not exist"

**Проблема:** Миграции не применены.

**Решение:**

```bash
cd backend
npm run db:migrate
```

### ❌ "Invalid Apify token"

**Проблема:** Токен неправильный или истёк.

**Решение:**
1. Зайди в https://console.apify.com/account/integrations
2. Сгенерируй новый токен
3. Обнови `.env`
4. Перезапусти backend

### ❌ "Module not found: drizzle-orm"

**Проблема:** Зависимости не установлены.

**Решение:**

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### ❌ "fetch is not defined"

**Проблема:** Node.js < 18.

**Решение:**
1. Обнови Node.js до версии 18+
2. Или установи polyfill: `npm install node-fetch`

### ❌ "Port 3000 already in use"

**Проблема:** Порт занят.

**Решение:**

Измени порт в `.env`:

```env
PORT=3001
```

Или останови процесс на порту 3000:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Дополнительные ресурсы

- `QUICKSTART_PLATFORM_STATS.md` - быстрый старт за 5 минут
- `PLATFORM_STATS_SETUP.md` - детальная настройка провайдеров
- `ENV_SETUP_INSTRUCTIONS.md` - настройка переменных окружения
- `PLATFORM_RESPONSES_EXAMPLES.md` - примеры ответов API и SQL
- `PLATFORM_STATS_SUMMARY.md` - общий обзор фичи

---

## ✅ Checklist финальной проверки

- [ ] Node.js >= 18 установлен
- [ ] PostgreSQL запущен
- [ ] Файл `.env` создан и заполнен
- [ ] Зависимости установлены (`npm install`)
- [ ] Миграции применены (`npm run db:migrate`)
- [ ] Backend запущен (`npm run start:dev`)
- [ ] Тесты через curl прошли успешно
- [ ] Postman коллекция импортирована
- [ ] Apify/RapidAPI токены получены

**Если все пункты отмечены - готово к использованию! 🎉**





