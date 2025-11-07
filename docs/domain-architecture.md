# Domain Architecture Plan

## 1. Creator Module (`modules/creator`)

**Назначение**: Управление креаторами, брендами, ролями пользователей и связями между ними.

### Domain Layer
- **Entities**:
  - `creator.entity.ts` - Creator (расширяет Profile из auth)
  - `brand.entity.ts` - Brand
  - `creator-brand-relationship.entity.ts` - связь Creator-Brand (many-to-many)
  
**Важно**: UserRole определяется через `users.role_id -> user_role` в БД, не является отдельной entity в домене Creator.
  
- **Value Objects**:
  - `creator-status.vo.ts` - статус креатора (active, pending, suspended)
  - `brand-type.vo.ts` - тип бренда (agency, direct, platform)
  - `user-role.vo.ts` - роли пользователей (creator, brand, admin) - используется для валидации, но роль хранится в БД через `user_role`
  
- **Repositories Interfaces**:
  - `creator.repository.interface.ts`
  - `brand.repository.interface.ts`
  - `creator-brand.repository.interface.ts`

- **Domain Events**:
  - `creator-registered.event.ts`
  - `brand-created.event.ts`
  - `creator-brand-linked.event.ts`

### Application Layer
- **Use Cases**:
  - `create-creator.use-case.ts`
  - `update-creator.use-case.ts`
  - `get-creator-by-id.use-case.ts`
  - `list-creators.use-case.ts`
  - `create-brand.use-case.ts`
  - `link-creator-to-brand.use-case.ts`
  - `unlink-creator-from-brand.use-case.ts`
  - `assign-user-role.use-case.ts`

- **Services**:
  - `creator-validator.service.ts` - валидация данных креатора
  - `brand-validator.service.ts` - валидация данных бренда

### Infrastructure Layer
- **Persistence**:
  - `creator.repository.ts` - реализация репозитория
  - `brand.repository.ts`
  - `creator-brand.repository.ts`

- **Config**:
  - `creator.config.ts` - конфигурация модуля

### Presentation Layer
- **Controllers**:
  - `creator.controller.ts`
  - `brand.controller.ts`

- **DTOs**:
  - `create-creator.dto.ts`
  - `update-creator.dto.ts`
  - `create-brand.dto.ts`
  - `link-creator-brand.dto.ts`

### Database Schema
```sql
-- Расширение существующей таблицы profile
-- ВАЖНО: creator_type НЕ добавляется, роль определяется через users.role_id -> user_role
ALTER TABLE profile ADD COLUMN status VARCHAR(20); -- active, pending, suspended

-- Обновление user_role для явного указания ролей
-- user_role.name должен содержать: 'creator', 'brand', 'admin'

-- Новая таблица brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  brand_type VARCHAR(20), -- agency, direct, platform
  profile_id UUID REFERENCES profile(id), -- optional: если бренд имеет пользовательский аккаунт
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Связь Creator-Brand (many-to-many)
CREATE TABLE creator_brand_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profile(id) ON DELETE CASCADE, -- profile с ролью creator
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  role VARCHAR(20), -- owner, manager, collaborator
  status VARCHAR(20), -- active, pending, inactive
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(creator_id, brand_id)
);
```

**Важные моменты:**
- Роль пользователя определяется через `users.role_id -> user_role.name`, а не хранится в `profile`
- `profile` используется для всех типов пользователей (creator, brand, admin)
- `status` в `profile` - это статус профиля (active, pending, suspended), не роль
- `brands` - отдельная сущность, может быть опционально связана с `profile` через `profile_id`

---

## 2. Scraper Module (`modules/scraper`)

**Назначение**: Отдельный сервис для скрапинга данных с платформ (YouTube, TikTok, Instagram).

### Domain Layer
- **Entities**:
  - `scraper-job.entity.ts` - задача на скрапинг
  - `scraper-provider.entity.ts` - провайдер скрапинга (apify, rapidapi, self-hosted)
  
- **Value Objects**:
  - `scraper-status.vo.ts` - статус задачи (pending, running, completed, failed)
  - `platform-type.vo.ts` - тип платформы (youtube, tiktok, instagram)
  
- **Repositories Interfaces**:
  - `scraper-job.repository.interface.ts`
  - `scraper-provider.repository.interface.ts`

- **Domain Events**:
  - `scraper-job-created.event.ts`
  - `scraper-job-completed.event.ts`
  - `scraper-job-failed.event.ts`

### Application Layer
- **Use Cases**:
  - `create-scraper-job.use-case.ts` - создание задачи на скрапинг
  - `execute-scraper-job.use-case.ts` - выполнение задачи
  - `get-scraper-job-status.use-case.ts`
  - `retry-failed-job.use-case.ts`
  - `cancel-scraper-job.use-case.ts`

- **Services**:
  - `scraper-orchestrator.service.ts` - оркестрация скрапинга
  - `apify-scraper.service.ts` - интеграция с Apify
  - `rapidapi-scraper.service.ts` - интеграция с RapidAPI
  - `self-hosted-scraper.service.ts` - собственный скрапер
  - `scraper-queue.service.ts` - управление очередью задач

### Infrastructure Layer
- **Persistence**:
  - `scraper-job.repository.ts` - использует существующую таблицу `scraper_jobs`

- **External Services**:
  - `apify-client.ts` - клиент Apify API
  - `rapidapi-client.ts` - клиент RapidAPI
  - `scraper-http-client.ts` - HTTP клиент для self-hosted

- **Config**:
  - `scraper.config.ts` - конфигурация провайдеров, таймауты, retry логика

### Presentation Layer
- **Controllers**:
  - `scraper.controller.ts` - REST API для управления задачами

- **DTOs**:
  - `create-scraper-job.dto.ts`
  - `scraper-job-status.dto.ts`

### Database Schema
```sql
-- Используется существующая таблица scraper_jobs
-- Можно добавить дополнительные поля:
ALTER TABLE scraper_jobs ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE scraper_jobs ADD COLUMN max_retries INTEGER DEFAULT 3;
ALTER TABLE scraper_jobs ADD COLUMN priority INTEGER DEFAULT 0;
```

---

## 3. Analytics Module (`modules/analytics`)

**Назначение**: Трансформация сырых данных со скрапинга, сохранение нормализованных метрик, алгоритмы статистики и аналитики.

### Domain Layer
- **Entities**:
  - `platform-stats.entity.ts` - нормализованные метрики платформы
  - `analytics-report.entity.ts` - отчет по аналитике
  - `statistics-calculation.entity.ts` - расчет статистики
  
- **Value Objects**:
  - `metric-type.vo.ts` - тип метрики (followers, views, engagement_rate)
  - `time-period.vo.ts` - период анализа (daily, weekly, monthly)
  - `engagement-rate.vo.ts` - расчет engagement rate
  
- **Repositories Interfaces**:
  - `platform-stats.repository.interface.ts`
  - `analytics-report.repository.interface.ts`
  - `statistics-calculation.repository.interface.ts`

- **Domain Events**:
  - `stats-transformed.event.ts`
  - `analytics-report-generated.event.ts`
  - `statistics-calculated.event.ts`

### Application Layer
- **Use Cases**:
  - `transform-scraper-data.use-case.ts` - трансформация сырых данных
  - `save-platform-stats.use-case.ts` - сохранение нормализованных метрик
  - `calculate-engagement-rate.use-case.ts` - расчет engagement rate
  - `generate-analytics-report.use-case.ts` - генерация отчета
  - `get-creator-statistics.use-case.ts` - статистика по креатору
  - `get-brand-statistics.use-case.ts` - статистика по бренду
  - `compare-creators.use-case.ts` - сравнение креаторов
  - `get-trend-analysis.use-case.ts` - анализ трендов

- **Services**:
  - `data-transformer.service.ts` - трансформация данных из разных платформ
  - `metrics-normalizer.service.ts` - нормализация метрик
  - `statistics-calculator.service.ts` - расчет статистики
  - `engagement-calculator.service.ts` - расчет engagement
  - `trend-analyzer.service.ts` - анализ трендов
  - `report-generator.service.ts` - генерация отчетов

### Infrastructure Layer
- **Persistence**:
  - `platform-stats.repository.ts` - использует существующую таблицу `platform_stats`
  - `analytics-report.repository.ts`

- **Algorithms**:
  - `engagement-rate-algorithm.ts` - алгоритм расчета engagement rate
  - `growth-rate-algorithm.ts` - алгоритм расчета роста
  - `trend-detection-algorithm.ts` - алгоритм детекции трендов
  - `comparison-algorithm.ts` - алгоритм сравнения креаторов

- **Config**:
  - `analytics.config.ts` - конфигурация алгоритмов, веса метрик

### Presentation Layer
- **Controllers**:
  - `analytics.controller.ts` - REST API для аналитики
  - `statistics.controller.ts` - REST API для статистики

- **DTOs**:
  - `analytics-report.dto.ts`
  - `creator-statistics.dto.ts`
  - `brand-statistics.dto.ts`
  - `trend-analysis.dto.ts`

### Database Schema
```sql
-- Используется существующая таблица platform_stats
-- Можно добавить дополнительные таблицы:

-- Отчеты по аналитике
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profile(id),
  brand_id UUID REFERENCES brands(id),
  report_type VARCHAR(20), -- summary, detailed, comparison
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  data JSONB, -- структурированные данные отчета
  created_at TIMESTAMP DEFAULT NOW()
);

-- Расчеты статистики (кэш для оптимизации)
CREATE TABLE statistics_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20), -- creator, brand
  entity_id UUID,
  calculation_type VARCHAR(20), -- engagement_rate, growth_rate, trend
  period VARCHAR(20), -- daily, weekly, monthly
  value DECIMAL,
  metadata JSONB,
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## Взаимодействие модулей

```
┌─────────────┐
│   Creator   │
│   Module    │
└──────┬──────┘
       │
       │ creates
       ▼
┌─────────────┐      ┌─────────────┐
│   Scraper   │─────▶│  Analytics  │
│   Module    │      │   Module    │
└─────────────┘      └─────────────┘
       │                    │
       │ raw data           │ transformed
       │                    │ data
       ▼                    ▼
  scraper_jobs      platform_stats
```

### Связи:
1. **Creator → Scraper**: Creator создает задачи на скрапинг через Scraper Module
2. **Scraper → Analytics**: После завершения скрапинга, сырые данные передаются в Analytics для трансформации
3. **Analytics → Creator**: Analytics сохраняет нормализованные метрики и предоставляет статистику для Creator/Brand

---

## Порядок реализации

1. **Creator Module** (базовая функциональность)
   - Entities и Value Objects
   - Repositories
   - Базовые Use Cases (create, get, list)
   - Controllers и DTOs

2. **Scraper Module** (интеграция с внешними сервисами)
   - Entities и Job Queue
   - Интеграция с одним провайдером (например, Apify)
   - Use Cases для управления задачами
   - Controllers

3. **Analytics Module** (трансформация и статистика)
   - Data Transformer Service
   - Базовые алгоритмы (engagement rate)
   - Use Cases для сохранения и получения статистики
   - Controllers

4. **Интеграция модулей**
   - Event-driven связь между модулями
   - Webhooks/Queue для асинхронной обработки

