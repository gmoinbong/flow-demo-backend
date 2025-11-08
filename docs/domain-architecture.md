# Domain Architecture

## Creator Module

**Domain**: Creator, Brand entities, Value Objects (status, brand-type), Repositories

**Application**: Use Cases (create, update, get, list), Services (validators)

**Infrastructure**: Repositories (Drizzle), Config

**Presentation**: Controllers, DTOs

**Schema**:
- `profile.status` - active, pending, suspended
- `brands` - name, brand_type, profile_id
- `creator_brand_relationships` - many-to-many relationship

**Important**: Role via `users.role_id -> user_role.name`, not in `profile`

## Scraper Module

**Domain**: ScraperJob entity, Value Objects (status, platform-type), Repositories

**Application**: Use Cases (create, execute, get status, retry, cancel), Services (orchestrator, apify, queue)

**Infrastructure**: Repositories, External clients (Apify, RapidAPI), Config

**Presentation**: Controller, DTOs

**Schema**: `scraper_jobs` (retry_count, max_retries, priority)

## Analytics Module

**Domain**: PlatformStats, AnalyticsReport entities, Value Objects (metric-type, time-period, engagement-rate), Repositories

**Application**: Use Cases (transform, save stats, calculate engagement, generate report, get statistics, compare, trends), Services (transformer, normalizer, calculator, analyzer, generator)

**Infrastructure**: Repositories, Algorithms (engagement, growth, trend, comparison), Config

**Presentation**: Controllers (analytics, statistics), DTOs

**Schema**: `platform_stats`, `analytics_reports`, `statistics_calculations`

## Interaction

```
Creator → Scraper → Analytics
         (raw)    (transformed)
```

1. Creator creates tasks → Scraper
2. Scraper → Analytics (transformation)
3. Analytics → Creator/Brand (statistics)

## Implementation Order

1. Creator Module (basic functionality)
2. Scraper Module (Apify integration)
3. Analytics Module (transformation, algorithms)
4. Integration (events, queue)

