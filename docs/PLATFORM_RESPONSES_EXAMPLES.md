# Примеры ответов от провайдеров

Реальные форматы данных от Apify и RapidAPI для каждой платформы.

---

## YouTube

### Apify Response (bernardo/youtube-channel-scraper)

```json
[
  {
    "channelId": "UCUsbfdhYigUiXCaLnHareuQ",
    "title": "BK42 Cycles",
    "description": "Welcome to BK42 Cycles! A channel dedicated to the world of custom bicycles, without forgetting affordable electric bikes. Here, you'll find the most amazing bikes in the world, an endless source of inspiration for your next build.",
    "customUrl": "@BK42Cycles",
    "publishedAt": "2016-08-15T12:00:00Z",
    "thumbnails": {
      "default": {
        "url": "https://yt3.ggpht.com/...",
        "width": 88,
        "height": 88
      },
      "medium": { ... },
      "high": { ... }
    },
    "localized": {
      "title": "BK42 Cycles",
      "description": "..."
    },
    "country": "Poland",
    "viewCount": "50004249",
    "subscriberCount": "105000",
    "hiddenSubscriberCount": false,
    "videoCount": "725",
    "subscriberCountText": "105K subscribers",
    "viewCountText": "50,004,249 views",
    "videoCountText": "725 videos",
    "joinedDateText": "Joined Aug 15, 2016",
    "bannerExternalUrl": "https://yt3.googleusercontent.com/...",
    "avatar": "https://yt3.ggpht.com/...",
    "stats": {
      "views": 50004249,
      "subscribers": 105000,
      "videos": 725
    }
  }
]
```

### Как наш сервис трансформирует:

```json
{
  "platform": "youtube",
  "followers_count": 105000,
  "following_count": 0,
  "total_posts": 725,
  "total_views": 50004249,
  "engagement_rate": "0.65%",
  "raw_data": { ...полный ответ выше... }
}
```

---

## TikTok

### Apify Response (clockworks/tiktok-profile-scraper)

```json
[
  {
    "id": "1234567890",
    "uniqueId": "bakc42",
    "nickname": "BK42",
    "avatarThumb": "https://p16-sign-sg.tiktokcdn.com/...",
    "avatarMedium": "https://p16-sign-sg.tiktokcdn.com/...",
    "avatarLarger": "https://p16-sign-sg.tiktokcdn.com/...",
    "signature": "Custom bikes & e-bikes 🚴‍♂️",
    "verified": false,
    "secUid": "MS4wLjABAAAA...",
    "secret": false,
    "ftc": false,
    "relation": 0,
    "openFavorite": false,
    "commentSetting": 0,
    "duetSetting": 0,
    "stitchSetting": 0,
    "privateAccount": false,
    "stats": {
      "followingCount": 350,
      "followerCount": 48,
      "heartCount": 0,
      "videoCount": 0,
      "diggCount": 650,
      "heart": 0
    },
    "follower_count": 48,
    "following_count": 350,
    "aweme_count": 0,
    "total_favorited": 0,
    "favoriting_count": 650,
    "bioLink": {
      "link": "",
      "risk": 0
    },
    "isADVirtual": false,
    "roomId": ""
  }
]
```

### Трансформированные данные:

```json
{
  "platform": "tiktok",
  "followers_count": 48,
  "following_count": 350,
  "total_posts": 0,
  "total_views": 0,
  "engagement_rate": "0%",
  "raw_data": { ...полный ответ выше... }
}
```

---

## Instagram

### Apify Response (apify/instagram-profile-scraper)

```json
[
  {
    "id": "7945858114",
    "username": "bk42cycles",
    "full_name": "BK42 Cycles | Custom Bicycles & All Things E-Bikes",
    "biography": "🚴 Custom bikes & e-bikes\n📍 Poland\n👇 Latest builds",
    "external_url": "https://www.youtube.com/@BK42Cycles",
    "external_url_linkshimmed": "https://l.instagram.com/?u=https%3A%2F%2F...",
    "edge_followed_by": {
      "count": 5495
    },
    "followed_by_viewer": false,
    "edge_follow": {
      "count": 350
    },
    "follows_viewer": false,
    "is_business_account": false,
    "is_professional_account": true,
    "is_supervision_enabled": false,
    "is_joined_recently": false,
    "business_category_name": null,
    "overall_category_name": null,
    "category_enum": null,
    "category_name": "Digital creator",
    "is_private": false,
    "is_verified": true,
    "edge_owner_to_timeline_media": {
      "count": 287,
      "edges": []
    },
    "edge_saved_media": {
      "count": 0
    },
    "has_ar_effects": false,
    "has_clips": true,
    "has_guides": false,
    "has_channel": false,
    "highlight_reel_count": 8,
    "has_blocked_viewer": false,
    "has_requested_viewer": false,
    "hide_like_and_view_counts": false,
    "is_embeds_disabled": false,
    "is_verified_by_mv4b": false,
    "is_regulated_c18": false,
    "profile_pic_url": "https://scontent-ams2-1.cdninstagram.com/...",
    "profile_pic_url_hd": "https://scontent-ams2-1.cdninstagram.com/...",
    "requested_by_viewer": false,
    "should_show_category": true,
    "should_show_public_contacts": false,
    "fbid": "17841407983423232"
  }
]
```

### Трансформированные данные:

```json
{
  "platform": "instagram",
  "followers_count": 5495,
  "following_count": 350,
  "total_posts": 287,
  "total_views": 0,
  "engagement_rate": "0%",
  "raw_data": { ...полный ответ выше... }
}
```

---

## RapidAPI Примеры

### YouTube (youtube-v31 API)

```json
{
  "kind": "youtube#channelListResponse",
  "etag": "...",
  "pageInfo": {
    "totalResults": 1,
    "resultsPerPage": 1
  },
  "items": [
    {
      "kind": "youtube#channel",
      "etag": "...",
      "id": "UCUsbfdhYigUiXCaLnHareuQ",
      "snippet": {
        "title": "BK42 Cycles",
        "description": "Welcome to BK42 Cycles!...",
        "customUrl": "@bk42cycles",
        "publishedAt": "2016-08-15T12:00:00Z",
        "thumbnails": { ... },
        "localized": { ... },
        "country": "PL"
      },
      "statistics": {
        "viewCount": "50004249",
        "subscriberCount": "105000",
        "hiddenSubscriberCount": false,
        "videoCount": "725"
      }
    }
  ]
}
```

### TikTok (tiktok-video-no-watermark2)

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "user": {
      "id": "1234567890",
      "uniqueId": "bakc42",
      "nickname": "BK42",
      "avatarLarger": "https://...",
      "signature": "Custom bikes & e-bikes 🚴‍♂️",
      "verified": false,
      "followerCount": 48,
      "followingCount": 350,
      "heart": 0,
      "videoCount": 0,
      "diggCount": 650
    }
  },
  "processed_time": 0.5
}
```

### Instagram (instagram-scraper-api2)

```json
{
  "status": "ok",
  "data": {
    "user": {
      "pk": "7945858114",
      "username": "bk42cycles",
      "full_name": "BK42 Cycles | Custom Bicycles & All Things E-Bikes",
      "is_private": false,
      "is_verified": true,
      "profile_pic_url": "https://...",
      "biography": "🚴 Custom bikes & e-bikes\n📍 Poland",
      "external_url": "https://www.youtube.com/@BK42Cycles",
      "follower_count": 5495,
      "following_count": 350,
      "media_count": 287,
      "is_business": false
    }
  }
}
```

---

## Как использовать raw_data

Все сырые данные сохраняются в `platform_stats.raw_data` (JSONB колонка). Ты можешь:

### 1. Запросить специфичные поля через SQL

```sql
SELECT 
  id,
  platform,
  followers_count,
  raw_data->>'country' as country,
  raw_data->>'verified' as is_verified,
  raw_data->'stats'->>'views' as total_views
FROM platform_stats
WHERE platform = 'youtube';
```

### 2. Использовать в TypeScript

```typescript
const stats = await db.select().from(platform_stats).where(...);
const rawData = stats[0].raw_data;

if (rawData.country) {
  console.log('Country:', rawData.country);
}

if (rawData.stats?.subscribers) {
  console.log('Subscribers:', rawData.stats.subscribers);
}
```

### 3. Строить custom аналитику

```typescript
// Рассчитать engagement rate для Instagram
const igStats = await db.select().from(platform_stats)
  .where(eq(platform_stats.platform, 'instagram'));

const avgLikes = calculateAvgLikesFromPosts(igStats[0].raw_data.edge_owner_to_timeline_media);
const engagementRate = (avgLikes / igStats[0].followers_count) * 100;
```

---

## Важные заметки

### YouTube
- `subscriberCount` может быть скрыт (`hiddenSubscriberCount: true`)
- `country` не всегда доступен
- Engagement rate считается как: `(avg_views_per_video / subscribers) * 100`

### TikTok
- Новые аккаунты могут иметь `aweme_count: 0` (нет видео)
- `total_favorited` = общее количество лайков полученных
- `favoriting_count` = количество лайков отданных (diggs)

### Instagram
- `is_private: true` → большинство данных недоступно
- `edge_owner_to_timeline_media.count` = количество постов
- Для engagement нужен дополнительный запрос постов

---

## Полезные SQL запросы

### Топ креаторов по followers

```sql
SELECT 
  sa.username,
  sa.platform,
  ps.followers_count,
  ps.engagement_rate,
  ps.scraped_at
FROM platform_stats ps
JOIN social_accounts sa ON sa.id = ps.social_account_id
WHERE ps.id IN (
  SELECT DISTINCT ON (social_account_id) id 
  FROM platform_stats 
  ORDER BY social_account_id, scraped_at DESC
)
ORDER BY ps.followers_count DESC
LIMIT 10;
```

### Прирост подписчиков за неделю

```sql
WITH latest AS (
  SELECT DISTINCT ON (social_account_id)
    social_account_id,
    followers_count as current_followers,
    scraped_at as latest_scrape
  FROM platform_stats
  ORDER BY social_account_id, scraped_at DESC
),
week_ago AS (
  SELECT DISTINCT ON (social_account_id)
    social_account_id,
    followers_count as old_followers
  FROM platform_stats
  WHERE scraped_at < NOW() - INTERVAL '7 days'
  ORDER BY social_account_id, scraped_at DESC
)
SELECT 
  sa.username,
  l.current_followers,
  w.old_followers,
  l.current_followers - w.old_followers as growth
FROM latest l
JOIN week_ago w ON l.social_account_id = w.social_account_id
JOIN social_accounts sa ON sa.id = l.social_account_id
ORDER BY growth DESC;
```

### Платформа с лучшим engagement

```sql
SELECT 
  platform,
  AVG(CAST(REPLACE(engagement_rate, '%', '') AS NUMERIC)) as avg_engagement
FROM platform_stats
WHERE scraped_at > NOW() - INTERVAL '24 hours'
GROUP BY platform
ORDER BY avg_engagement DESC;
```





