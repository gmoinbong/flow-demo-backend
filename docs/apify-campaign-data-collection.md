в# Архитектура сбора данных для кампаний через Apify

## Обзор

Документ описывает архитектуру автоматического сбора данных о креаторах и их контенте через Apify на основе параметров кампании.

## Текущее состояние

### Фронтенд (campaigns/new)
Кампания собирает следующую информацию:
- **Campaign Details**: название, описание, цели
- **Target Audience**: возраст, пол, локация, интересы, размер аудитории
- **Content Requirements**: типы контента (Instagram Posts/Stories/Reels, TikTok, YouTube)
- **Budget & Timeline**: бюджет, таймлайн, условия оплаты, KPI

### Бэкенд (scraper module)
Уже реализовано:
- `ApifyScraperService` - базовый сервис для работы с Apify
- `FetchPostsUseCase` - сбор постов по username и платформе
- Поддержка Instagram, TikTok, YouTube
- Фильтрация по датам

## Предлагаемая архитектура

### 1. Расширение ApifyScraperService

#### 1.1. Сбор профилей креаторов

**Новый метод**: `scrapeCreatorProfile(options)`

Собирает:
- Базовую информацию профиля (имя, bio, верификация)
- Статистику (followers, following, posts count)
- Engagement rate (расчетный)
- Ниши/категории контента
- Локацию
- Демографию аудитории (если доступно)

**Apify Actors**:
- Instagram: `apify~instagram-profile-scraper` или `apify~instagram-scraper` (профиль)
- TikTok: `apify~tiktok-profile-scraper` или `apify~tiktok-scraper` (профиль)
- YouTube: `apify~youtube-channel-scraper` или `apify~youtube-scraper` (канал)

**Input для Apify**:
```typescript
{
  username: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  includeStats: true;
  includePosts: false; // только профиль
}
```

#### 1.2. Поиск креаторов по критериям

**Новый метод**: `searchCreatorsByCriteria(criteria)`

Использует Apify Actors для поиска:
- По хештегам/ключевым словам (Instagram, TikTok)
- По категориям (YouTube)
- По локации
- По размеру аудитории (фильтрация результатов)

**Apify Actors**:
- Instagram: `apify~instagram-hashtag-scraper`
- TikTok: `apify~tiktok-hashtag-scraper`
- YouTube: `apify~youtube-search-scraper`

**Input для Apify**:
```typescript
{
  keywords: string[]; // из campaign.targetAudience
  platform: string;
  minFollowers?: number;
  maxFollowers?: number;
  location?: string;
  limit: number;
}
```

#### 1.3. Сбор аналитики постов

**Расширение**: `scrapePostsWithAnalytics(options)`

Дополнительно собирает:
- Engagement metrics (likes, comments, shares, views)
- Reach и impressions (если доступно)
- Время публикации
- Тип контента (post, story, reel, video)
- Хештеги и mentions
- Sentiment анализа (опционально)

#### 1.4. Мониторинг кампании в реальном времени

**Новый метод**: `monitorCampaignContent(campaignId, allocationIds)`

Периодически собирает:
- Новые посты креаторов, участвующих в кампании
- Обновления статистики постов
- Performance метрики

### 2. Новые Use Cases

#### 2.1. `CollectCreatorsForCampaignUseCase`

**Цель**: Найти и собрать профили креаторов, подходящих под критерии кампании

**Логика**:
1. Извлечь критерии из кампании:
   - `targetAudience` → keywords для поиска
   - `platforms` → платформы для поиска
   - `audienceSize` → min/max followers
   - `targetLocation` → фильтр по локации
2. Для каждой платформы:
   - Вызвать `searchCreatorsByCriteria()`
   - Собрать профили найденных креаторов
   - Рассчитать match score
3. Вернуть отсортированный список с match scores

**Входные данные**:
```typescript
{
  campaignId: string;
  limit?: number; // сколько креаторов найти
}
```

**Выходные данные**:
```typescript
{
  creators: Array<{
    profile: CreatorProfile;
    platforms: PlatformProfile[];
    matchScore: number;
    matchReasons: string[];
  }>;
  totalFound: number;
}
```

#### 2.2. `CollectCreatorAnalyticsUseCase`

**Цель**: Собрать детальную аналитику по креатору для оценки

**Логика**:
1. Собрать профиль креатора
2. Собрать последние N постов (например, 30)
3. Рассчитать:
   - Средний engagement rate
   - Типы контента
   - Частоту публикаций
   - Тематику контента (из хештегов/описаний)
4. Сохранить в БД для дальнейшего использования

**Входные данные**:
```typescript
{
  creatorId: string;
  platform: string;
  username: string;
  postsLimit?: number;
}
```

#### 2.3. `MonitorCampaignPerformanceUseCase`

**Цель**: Мониторить производительность кампании в реальном времени

**Логика**:
1. Получить все allocations для кампании
2. Для каждого креатора:
   - Собрать новые посты с начала кампании
   - Обновить метрики (reach, engagement, conversions)
3. Сохранить обновления в БД
4. Отправить уведомления при значительных изменениях

**Запуск**: По расписанию (cron) или по запросу

### 3. Структура данных

#### 3.1. CreatorProfile (новый entity)

```typescript
interface CreatorProfile {
  id: string;
  creatorId: string;
  platform: PlatformType;
  username: string;
  
  // Profile data
  displayName: string;
  bio: string;
  profileImageUrl: string;
  isVerified: boolean;
  location?: string;
  
  // Statistics
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: number; // calculated
  
  // Content analysis
  niches: string[]; // extracted from bio/posts
  contentTypes: string[]; // posts, stories, reels, videos
  avgPostFrequency: number; // posts per week
  
  // Demographics (if available)
  audienceAgeRange?: { min: number; max: number };
  audienceGender?: { male: number; female: number };
  topLocations?: Array<{ country: string; percentage: number }>;
  
  // Metadata
  collectedAt: Date;
  lastUpdatedAt: Date;
  source: 'apify';
  rawData: Record<string, any>;
}
```

#### 3.2. PostAnalytics (расширение PostData)

```typescript
interface PostAnalytics extends PostData {
  // Engagement metrics
  engagementRate: number; // (likes + comments + shares) / followers
  reach?: number;
  impressions?: number;
  
  // Content analysis
  hashtags: string[];
  mentions: string[];
  contentType: 'post' | 'story' | 'reel' | 'video';
  
  // Campaign tracking
  campaignId?: string;
  allocationId?: string;
  isCampaignContent: boolean;
  
  // Performance
  ctr?: number; // click-through rate if link present
  sentiment?: 'positive' | 'neutral' | 'negative';
}
```

### 4. Интеграция с Campaign

#### 4.1. Автоматический запуск при создании кампании

**Триггер**: После создания кампании (campaign.status = 'active')

**Действия**:
1. Вызвать `CollectCreatorsForCampaignUseCase`
2. Сохранить найденных креаторов
3. Создать allocations для топ-N креаторов
4. Отправить уведомления бренду

#### 4.2. Периодическое обновление

**Cron job**: Каждые 6-12 часов

**Действия**:
1. Найти активные кампании
2. Для каждой кампании:
   - Обновить профили креаторов
   - Собрать новые посты
   - Обновить метрики производительности

### 5. API Endpoints

#### 5.1. POST `/scraper/campaigns/:campaignId/collect-creators`

Запустить поиск креаторов для кампании

**Request**:
```typescript
{
  limit?: number; // default 50
  platforms?: string[]; // если не указано - из кампании
}
```

**Response**:
```typescript
{
  creators: CreatorProfile[];
  totalFound: number;
  matchScores: MatchScore[];
}
```

#### 5.2. POST `/scraper/creators/:creatorId/analytics`

Собрать аналитику по конкретному креатору

**Request**:
```typescript
{
  platform: string;
  username: string;
  postsLimit?: number;
}
```

#### 5.3. POST `/scraper/campaigns/:campaignId/monitor`

Запустить мониторинг кампании

**Response**:
```typescript
{
  updatedAllocations: number;
  newPosts: number;
  updatedMetrics: {
    totalReach: number;
    totalEngagement: number;
    totalConversions: number;
  };
}
```

### 6. Матчинг креаторов с кампанией

#### 6.1. Алгоритм матчинга

Расширить существующий `matchCreatorsForCampaign`:

1. **Niche matching (40%)**:
   - Сравнить `campaign.targetAudience` с `creatorProfile.niches`
   - Использовать NLP для семантического сравнения

2. **Audience size (25%)**:
   - Сравнить `campaign.audienceSize` с `creatorProfile.followers`
   - Micro: 1K-10K, Mid-tier: 10K-100K, Macro: 100K-1M, Mega: 1M+

3. **Engagement rate (20%)**:
   - Использовать `creatorProfile.engagementRate`
   - Минимум 3% для хорошего матча

4. **Platform matching (15%)**:
   - Проверить наличие профилей на нужных платформах
   - Бонус за активность на нескольких платформах

5. **Location matching (bonus +10%)**:
   - Если `campaign.targetLocation` совпадает с `creatorProfile.location`

6. **Content type matching (bonus +5%)**:
   - Если креатор создает нужные типы контента

### 7. Обработка ошибок и retry

- Использовать существующий `ScraperJob` entity для трекинга
- Retry логика для failed jobs
- Rate limiting для Apify API
- Кэширование профилей (обновлять не чаще раза в день)

### 8. Оптимизация производительности

- Параллельный сбор данных для разных платформ
- Batch processing для множественных креаторов
- Кэширование результатов поиска
- Инкрементальное обновление (только новые посты)

### 9. Безопасность и лимиты

- Соблюдать rate limits Apify
- Валидация входных данных
- Обработка приватных профилей
- Соблюдение ToS платформ

## Примеры использования

### Пример 1: Поиск креаторов при создании кампании

```typescript
// После создания кампании
const campaign = await createCampaign(campaignData);

// Автоматический поиск креаторов
const result = await collectCreatorsForCampaignUseCase.execute({
  campaignId: campaign.id,
  limit: 50,
});

// Создать allocations для топ-5
const topCreators = result.creators
  .sort((a, b) => b.matchScore - a.matchScore)
  .slice(0, 5);

for (const creator of topCreators) {
  await createAllocation({
    campaignId: campaign.id,
    creatorId: creator.profile.creatorId,
    allocatedBudget: calculateBudget(creator.matchScore),
  });
}
```

### Пример 2: Мониторинг активной кампании

```typescript
// Cron job каждые 6 часов
const activeCampaigns = await getActiveCampaigns();

for (const campaign of activeCampaigns) {
  const result = await monitorCampaignPerformanceUseCase.execute({
    campaignId: campaign.id,
  });
  
  // Обновить метрики кампании
  await updateCampaignMetrics(campaign.id, {
    totalReach: result.updatedMetrics.totalReach,
    totalEngagement: result.updatedMetrics.totalEngagement,
  });
  
  // Уведомить бренд о значительных изменениях
  if (result.updatedMetrics.totalReach > threshold) {
    await sendNotification(campaign.brandId, {
      type: 'campaign_performance_update',
      campaignId: campaign.id,
      metrics: result.updatedMetrics,
    });
  }
}
```

## Следующие шаги

1. Реализовать `scrapeCreatorProfile()` в `ApifyScraperService`
2. Реализовать `searchCreatorsByCriteria()` в `ApifyScraperService`
3. Создать `CollectCreatorsForCampaignUseCase`
4. Создать `CollectCreatorAnalyticsUseCase`
5. Создать `MonitorCampaignPerformanceUseCase`
6. Добавить API endpoints
7. Интегрировать с campaign creation flow
8. Настроить cron jobs для периодического обновления
9. Добавить обработку ошибок и retry логику
10. Протестировать с реальными данными Apify

