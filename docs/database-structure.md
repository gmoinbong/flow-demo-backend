# Database Structure

## Основные таблицы

### 1. `users` - Пользователи системы
- `id` (UUID) - Primary Key
- `email` (TEXT) - Уникальный email
- `password_hash` (TEXT) - Хэш пароля (nullable для OAuth)
- `role_id` (INTEGER) - Ссылка на `user_role.id`
- `created_at`, `updated_at` (TIMESTAMP)

### 2. `user_role` - Роли пользователей
- `id` (SERIAL) - Primary Key
- `name` (VARCHAR(20)) - Название роли: `creator`, `brand`, `admin`

**Важно**: Роль определяется через `users.role_id -> user_role`, а не хранится в `profile`.

### 3. `profile` - Профиль пользователя (1:1 с users)
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key -> `users.id` (unique)
- `display_name` (TEXT) - Отображаемое имя
- `bio` (TEXT) - Биография
- `avatar_url` (TEXT) - URL аватара
- `status` (VARCHAR(20)) - Статус профиля: `active`, `pending`, `suspended`
- `created_at`, `updated_at` (TIMESTAMP)

**Важно**: 
- `profile` используется для всех типов пользователей (creator, brand, admin)
- Тип пользователя определяется через `users.role_id -> user_role.name`
- `status` - это статус профиля, не роль

### 4. `social_accounts` - Социальные аккаунты
- `id` (UUID) - Primary Key
- `creator_id` (UUID) - Foreign Key -> `profile.id`
- `platform` (VARCHAR(20)) - Платформа: `youtube`, `tiktok`, `instagram`
- `platform_user_id` (TEXT) - ID пользователя на платформе
- `username` (TEXT) - Username/handle
- `metadata` (JSONB) - Дополнительные данные платформы
- `is_primary` (BOOLEAN) - Основной аккаунт
- `last_sync_at` (TIMESTAMP) - Время последней синхронизации
- `created_at` (TIMESTAMP)

**Важно**: `creator_id` ссылается на `profile.id`, так как социальные аккаунты могут быть у любого типа пользователя.

### 5. `brands` - Бренды
- `id` (UUID) - Primary Key
- `name` (TEXT) - Название бренда (NOT NULL)
- `description` (TEXT) - Описание
- `website_url` (TEXT) - URL сайта
- `logo_url` (TEXT) - URL логотипа
- `brand_type` (VARCHAR(20)) - Тип бренда: `agency`, `direct`, `platform`
- `profile_id` (UUID) - Foreign Key -> `profile.id` (optional)
- `created_at`, `updated_at` (TIMESTAMP)

**Важно**: 
- `brands` - отдельная сущность, не связанная напрямую с `user_role`
- `profile_id` опционален - используется если бренд имеет пользовательский аккаунт
- Связь creator-brand через `creator_brand_relationships`

### 6. `creator_brand_relationships` - Связь Creator-Brand (many-to-many)
- `id` (UUID) - Primary Key
- `creator_id` (UUID) - Foreign Key -> `profile.id` (NOT NULL)
- `brand_id` (UUID) - Foreign Key -> `brands.id` (NOT NULL)
- `role` (VARCHAR(20)) - Роль в отношениях: `owner`, `manager`, `collaborator`
- `status` (VARCHAR(20)) - Статус связи: `active`, `pending`, `inactive`
- `created_at` (TIMESTAMP)

**Важно**: 
- `creator_id` ссылается на `profile` с ролью `creator`
- Связывает креаторов с брендами

### 7. `platform_stats` - Статистика платформ
- `id` (UUID) - Primary Key
- `social_account_id` (UUID) - Foreign Key -> `social_accounts.id`
- `followers_count` (INTEGER) - Количество подписчиков
- `following_count` (INTEGER) - Количество подписок
- `total_posts` (INTEGER) - Общее количество постов
- `total_views` (INTEGER) - Общее количество просмотров
- `engagement_rate` (TEXT) - Engagement rate (например, "3.5%")
- `raw_data` (JSONB) - Сырые данные от скрапера
- `scraped_at` (TIMESTAMP) - Время скрапинга
- `provider` (VARCHAR(50)) - Провайдер: `apify`, `rapidapi`, `self-hosted`
- `ttl_expires_at` (TIMESTAMP) - Время истечения кэша

### 8. `scraper_jobs` - Задачи скрапинга
- `id` (UUID) - Primary Key
- `social_account_id` (UUID) - Foreign Key -> `social_accounts.id`
- `status` (VARCHAR(20)) - Статус: `pending`, `running`, `completed`, `failed`
- `provider` (VARCHAR(50)) - Провайдер скрапинга
- `platform` (VARCHAR(20)) - Платформа: `youtube`, `tiktok`, `instagram`
- `started_at` (TIMESTAMP) - Время начала
- `completed_at` (TIMESTAMP) - Время завершения
- `error_message` (TEXT) - Сообщение об ошибке
- `result_data` (JSONB) - Результаты скрапинга
- `retry_count` (INTEGER) - Количество попыток (default: 0)
- `max_retries` (INTEGER) - Максимум попыток (default: 3)
- `priority` (INTEGER) - Приоритет (default: 0)
- `created_at` (TIMESTAMP)

### 9. `analytics_reports` - Отчеты по аналитике
- `id` (UUID) - Primary Key
- `creator_id` (UUID) - Foreign Key -> `profile.id` (optional)
- `brand_id` (UUID) - Foreign Key -> `brands.id` (optional)
- `report_type` (VARCHAR(20)) - Тип отчета: `summary`, `detailed`, `comparison`
- `period_start` (TIMESTAMP) - Начало периода
- `period_end` (TIMESTAMP) - Конец периода
- `data` (JSONB) - Структурированные данные отчета
- `created_at` (TIMESTAMP)

### 10. `statistics_calculations` - Кэш расчетов статистики
- `id` (UUID) - Primary Key
- `entity_type` (VARCHAR(20)) - Тип сущности: `creator`, `brand`
- `entity_id` (UUID) - ID сущности
- `calculation_type` (VARCHAR(20)) - Тип расчета: `engagement_rate`, `growth_rate`, `trend`
- `period` (VARCHAR(20)) - Период: `daily`, `weekly`, `monthly`
- `value` (TEXT) - Значение (хранится как текст для различных форматов)
- `metadata` (JSONB) - Метаданные
- `calculated_at` (TIMESTAMP) - Время расчета
- `expires_at` (TIMESTAMP) - Время истечения

## Связи между таблицами

```
users (1) ──(role_id)──> (1) user_role
  │
  │ (1:1)
  │
  ▼
profile (1) ──(creator_id)──> (many) social_accounts
  │                              │
  │                              │ (1:many)
  │                              ▼
  │                          platform_stats
  │                              │
  │                              │ (1:many)
  │                              ▼
  │                          scraper_jobs
  │
  │ (1:many)
  │
  ▼
creator_brand_relationships (many:many) brands
  │                              │
  │                              │ (optional 1:1)
  │                              ▼
  │                          profile (brand user)
```

## Логика работы

1. **Роли**: Роль пользователя определяется через `users.role_id -> user_role.name`, а не хранится в `profile`.

2. **Profile**: Один профиль на пользователя, используется для всех типов (creator, brand, admin). Тип определяется через роль.

3. **Brands**: Отдельная сущность. Может быть связана с `profile` через `profile_id` (если бренд имеет пользовательский аккаунт).

4. **Creator-Brand**: Связь через `creator_brand_relationships`, где `creator_id` ссылается на `profile.id` с ролью `creator`.

5. **Social Accounts**: Связаны с `profile.id` через `creator_id`, так как социальные аккаунты могут быть у любого типа пользователя.

