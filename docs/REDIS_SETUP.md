# Redis Setup для Auth модуля

## Быстрый старт (Docker - рекомендуется)

### 1. Установка Docker Desktop

Если Docker еще не установлен:
1. Скачай: https://www.docker.com/products/docker-desktop
2. Установи и запусти Docker Desktop

### 2. Запуск Redis через docker-compose

```bash
cd backend
docker-compose up redis -d
```

**Проверка:**
```bash
docker-compose ps
```

Должен быть запущен контейнер `redis`.

### 3. Проверка подключения

```bash
# Через redis-cli (если установлен)
redis-cli ping
# Ответ: PONG

# Или через Docker
docker exec -it backend-redis-1 redis-cli ping
```

---

## Альтернативные способы

### Вариант А: Memurai (Windows-native)

1. Скачай: https://www.memurai.com/get-memurai
2. Установи как Windows Service
3. По умолчанию работает на `localhost:6379`

### Вариант Б: WSL2 + Redis

```bash
# В WSL2 (Ubuntu)
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

### Вариант В: Chocolatey

```powershell
choco install redis-64
redis-server
```

---

## Настройка .env

После запуска Redis добавь в `backend/.env`:

```env
REDIS_URL=redis://localhost:6379
```

Если используешь Docker Compose, это значение по умолчанию, можно не указывать.

---

## Управление через Docker

```bash
# Запустить
docker-compose up redis -d

# Остановить
docker-compose stop redis

# Перезапустить
docker-compose restart redis

# Посмотреть логи
docker-compose logs redis

# Удалить контейнер и данные
docker-compose down redis
```

---

## Проверка работы Auth модуля

После запуска Redis и backend:

```bash
# Backend должен запуститься без ошибок ECONNREFUSED
npm run start:dev
```

Ожидаемый вывод в логах:
```
[Nest] ... LOG [InstanceLoader] AuthModule dependencies initialized
✓ Redis connected successfully
```

---

## Troubleshooting

**Ошибка: `ECONNREFUSED ::1:6379`**
- Redis не запущен
- Проверь: `docker-compose ps`
- Запусти: `docker-compose up redis -d`

**Ошибка: `port 6379 is already in use`**
- Другой процесс использует порт
- Измени порт в `docker-compose.yml`: `'6380:6379'`
- Обнови `.env`: `REDIS_URL=redis://localhost:6380`

**Docker не запускается**
- Проверь, что Docker Desktop запущен
- Проверь порты: `netstat -ano | findstr :6379`


