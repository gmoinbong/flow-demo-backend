# Инструкции по деплою

## Docker сборка

### Локальная разработка

```bash
# Запуск всех сервисов (БД, Redis, Backend)
docker-compose up -d

# Просмотр логов
docker-compose logs -f backend

# Остановка
docker-compose down
```

### Production сборка

```bash
# Сборка образа
docker build -t creatorflow-backend:latest .

# Запуск с переменными окружения
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379 \
  -e JWT_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  -e APIFY_API_TOKEN=your-token \
  creatorflow-backend:latest

# Или через docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

## Деплой на Render.com

Render.com поддерживает Docker деплой из Git репозитория.

### Шаги:

1. **Подключите репозиторий** в Render Dashboard
2. **Создайте новый Web Service**
3. **Настройки:**
   - **Build Command**: `docker build -t creatorflow-backend .`
   - **Start Command**: `docker run -p $PORT:3000 creatorflow-backend`
   - **Environment**: `production`
   - **Dockerfile Path**: `backend/Dockerfile` (если репозиторий в корне)

4. **Переменные окружения** (Environment Variables):
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://... (создайте отдельный PostgreSQL сервис)
   REDIS_URL=redis://... (создайте отдельный Redis сервис)
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   APIFY_API_TOKEN=your-apify-token
   ```

5. **Создайте PostgreSQL сервис** в Render:
   - В Dashboard → New → PostgreSQL
   - Скопируйте Internal Database URL
   - Используйте его как `DATABASE_URL`

6. **Создайте Redis сервис** (опционально, если нужен):
   - В Dashboard → New → Redis
   - Скопируйте Internal Redis URL

7. **Запустите миграции** после первого деплоя:
   ```bash
   # Через Render Shell или локально с подключением к БД
   npm run db:migrate
   ```

### Важно для Render.com:

- Render автоматически устанавливает переменную `PORT` - убедитесь что приложение её использует
- Используйте Internal Database URL для подключения к БД (быстрее и безопаснее)
- Render предоставляет бесплатный тариф с ограничениями (спит после 15 минут бездействия)

## Альтернативные варианты бесплатного деплоя

### 1. Railway.app (рекомендуется)
- ✅ Бесплатный тариф $5/месяц (кредиты)
- ✅ Автоматический деплой из Git
- ✅ Встроенные PostgreSQL и Redis
- ✅ Поддержка Docker
- ✅ Не засыпает

**Настройка:**
1. Подключите GitHub репозиторий
2. Создайте новый проект
3. Добавьте PostgreSQL и Redis сервисы
4. Настройте переменные окружения
5. Railway автоматически определит Dockerfile

### 2. Fly.io
- ✅ Бесплатный тариф (ограниченные ресурсы)
- ✅ Глобальная сеть
- ✅ Docker-first платформа
- ✅ Не засыпает

**Настройка:**
```bash
# Установите flyctl
curl -L https://fly.io/install.sh | sh

# Логин
fly auth login

# Инициализация (в папке backend)
fly launch

# Создайте PostgreSQL
fly postgres create

# Привяжите к приложению
fly postgres attach <postgres-app-name>
```

### 3. Render.com (уже описан выше)
- ✅ Бесплатный тариф
- ⚠️ Засыпает после 15 минут бездействия
- ✅ Простая настройка

### 4. Cyclic.sh
- ✅ Бесплатный тариф
- ✅ Автоматический деплой из Git
- ⚠️ Засыпает при бездействии
- ✅ Поддержка Docker

### 5. Koyeb
- ✅ Бесплатный тариф
- ✅ Docker support
- ✅ Глобальная сеть
- ⚠️ Ограниченные ресурсы

## Рекомендации

**Для production:**
1. **Railway.app** - лучший баланс бесплатного и функциональности
2. **Fly.io** - если нужна глобальная сеть и Docker-first подход

**Для разработки/тестирования:**
1. **Render.com** - простая настройка, подходит для MVP
2. **Cyclic.sh** - минимальная конфигурация

## Переменные окружения

Обязательные переменные для production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_WRITE_URL=postgresql://user:password@host:5432/dbname  # опционально
REDIS_URL=redis://host:6379  # опционально, если используется
JWT_SECRET=your-strong-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-strong-refresh-secret-key-min-32-chars
APIFY_API_TOKEN=your-apify-api-token  # для scraper функциональности
```

## Миграции БД

После деплоя обязательно запустите миграции:

```bash
# Локально с подключением к production БД
DATABASE_URL=postgresql://... npm run db:migrate

# Или через Render Shell / Railway CLI
npm run db:migrate
```

## Health Check

Приложение должно отвечать на `/health` endpoint для health checks платформ.

Если endpoint отсутствует, добавьте в `app.controller.ts`:

```typescript
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

