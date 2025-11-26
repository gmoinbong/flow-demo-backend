# Оценка реализуемости MVP: Честный анализ

## Анализ требований из MVP Proposal

### Что требуется (из документа):

1. **Creator Ingestion**: Manual/CSV profile uploads (reach, engagement rate); **no API integrations for MVP**
2. **Event Tracking**: UTM-based ingestion for impressions/clicks; real-time pipeline
3. **AI Engine v0**: LightGBM/Random Forest scoring; PuLP optimization for hourly reallocations
4. **Payments**: Stripe Connect for deposits/payouts
5. **Timeline**: 5 месяцев, 400 часов

### Что мы описали:

1. ✅ Поиск креаторов только в БД (соответствует MVP)
2. ⚠️ Apify для мониторинга после выбора креатора (это API интеграция, но не для ingestion)
3. ❌ Event Tracking через UTM - не описали детально
4. ❌ AI Engine для реаллокации - не описали
5. ❌ Payments - не описали

## Оценка реализуемости

### ✅ ЧТО ПОЛУЧИТСЯ (и правильно понято):

#### 1. Поиск креаторов в БД - **РЕАЛИЗУЕМО**

**Почему получится:**
- Простой SQL запрос с фильтрами
- Данные уже есть в БД (из onboarding)
- Нет внешних зависимостей

**Что нужно сделать:**
```typescript
// Use Case: MatchCreatorsForCampaignUseCase
async execute(campaignId: string) {
  const campaign = await this.campaignRepo.findById(campaignId);
  
  // Простой поиск в БД
  const creators = await this.creatorRepo.findByCriteria({
    platforms: campaign.platforms,
    niches: extractKeywords(campaign.targetAudience),
    status: 'active',
    onboardingComplete: true,
    minFollowers: getMinFollowers(campaign.audienceSize),
    maxFollowers: getMaxFollowers(campaign.audienceSize),
  });
  
  // Матчинг алгоритм (простой scoring)
  const scored = creators.map(creator => ({
    creator,
    score: calculateMatchScore(creator, campaign),
  }));
  
  return scored.sort((a, b) => b.score - a.score);
}
```

**Оценка времени**: 20-30 часов
- Repository методы: 8h
- Matching алгоритм: 8h
- Тесты: 4h
- Интеграция: 4h

#### 2. Мониторинг через Apify - **РЕАЛИЗУЕМО, НО С ОГОВОРКАМИ**

**Почему получится:**
- Apify уже интегрирован (scraper module существует)
- Это не ingestion, а мониторинг (разрешен для MVP)
- Используется только после выбора креатора

**Что нужно сделать:**
```typescript
// Use Case: CollectCreatorAnalyticsUseCase
async execute(allocationId: string) {
  const allocation = await this.allocationRepo.findById(allocationId);
  const creator = await this.creatorRepo.findById(allocation.creatorId);
  const socialAccounts = await this.socialAccountRepo.findByCreatorId(creator.id);
  
  // Собрать данные через Apify
  for (const account of socialAccounts) {
    const profile = await this.apifyService.scrapeCreatorProfile({
      username: account.handle,
      platform: account.platform,
    });
    
    const posts = await this.apifyService.scrapePosts({
      username: account.handle,
      platform: account.platform,
      limit: 50,
    });
    
    // Сохранить в БД
    await this.saveProfileAndPosts(creator.id, profile, posts);
  }
}
```

**Оценка времени**: 40-50 часов
- Расширение ApifyScraperService: 16h
- Use Cases: 12h
- Cron jobs: 8h
- Тесты: 8h
- Обработка ошибок: 4h

**⚠️ РИСКИ:**
- Apify может быть дорогим (нужен бюджет)
- Rate limits могут ограничить частоту обновлений
- Некоторые профили могут быть приватными

**РЕКОМЕНДАЦИЯ**: 
- Начать с 1 раза в день (не 2)
- Добавить fallback на ручное обновление
- Кэшировать результаты (обновлять не чаще раза в день)

### ⚠️ ЧТО НУЖНО ДОБАВИТЬ (не описано, но требуется):

#### 3. Event Tracking через UTM - **КРИТИЧНО, НЕ ОПИСАНО**

**Что требуется (из MVP proposal):**
- UTM-based ingestion для impressions/clicks
- Real-time pipeline

**Что нужно реализовать:**

```typescript
// Tracking link format
// https://app.creatorflow.com/track/{campaignId}-{creatorId}?utm_source=instagram&utm_medium=post

// API Endpoint: GET /track/:code
async trackEvent(code: string, query: { utm_source, utm_medium, ... }) {
  // Декодировать code → campaignId, creatorId
  const { campaignId, creatorId } = decodeTrackingCode(code);
  
  // Сохранить событие
  await this.eventRepo.save({
    campaignId,
    creatorId,
    type: 'impression' | 'click',
    source: query.utm_source,
    medium: query.utm_medium,
    timestamp: new Date(),
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  });
  
  // Real-time update метрик
  await this.updateAllocationMetrics(campaignId, creatorId);
  
  // Redirect на целевой URL
  return redirect(campaign.targetUrl);
}
```

**Оценка времени**: 30-40 часов
- Tracking endpoint: 8h
- Event storage: 8h
- Real-time pipeline (Redis/WebSocket): 12h
- Analytics aggregation: 8h
- Тесты: 4h

**⚠️ РИСКИ:**
- Нужна инфраструктура для real-time (Redis/WebSocket)
- Много событий → нужна оптимизация БД
- Блокировка трекинга в браузерах (ad blockers)

#### 4. Analytics & Reallocation через формулу - **РЕАЛИЗУЕМО (упрощенный подход)**

**MVP подход (как понял пользователь):**
- НЕ отдельный AI модуль
- Простая формула для расчета performance
- Реаллокация на основе формулы
- Аналитика в реальном времени (не через отдельный сервис)

**Что нужно реализовать (простая формула):**

```typescript
// Простая формула для расчета performance score
function calculatePerformanceScore(allocation: Allocation): number {
  const { performance } = allocation;
  
  // Формула: взвешенная сумма метрик
  const score = (
    performance.reach * 0.4 +           // 40% - охват
    performance.engagement * 0.3 +     // 30% - вовлеченность
    performance.conversions * 0.2 +     // 20% - конверсии
    performance.ctr * 0.1               // 10% - CTR
  );
  
  // Нормализация (чтобы score был 0-100)
  return Math.min(100, score / 1000);
}

// Реаллокация на основе формулы
function reallocateBudget(allocations: Allocation[], totalBudget: number) {
  // 1. Рассчитать performance score для каждого
  const scored = allocations.map(alloc => ({
    ...alloc,
    performanceScore: calculatePerformanceScore(alloc),
  }));
  
  // 2. Сортировать по score
  scored.sort((a, b) => b.performanceScore - a.performanceScore);
  
  // 3. Определить топ и низ перформеров
  const top30 = scored.slice(0, Math.ceil(scored.length * 0.3));
  const bottom30 = scored.slice(-Math.ceil(scored.length * 0.3));
  
  // 4. Реаллокация: +25% топ, -25% низ
  top30.forEach(alloc => {
    alloc.currentBudget = alloc.allocatedBudget * 1.25;
  });
  
  bottom30.forEach(alloc => {
    alloc.currentBudget = alloc.allocatedBudget * 0.75;
  });
  
  // 5. Нормализовать к totalBudget
  const sum = scored.reduce((s, a) => s + a.currentBudget, 0);
  const factor = totalBudget / sum;
  scored.forEach(alloc => {
    alloc.currentBudget = Math.round(alloc.currentBudget * factor);
  });
  
  return scored;
}

// Использование в Use Case (во время обновления метрик)
async function updateCampaignMetrics(campaignId: string) {
  // 1. Получить allocations
  const allocations = await this.getAllocationsByCampaign(campaignId);
  
  // 2. Обновить метрики (из Apify и Event Tracking)
  for (const alloc of allocations) {
    const metrics = await this.aggregateMetrics(alloc.id);
    await this.updateAllocationPerformance(alloc.id, metrics);
  }
  
  // 3. Рассчитать реаллокацию через формулу
  const campaign = await this.getCampaign(campaignId);
  const reallocated = reallocateBudget(allocations, campaign.budget);
  
  // 4. Применить реаллокацию
  for (const alloc of reallocated) {
    await this.updateAllocationBudget(alloc.id, alloc.currentBudget);
  }
  
  // 5. Обновить dashboard (Brand видит изменения)
  await this.notifyBrand(campaign.brandId, {
    type: 'budget_reallocated',
    campaignId,
    changes: reallocated.map(a => ({
      creatorId: a.creatorId,
      oldBudget: a.allocatedBudget,
      newBudget: a.currentBudget,
      performanceScore: a.performanceScore,
    })),
  });
}
```

**Оценка времени**: 20-30 часов (вместо 60-80)
- Формула расчета: 4h
- Реаллокация логика: 8h
- Интеграция в мониторинг: 6h
- Dashboard обновления: 6h
- Тесты: 4h

**✅ ПРЕИМУЩЕСТВА для MVP:**
- Простота: нет ML модели, нет Python service
- Быстрота: работает сразу, не нужно обучать модель
- Прозрачность: Brand видит формулу и понимает логику
- Дешево: нет дополнительной инфраструктуры

**⚠️ РИСКИ:**
- Менее точная, чем ML модель
- Но для MVP достаточно
```typescript
// Простой scoring без ML
function reallocateBudget(allocations: Allocation[], totalBudget: number) {
  // Рассчитать performance score
  const scored = allocations.map(alloc => ({
    ...alloc,
    performanceScore: (
      alloc.performance.reach * 0.4 +
      alloc.performance.engagement * 0.3 +
      alloc.performance.conversions * 0.3
    ),
  }));
  
  // Сортировать
  scored.sort((a, b) => b.performanceScore - a.performanceScore);
  
  // Реаллокация: +25% топ, -25% низ
  const top30 = scored.slice(0, Math.ceil(scored.length * 0.3));
  const bottom30 = scored.slice(-Math.ceil(scored.length * 0.3));
  
  top30.forEach(alloc => {
    alloc.currentBudget = alloc.allocatedBudget * 1.25;
  });
  
  bottom30.forEach(alloc => {
    alloc.currentBudget = alloc.allocatedBudget * 0.75;
  });
  
  // Нормализовать к totalBudget
  const sum = scored.reduce((s, a) => s + a.currentBudget, 0);
  const factor = totalBudget / sum;
  scored.forEach(alloc => {
    alloc.currentBudget *= factor;
  });
  
  return scored;
}
```

**Оценка простого алгоритма**: 20-30 часов (вместо 60-80)

#### 5. Payments (Stripe Connect) - **РЕАЛИЗУЕМО**

**Что требуется:**
- Stripe Connect для deposits (brands) и payouts (creators)
- Threshold-based triggers

**Оценка времени**: 40-50 часов
- Stripe Connect setup: 12h
- Deposit flow: 8h
- Payout flow: 12h
- Webhooks: 8h
- Тесты: 8h

## Итоговая оценка времени

| Модуль | Часы | Статус |
|--------|------|--------|
| Поиск креаторов в БД | 20-30 | ✅ Описано |
| Мониторинг через Apify | 40-50 | ⚠️ Описано, но нужны уточнения |
| Event Tracking (UTM) | 30-40 | ❌ Не описано |
| AI Engine (простой) | 20-30 | ❌ Не описано |
| Payments (Stripe) | 40-50 | ❌ Не описано |
| **ИТОГО** | **150-200h** | |

**Остается на другие задачи**: 200-250 часов (из 400)

## Рекомендации по реализации

### Фаза 1: Core (Месяц 1-2)
1. ✅ Поиск креаторов в БД (20-30h)
2. ✅ Создание кампаний и allocations (20h)
3. ✅ Базовый мониторинг через Apify (30h)

### Фаза 2: Tracking & Analytics (Месяц 3)
4. ⚠️ Event Tracking через UTM (30-40h)
5. ⚠️ Простой AI алгоритм реаллокации (20-30h)

### Фаза 3: Payments (Месяц 4)
6. ⚠️ Stripe Connect интеграция (40-50h)

### Фаза 4: Polish (Месяц 5)
7. UI/UX улучшения
8. Тестирование
9. Документация

## Что нужно уточнить

1. **Apify бюджет**: Сколько можно тратить на API calls?
2. **Event Tracking**: Нужен ли real-time или достаточно batch updates?
3. **AI Engine**: Простой алгоритм или ML модель для MVP?
4. **Payments**: Нужен ли KYC для MVP или можно отложить?

## Важное уточнение: Когда собирается статистика

### ❌ НЕПРАВИЛЬНОЕ понимание:
"Статистику видим только по факту после кампании"

### ✅ ПРАВИЛЬНОЕ понимание:

**Статистика собирается ВО ВРЕМЯ кампании:**

1. **При выборе креатора** (до начала):
   - Собираем базовые данные через Apify (профиль, исторические посты)
   - Это baseline для сравнения

2. **Во время кампании** (1-2 раза в день):
   - Собираем новые посты через Apify
   - Обновляем метрики (likes, comments, engagement)
   - Отслеживаем посты кампании (по хештегам/mentions)
   - **AI реаллокация работает на основе этих данных**

3. **Event Tracking** (в реальном времени):
   - Импрессии и клики через UTM links
   - Обновляются метрики conversions, CTR
   - **Это критично для AI реаллокации**

4. **После кампании**:
   - Финальный отчет
   - Агрегация всех данных

### Правильный флоу:

```
Выбор креатора
    ↓
Первичный сбор данных (Apify) ← baseline
    ↓
Кампания начинается
    ↓
┌─────────────────────────────────────┐
│ ВО ВРЕМЯ КАМПАНИИ (каждый день):    │
│                                     │
│ 1. Apify мониторинг (1-2x/день)    │
│    - Новые посты                    │
│    - Обновление метрик               │
│                                     │
│ 2. Event Tracking (real-time)      │
│    - Impressions через UTM          │
│    - Clicks через UTM               │
│                                     │
│ 3. AI Реаллокация (hourly/daily)   │
│    - На основе актуальных метрик   │
│    - ±25% сдвиг бюджета            │
│                                     │
│ 4. Dashboard обновления            │
│    - Brand видит прогресс           │
│    - Creator видит earnings         │
└─────────────────────────────────────┘
    ↓
Кампания завершается
    ↓
Финальный отчет
```

## Вывод

**✅ Правильно понято:**
- Поиск только в БД (без Apify) - правильно
- Мониторинг через Apify после выбора - правильно, но нужно уточнить бюджет

**❌ НЕПРАВИЛЬНО понято:**
- Статистика НЕ только после кампании
- Статистика собирается ВО ВРЕМЯ кампании (1-2 раза в день)
- AI реаллокация работает на основе актуальных данных

**❌ Не описано, но требуется:**
- Event Tracking через UTM - критично (для real-time метрик)
- AI Engine для реаллокации - критично (работает во время кампании)
- Payments - критично

**🎯 Финальная рекомендация (с учетом понимания пользователя):**

1. ✅ **Поиск креаторов**: Только в БД (без Apify)
2. ✅ **Первичный сбор**: Apify после выбора креатора (baseline)
3. ✅ **Мониторинг**: Apify 2 раза в день (как планировали)
4. ✅ **Аналитика**: Простая формула (НЕ AI модуль, НЕ ML)
5. ✅ **Реаллокация**: На основе формулы, 1 раз в день
6. ⚠️ **Event Tracking**: Batch updates (не real-time) для MVP
7. ⚠️ **Payments**: Stripe Connect

**Обновленная оценка времени:**

| Модуль | Часы | Статус |
|--------|------|--------|
| Поиск в БД | 20-30 | ✅ |
| Мониторинг Apify | 40-50 | ✅ |
| Analytics формула | 20-30 | ✅ (упрощено) |
| Event Tracking | 30-40 | ⚠️ |
| Payments | 40-50 | ⚠️ |
| **ИТОГО** | **150-200h** | |

**Остается**: 200-250 часов на остальные задачи (UI, тесты, документация)

**Это уложится в 400 часов!** ✅

