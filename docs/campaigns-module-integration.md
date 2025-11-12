# Campaigns Module - Integration Documentation

## Обзор

Модуль `campaigns` реализует функциональность управления кампаниями брендов, включая:
- Создание и управление кампаниями
- Автоматический поиск и назначение креаторов
- Интеграцию с Apify для сбора данных
- Очередь задач для асинхронной обработки

## Архитектура модуля

Модуль следует **Clean Architecture** принципам с разделением на слои:

```
campaigns/
├── domain/                    # Доменный слой (бизнес-логика)
│   ├── entities/              # Сущности
│   │   ├── campaign.entity.ts
│   │   ├── campaign-allocation.entity.ts
│   │   └── campaign-tracking-config.entity.ts
│   ├── value-objects/         # Value Objects
│   │   ├── campaign-status.vo.ts
│   │   └── allocation-status.vo.ts
│   └── repositories/          # Интерфейсы репозиториев
│       ├── campaign.repository.interface.ts
│       ├── campaign-allocation.repository.interface.ts
│       └── campaign-tracking-config.repository.interface.ts
│
├── application/               # Слой приложения (Use Cases)
│   └── use-cases/
│       ├── create-campaign.use-case.ts
│       ├── activate-campaign.use-case.ts
│       ├── find-creator-for-campaign.use-case.ts
│       └── collect-creator-data.use-case.ts
│
├── infrastructure/            # Инфраструктурный слой
│   ├── persistence/          # Репозитории (Drizzle ORM)
│   │   ├── campaign.repository.ts
│   │   ├── campaign-allocation.repository.ts
│   │   └── campaign-tracking-config.repository.ts
│   └── services/             # Внешние сервисы
│       └── apify-jobs-queue.service.ts
│
└── presentation/              # Слой представления (API)
    ├── controllers/
    │   └── campaign.controller.ts
    └── dto/
        ├── create-campaign.dto.ts
        └── campaign-response.dto.ts
```

## Интеграция с существующими модулями

### 1. Зависимости модуля

```typescript
CampaignsModule
├── AuthModule          # JWT авторизация
├── ScraperModule       # ApifyScraperService для сбора данных
└── Shared Database     # Drizzle ORM, схема БД
```

### 2. Использование существующих сервисов

#### ApifyScraperService (из ScraperModule)

**Расширен функционал:**
- ✅ `scrapePosts()` - уже существовал (сбор постов)
- ✅ `scrapeProfile()` - **добавлен** (сбор профиля креатора)

**Использование:**
```typescript
// В CollectCreatorDataUseCase
const profileData = await apifyScraper.scrapeProfile({
  username: 'creator_username',
  platform: PlatformTypeVO.instagram(),
});
```

#### Database Schema

**Используемые таблицы:**
- `campaigns` - кампании
- `campaign_allocations` - распределения бюджета
- `campaign_tracking_config` - правила детекта постов
- `creator_social_profiles` - профили креаторов (для поиска)
- `apify_jobs_queue` - очередь Apify задач
- `posts` - посты креаторов (будет использоваться позже)

### 3. Интеграция с AuthModule

**JwtAuthGuard:**
- Все endpoints защищены через `@UseGuards(JwtAuthGuard)`
- `req.user.brandId` используется для авторизации (только владелец может управлять кампанией)

## Основные компоненты

### Domain Entities

#### Campaign
- Представляет кампанию бренда
- Методы: `activate()`, `pause()`, `complete()`, `updateCurrentBudget()`
- Статусы: `draft`, `active`, `paused`, `completed`

#### CampaignAllocation
- Представляет распределение бюджета креатору
- Методы: `accept()`, `activate()`, `decline()`, `updateMetrics()`
- Статусы: `pending`, `accepted`, `active`, `completed`, `declined`

#### CampaignTrackingConfig
- Правила для автоматического определения campaign posts
- Содержит: хештеги, mentions, tracking links, min confidence

### Use Cases

#### CreateCampaignUseCase
**Назначение:** Создание новой кампании

**Процесс:**
1. Валидация данных (даты, бюджет)
2. Создание `Campaign` entity со статусом `draft`
3. Опциональное создание `CampaignTrackingConfig`
4. Сохранение в БД

**Зависимости:**
- `ICampaignRepository`
- `ICampaignTrackingConfigRepository`

#### ActivateCampaignUseCase
**Назначение:** Активация кампании и назначение креатора

**Процесс:**
1. Проверка авторизации (brandId)
2. Поиск подходящего креатора через `FindCreatorForCampaignUseCase`
3. Создание `CampaignAllocation`
4. Активация кампании (status: `active`)
5. Добавление jobs в очередь Apify через `CollectCreatorDataUseCase`

**Зависимости:**
- `ICampaignRepository`
- `ICampaignAllocationRepository`
- `FindCreatorForCampaignUseCase`
- `CollectCreatorDataUseCase`

#### FindCreatorForCampaignUseCase
**Назначение:** Поиск подходящего креатора в БД

**Критерии поиска:**
- Платформы кампании
- Размер аудитории (micro/mid-tier/macro/mega)
- Локация (если указана)
- Статус креатора = `active`
- Приоритет: verified данные > declared данные

**SQL запрос:**
```sql
SELECT csp.*, p.status
FROM creator_social_profiles csp
JOIN profile p ON p.id = csp.creator_id
WHERE 
  csp.platform = ANY($platforms)
  AND p.status = 'active'
  AND (followers_verified OR followers_declared)
  AND audience_size_filter
  AND location_filter
ORDER BY verified_priority, engagement_rate DESC
LIMIT 1
```

#### CollectCreatorDataUseCase
**Назначение:** Добавление jobs в очередь Apify для сбора данных

**Процесс:**
1. Валидация platform
2. Получение actor ID для платформы
3. Добавление job `profile_scrape` (приоритет 80)
4. Добавление job `posts_scrape` (приоритет 70)

**Метод `processProfileResult()`:**
- Обновляет `creator_social_profiles` с verified данными из Apify
- Сохраняет: followers, engagement_rate, bio, is_verified

**Зависимости:**
- `ApifyScraperService` (из ScraperModule)
- `ApifyJobsQueueService`
- `ICampaignAllocationRepository`
- `Database` (для прямого обновления)

### Infrastructure Services

#### ApifyJobsQueueService
**Назначение:** Управление очередью Apify jobs

**Методы:**
- `addJob()` - добавить job в очередь
- `getNextPendingJob()` - получить следующий job (для worker)
- `markJobAsRunning()` - пометить как выполняющийся
- `markJobAsCompleted()` - пометить как завершенный
- `markJobAsFailed()` - пометить как проваленный (с retry логикой)

**Таблица:** `apify_jobs_queue`

**Приоритеты:**
- 80-100: высокий (initial collection)
- 60-79: средний (periodic updates)
- 0-59: низкий

## Флоу работы

### 1. Создание кампании

```
Brand → POST /campaigns
  → CreateCampaignUseCase
    → CampaignRepository.save()
    → CampaignTrackingConfigRepository.save() (опционально)
  → Response: { id, name, status: 'draft' }
```

### 2. Активация кампании

```
Brand → POST /campaigns/:id/activate
  → ActivateCampaignUseCase
    → FindCreatorForCampaignUseCase
      → SQL: поиск в creator_social_profiles
      → Return: creatorMatch
    → CampaignAllocationRepository.save()
    → CampaignRepository.save() (status: 'active')
    → CollectCreatorDataUseCase
      → ApifyJobsQueueService.addJob(profile_scrape)
      → ApifyJobsQueueService.addJob(posts_scrape)
  → Response: { campaign, allocation, creator }
```

### 3. Обработка Apify jobs (будущий Worker)

```
Apify Worker (отдельный процесс)
  → ApifyJobsQueueService.getNextPendingJob()
  → ApifyScraperService.scrapeProfile() или scrapePosts()
  → ApifyJobsQueueService.markJobAsCompleted()
  → CollectCreatorDataUseCase.processProfileResult() (для profile)
  → Сохранение постов в posts (для posts)
```

## Схема БД и связи

### Основные таблицы

```
campaigns
  ├── brand_id → brands.id
  └── id → campaign_allocations.campaign_id
          → campaign_tracking_config.campaign_id

campaign_allocations
  ├── campaign_id → campaigns.id
  ├── creator_id → profile.id
  └── id → apify_jobs_queue.allocation_id

campaign_tracking_config
  └── campaign_id → campaigns.id (UNIQUE)

creator_social_profiles
  ├── creator_id → profile.id
  └── id → apify_jobs_queue.social_profile_id
          → posts.social_profile_id

apify_jobs_queue
  ├── social_profile_id → creator_social_profiles.id
  ├── campaign_id → campaigns.id
  └── allocation_id → campaign_allocations.id
```

## API Endpoints

### POST /campaigns
**Описание:** Создать новую кампанию

**Request:**
```json
{
  "name": "Summer 2025 Campaign",
  "description": "Promote summer collection",
  "budget": 1000000,
  "goals": ["reach", "engagement"],
  "platforms": ["instagram", "tiktok"],
  "audienceSize": "mid-tier",
  "targetLocation": "United States",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z",
  "trackingConfig": {
    "requiredHashtags": ["#brandname"],
    "minMatchConfidence": 0.7
  }
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer 2025 Campaign",
  "status": "draft",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### GET /campaigns
**Описание:** Список всех кампаний бренда

**Response:**
```json
[
  {
    "id": "...",
    "name": "Summer 2025 Campaign",
    "status": "active",
    "budget": 1000000,
    "currentBudget": 1000000,
    "startDate": "2025-06-01T00:00:00Z",
    "endDate": "2025-08-31T23:59:59Z"
  }
]
```

### GET /campaigns/:id
**Описание:** Детали кампании

**Response:**
```json
{
  "id": "...",
  "name": "Summer 2025 Campaign",
  "description": "Promote summer collection",
  "status": "active",
  "budget": 1000000,
  "currentBudget": 1000000,
  "goals": ["reach", "engagement"],
  "platforms": ["instagram", "tiktok"],
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z"
}
```

### POST /campaigns/:id/activate
**Описание:** Активировать кампанию и назначить креатора

**Response:**
```json
{
  "campaign": {
    "id": "...",
    "status": "active"
  },
  "allocation": {
    "id": "...",
    "creatorId": "...",
    "allocatedBudget": 1000000,
    "status": "pending"
  },
  "creator": {
    "id": "...",
    "username": "creator_username",
    "platform": "instagram"
  }
}
```

### GET /campaigns/:id/allocations
**Описание:** Список allocations кампании

**Response:**
```json
[
  {
    "id": "...",
    "creatorId": "...",
    "allocatedBudget": 1000000,
    "currentBudget": 1000000,
    "status": "active",
    "reach": 10000,
    "engagement": 5000,
    "postsCount": 10
  }
]
```

## Интеграция с существующим кодом

### 1. Расширение ApifyScraperService

**Файл:** `backend/src/modules/scraper/infrastructure/services/apify-scraper.service.ts`

**Добавлено:**
- `ScrapeProfileOptions` interface
- `CreatorProfileData` interface
- `scrapeProfile()` method
- `prepareProfileInput()` method
- `transformProfileResult()` method

**Использование:**
```typescript
const profileData = await apifyScraper.scrapeProfile({
  username: 'mrbeast',
  platform: PlatformTypeVO.youtube(),
});
// Returns: { followers, engagementRate, bio, isVerified, ... }
```

### 2. Использование существующей схемы БД

**Таблицы из shared schema:**
- `creator_social_profiles` - для поиска креаторов
- `profile` - для проверки статуса
- `apify_jobs_queue` - для очереди задач
- `posts` - для хранения постов (будет использоваться)

### 3. Dependency Injection

**Токены:**
- `CAMPAIGNS_DI_TOKENS.CAMPAIGN_REPOSITORY`
- `CAMPAIGNS_DI_TOKENS.CAMPAIGN_ALLOCATION_REPOSITORY`
- `CAMPAIGNS_DI_TOKENS.CAMPAIGN_TRACKING_CONFIG_REPOSITORY`
- `CAMPAIGNS_DI_TOKENS.APIFY_JOBS_QUEUE_SERVICE`

**Импорты модулей:**
- `AuthModule` - для JwtAuthGuard
- `ScraperModule` - для ApifyScraperService

## Следующие шаги (Post-MVP)

### 1. Apify Worker
**Назначение:** Обработка jobs из очереди

**Логика:**
```typescript
// Worker process (отдельный сервис)
while (true) {
  const job = await apifyJobsQueue.getNextPendingJob();
  if (!job) {
    await sleep(5000);
    continue;
  }
  
  await apifyJobsQueue.markJobAsRunning(job.id);
  
  try {
    if (job.jobType === 'profile_scrape') {
      const profile = await apifyScraper.scrapeProfile(...);
      await collectCreatorDataUseCase.processProfileResult(...);
    } else if (job.jobType === 'posts_scrape') {
      const posts = await apifyScraper.scrapePosts(...);
      // Сохранить посты в БД
    }
    
    await apifyJobsQueue.markJobAsCompleted(job.id, result);
  } catch (error) {
    await apifyJobsQueue.markJobAsFailed(job.id, error.message);
  }
}
```

### 2. Post Detection Service
**Назначение:** Автоматическое определение campaign posts

**Логика:**
- Использовать функцию `detect_campaign_post()` из БД
- Обновлять `posts.is_campaign_content` и `campaign_match_confidence`

### 3. Metrics Collection Service
**Назначение:** Сбор и обновление метрик allocation

**Логика:**
- Агрегировать метрики из `posts` (reach, engagement)
- Агрегировать из `events_aggregated` (conversions, ctr)
- Обновлять `campaign_allocations` метрики

### 4. Cron Jobs
**Назначение:** Периодический мониторинг

**Задачи:**
- Каждые 12 часов: обновление постов через Apify
- Каждый час: агрегация events
- Каждый день: очистка старых данных

## Резюме

### Что реализовано:
✅ Модуль campaigns с Clean Architecture  
✅ Создание и активация кампаний  
✅ Поиск креаторов в БД  
✅ Интеграция с Apify через очередь jobs  
✅ Расширение ApifyScraperService для профилей  
✅ Swagger документация  
✅ Репозитории с Drizzle ORM  

### Что осталось:
⏳ Apify Worker для обработки jobs  
⏳ Post Detection Service  
⏳ Metrics Collection Service  
⏳ Cron Jobs для мониторинга  
⏳ Event Tracking (UTM links)  
⏳ Budget Reallocation (формула)  

### Интеграция:
- ✅ Использует существующие модули (Auth, Scraper)
- ✅ Использует существующую схему БД
- ✅ Следует архитектуре проекта
- ✅ Готов к расширению

Модуль готов к использованию для создания и активации кампаний. Следующий этап - создание Worker для обработки Apify jobs.

