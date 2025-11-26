import {
  integer,
  serial,
  text,
  pgTable,
  uuid,
  timestamp,
  jsonb,
  varchar,
  boolean,
  unique,
  numeric,
  index,
  inet,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  password_hash: text('password_hash'), // nullable for OAuth users
  role_id: integer('role_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// User roles: creator, brand, admin
export const user_role = pgTable('user_role', {
  id: serial('id').primaryKey(), // auto-incrementing primary key field
  name: varchar('name', { length: 20 }), // creator, brand, admin
});

export const usersRelations = relations(users, ({ one, many }) => ({
  user_role: one(user_role, {
    fields: [users.role_id],
    references: [user_role.id],
  }),
  profile: one(profile, {
    fields: [users.id],
    references: [profile.user_id],
  }),
  accounts: many(accounts),
}));

// User profile - 1:1 relationship with users
// Profile is used for both creators and brands (role is determined by users.role_id -> user_role)
export const profile = pgTable('profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .unique()
    .notNull(),
  first_name: text('first_name'), // First name from registration form
  last_name: text('last_name'), // Last name from registration form
  display_name: text('display_name'), // Computed or manually set display name
  bio: text('bio'),
  avatar_url: text('avatar_url'),
  status: varchar('status', { length: 20 }), // active, pending, suspended
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Social accounts linked to creators (DEPRECATED - use creator_social_profiles)
export const social_accounts = pgTable('social_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  creator_id: uuid('creator_id').references(() => profile.id),
  platform: varchar('platform', { length: 20 }), // youtube, tiktok, instagram
  platform_user_id: text('platform_user_id'), // channel_id, user_id from platform
  username: text('username'), // @handle or channel name
  metadata: jsonb('metadata'), // profile_url and other platform-specific data
  is_primary: boolean('is_primary').default(false),
  last_sync_at: timestamp('last_sync_at'),
  created_at: timestamp('created_at').defaultNow(),
});

// Unified creator social profiles (replaces social_accounts + creator_profiles)
// Single source of truth for creator data
export const creator_social_profiles = pgTable(
  'creator_social_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creator_id: uuid('creator_id')
      .references(() => profile.id)
      .notNull(),
    platform: varchar('platform', { length: 20 }).notNull(), // 'instagram', 'tiktok', 'youtube'

    // Platform identifiers
    platform_user_id: text('platform_user_id'), // channel_id, user_id from platform
    username: text('username').notNull(), // @handle or channel name
    profile_url: text('profile_url'),
    is_primary: boolean('is_primary').default(false),

    // Declared data (from onboarding - manual/CSV)
    followers_declared: integer('followers_declared'),
    engagement_rate_declared: numeric('engagement_rate_declared', {
      precision: 5,
      scale: 2,
    }),
    niches: text('niches').array(), // array of niches
    location: text('location'),

    // Verified data (from Apify - SOURCE OF TRUTH)
    followers_verified: integer('followers_verified'),
    engagement_rate_verified: numeric('engagement_rate_verified', {
      precision: 5,
      scale: 2,
    }),
    following_count: integer('following_count'),
    posts_count: integer('posts_count'),
    bio: text('bio'),
    is_verified: boolean('is_verified').default(false),
    last_verified_at: timestamp('last_verified_at'),

    // Computed columns will be added via migration (GENERATED ALWAYS AS)
    // followers_actual and engagement_rate_actual

    // Metadata
    metadata: jsonb('metadata'), // platform-specific data
    last_sync_at: timestamp('last_sync_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueCreatorPlatform: unique().on(table.creator_id, table.platform),
    idxCreator: index('idx_creator_social_profiles_creator').on(
      table.creator_id,
    ),
    idxPlatform: index('idx_creator_social_profiles_platform').on(
      table.platform,
    ),
  }),
);

// Platform stats - embedded data from scrapers
export const platform_stats = pgTable('platform_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  social_account_id: uuid('social_account_id').references(
    () => social_accounts.id,
  ),

  // Unified metrics across platforms
  followers_count: integer('followers_count'),
  following_count: integer('following_count'),
  total_posts: integer('total_posts'),
  total_views: integer('total_views'),
  engagement_rate: text('engagement_rate'), // stored as string (e.g., "3.5%")

  // Platform-specific data (raw JSON from scraper)
  raw_data: jsonb('raw_data'),

  // Metadata
  scraped_at: timestamp('scraped_at').defaultNow(),
  provider: varchar('provider', { length: 50 }), // apify, rapidapi, self-hosted
  ttl_expires_at: timestamp('ttl_expires_at'), // cache expiry
});

// Scraper jobs queue
export const scraper_jobs = pgTable('scraper_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  social_account_id: uuid('social_account_id').references(
    () => social_accounts.id,
  ),
  status: varchar('status', { length: 20 }), // pending, running, completed, failed
  provider: varchar('provider', { length: 50 }),
  platform: varchar('platform', { length: 20 }), // youtube, tiktok, instagram
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  error_message: text('error_message'),
  result_data: jsonb('result_data'),
  retry_count: integer('retry_count').default(0),
  max_retries: integer('max_retries').default(3),
  priority: integer('priority').default(0),
  created_at: timestamp('created_at').defaultNow(),
});

// Brands table
// Brand is a separate entity, can be linked to profile (user with brand role) via creator_brand_relationships
export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // Company name from registration form
  description: text('description'),
  website_url: text('website_url'),
  logo_url: text('logo_url'),
  brand_type: varchar('brand_type', { length: 20 }), // agency, direct, platform
  company_size: varchar('company_size', { length: 20 }), // 1-10, 11-50, 51-200, 201-1000, 1000+
  user_role: varchar('user_role', { length: 50 }), // marketing-manager, marketing-director, brand-manager, cmo, founder, other
  // Optional: link to profile if brand has a user account
  profile_id: uuid('profile_id').references(() => profile.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Creator-Brand relationships (many-to-many)
// Links profile (creator) with brands
export const creator_brand_relationships = pgTable(
  'creator_brand_relationships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creator_id: uuid('creator_id')
      .references(() => profile.id)
      .notNull(), // profile with creator role
    brand_id: uuid('brand_id')
      .references(() => brands.id)
      .notNull(),
    role: varchar('role', { length: 20 }), // owner, manager, collaborator
    status: varchar('status', { length: 20 }), // active, pending, inactive
    created_at: timestamp('created_at').defaultNow(),
  },
);

// Campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  brand_id: uuid('brand_id').references(() => brands.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  budget: integer('budget').notNull(), // in cents
  current_budget: integer('current_budget').notNull(), // current budget after reallocation
  goals: text('goals').array(), // array of campaign goals
  target_audience: text('target_audience'), // interests, keywords
  platforms: text('platforms').array(), // ['instagram', 'tiktok', 'youtube']
  audience_size: varchar('audience_size', { length: 20 }), // 'micro', 'mid-tier', 'macro', 'mega'
  target_location: text('target_location'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  status: varchar('status', { length: 20 })
    .notNull()
    .default('draft'), // 'draft', 'active', 'paused', 'completed'
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Campaign tracking configuration
// Rules for detecting campaign posts
export const campaign_tracking_config = pgTable(
  'campaign_tracking_config',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaign_id: uuid('campaign_id')
      .references(() => campaigns.id)
      .notNull(),

    // Tracking rules
    required_hashtags: text('required_hashtags').array(), // must contain at least one
    optional_hashtags: text('optional_hashtags').array(), // bonus points
    required_mentions: text('required_mentions').array(), // must mention brand
    tracking_link_pattern: text('tracking_link_pattern'), // pattern for tracking links
    min_match_confidence: numeric('min_match_confidence', {
      precision: 3,
      scale: 2,
    }).default('0.7'), // minimum score (0-1) to auto-detect

    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueCampaign: unique().on(table.campaign_id),
  }),
);

// Campaign allocations - budget distribution to creators
export const campaign_allocations = pgTable('campaign_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaign_id: uuid('campaign_id').references(() => campaigns.id).notNull(),
  creator_id: uuid('creator_id').references(() => profile.id).notNull(),
  allocated_budget: integer('allocated_budget').notNull(), // initially allocated budget in cents
  current_budget: integer('current_budget').notNull(), // current budget after reallocation in cents

  // Performance metrics (updated 2 times per day)
  // NO jsonb performance field - only columns
  reach: integer('reach').default(0),
  engagement: integer('engagement').default(0),
  conversions: integer('conversions').default(0),
  ctr: numeric('ctr', { precision: 5, scale: 2 }).default('0'), // click-through rate in percentage
  avg_engagement_rate: numeric('avg_engagement_rate', {
    precision: 5,
    scale: 2,
  }).default('0'),
  posts_count: integer('posts_count').default(0),

  // Optional: keep performance jsonb for raw data
  performance: jsonb('performance'), // raw performance data (optional)

  // Tracking
  status: varchar('status', { length: 20 })
    .notNull()
    .default('pending'), // 'pending', 'accepted', 'active', 'completed', 'declined'
  tracking_link: text('tracking_link'),
  contract_accepted: boolean('contract_accepted').default(false),
  contract_accepted_at: timestamp('contract_accepted_at'),
  last_collected_at: timestamp('last_collected_at'), // last update from Apify
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Budget reallocation history
// Audit trail for all budget changes
export const budget_reallocation_history = pgTable(
  'budget_reallocation_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    allocation_id: uuid('allocation_id')
      .references(() => campaign_allocations.id)
      .notNull(),
    campaign_id: uuid('campaign_id')
      .references(() => campaigns.id)
      .notNull(),

    // Budget change
    old_budget: integer('old_budget').notNull(),
    new_budget: integer('new_budget').notNull(),
    change_amount: integer('change_amount').notNull(), // new_budget - old_budget
    change_percentage: numeric('change_percentage', {
      precision: 5,
      scale: 2,
    }).notNull(), // (new_budget - old_budget) / old_budget * 100

    // Performance at time of change
    performance_snapshot: jsonb('performance_snapshot').notNull(), // { reach, engagement, conversions, ctr, performance_score }
    performance_score: numeric('performance_score', {
      precision: 5,
      scale: 2,
    }).notNull(), // calculated score at time of change

    // Reason
    reason: varchar('reason', { length: 50 }), // 'ai_reallocation', 'manual_adjustment', 'performance_based'
    triggered_by: varchar('triggered_by', { length: 50 }), // 'formula', 'manual', 'threshold'

    // Metadata
    created_at: timestamp('created_at').defaultNow().notNull(),
    created_by: uuid('created_by').references(() => users.id), // NULL if automated
  },
);

// User subscriptions - when brand subscribes to creator
export const user_subscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  brand_id: uuid('brand_id').references(() => brands.id).notNull(),
  creator_id: uuid('creator_id').references(() => profile.id).notNull(),
  subscribed_at: timestamp('subscribed_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// Posts from social platforms (partitioned by posted_at month)
// Note: Partitioning will be handled via migration SQL
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creator_id: uuid('creator_id')
      .references(() => profile.id)
      .notNull(),
    social_profile_id: uuid('social_profile_id')
      .references(() => creator_social_profiles.id)
      .notNull(),
    campaign_id: uuid('campaign_id').references(() => campaigns.id),
    allocation_id: uuid('allocation_id').references(
      () => campaign_allocations.id,
    ),
    platform: varchar('platform', { length: 20 }).notNull(),
    platform_post_id: text('platform_post_id').notNull(),
    url: text('url').notNull(),

    // Content
    content: text('content'), // post text/caption
    text: text('text'), // alias for content
    hashtags: text('hashtags').array(),
    mentions: text('mentions').array(),
    content_type: varchar('content_type', { length: 20 }), // 'post', 'story', 'reel', 'video'
    media_urls: jsonb('media_urls'), // array of media URLs

    // Metrics (updated via Apify)
    likes: integer('likes').default(0),
    comments: integer('comments').default(0),
    shares: integer('shares').default(0),
    views: integer('views').default(0),
    engagement_rate: numeric('engagement_rate', {
      precision: 5,
      scale: 2,
    }).default('0'),
    reach: integer('reach'),
    impressions: integer('impressions'),

    // Campaign tracking
    is_campaign_content: boolean('is_campaign_content').default(false),
    campaign_match_confidence: numeric('campaign_match_confidence', {
      precision: 3,
      scale: 2,
    }).default('0'), // 0-1 score from detection algorithm
    is_manually_confirmed: boolean('is_manually_confirmed').default(false), // brand confirmed manually
    detection_rules_applied: jsonb('detection_rules_applied'), // which rules matched

    // Timestamps
    posted_at: timestamp('posted_at').notNull(),
    timestamp: timestamp('timestamp').notNull(), // alias for posted_at
    scraped_at: timestamp('scraped_at').defaultNow(),
    collected_at: timestamp('collected_at').defaultNow().notNull(),
    last_updated_at: timestamp('last_updated_at').defaultNow().notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),

    // Raw data
    raw_data: jsonb('raw_data'),

    // Legacy fields (for backward compatibility)
    social_account_id: uuid('social_account_id').references(
      () => social_accounts.id,
    ),
    metrics: jsonb('metrics'), // legacy field
  },
  (table) => ({
    uniquePost: unique().on(table.platform, table.platform_post_id),
    idxCreator: index('idx_posts_creator').on(table.creator_id),
    idxCampaign: index('idx_posts_campaign').on(table.campaign_id),
    idxAllocation: index('idx_posts_allocation').on(table.allocation_id),
    idxPlatform: index('idx_posts_platform').on(table.platform),
    idxTimestamp: index('idx_posts_timestamp').on(table.timestamp),
    idxCampaignContent: index('idx_posts_campaign_content').on(
      table.is_campaign_content,
    ),
  }),
);

// Analytics reports
export const analytics_reports = pgTable('analytics_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  creator_id: uuid('creator_id').references(() => profile.id),
  brand_id: uuid('brand_id').references(() => brands.id),
  report_type: varchar('report_type', { length: 20 }), // summary, detailed, comparison
  period_start: timestamp('period_start'),
  period_end: timestamp('period_end'),
  data: jsonb('data'), // structured report data
  created_at: timestamp('created_at').defaultNow(),
});

// Statistics calculations cache
export const statistics_calculations = pgTable('statistics_calculations', {
  id: uuid('id').defaultRandom().primaryKey(),
  entity_type: varchar('entity_type', { length: 20 }), // creator, brand
  entity_id: uuid('entity_id'),
  calculation_type: varchar('calculation_type', { length: 20 }), // engagement_rate, growth_rate, trend
  period: varchar('period', { length: 20 }), // daily, weekly, monthly
  value: text('value'), // stored as text to support various numeric formats
  metadata: jsonb('metadata'),
  calculated_at: timestamp('calculated_at').defaultNow(),
  expires_at: timestamp('expires_at'),
});

// Events raw (stores 7 days, then deleted)
// Note: Partitioning will be handled via migration SQL
export const events_raw = pgTable(
  'events_raw',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaign_id: uuid('campaign_id')
      .references(() => campaigns.id)
      .notNull(),
    allocation_id: uuid('allocation_id')
      .references(() => campaign_allocations.id)
      .notNull(),
    creator_id: uuid('creator_id')
      .references(() => profile.id)
      .notNull(),
    event_type: varchar('event_type', { length: 20 }).notNull(), // 'impression', 'click', 'conversion'

    // UTM parameters
    utm_source: varchar('utm_source', { length: 50 }),
    utm_medium: varchar('utm_medium', { length: 50 }),
    utm_campaign: varchar('utm_campaign', { length: 50 }),
    utm_content: varchar('utm_content', { length: 50 }),

    // Tracking data
    ip_address: inet('ip_address'),
    user_agent: text('user_agent'),
    referrer: text('referrer'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),

    // TTL: auto-delete after 7 days (computed column via migration)
    expires_at: timestamp('expires_at'),
  },
  (table) => ({
    idxCampaign: index('idx_events_raw_campaign').on(table.campaign_id),
    idxAllocation: index('idx_events_raw_allocation').on(table.allocation_id),
    idxType: index('idx_events_raw_type').on(table.event_type),
    idxTimestamp: index('idx_events_raw_timestamp').on(table.timestamp),
  }),
);

// Events aggregated (hourly aggregates - stored forever)
export const events_aggregated = pgTable(
  'events_aggregated',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaign_id: uuid('campaign_id')
      .references(() => campaigns.id)
      .notNull(),
    allocation_id: uuid('allocation_id')
      .references(() => campaign_allocations.id)
      .notNull(),
    creator_id: uuid('creator_id')
      .references(() => profile.id)
      .notNull(),

    // Time bucket (hour)
    hour_bucket: timestamp('hour_bucket').notNull(), // rounded to hour

    // Aggregated counts
    impressions_count: integer('impressions_count').default(0),
    clicks_count: integer('clicks_count').default(0),
    conversions_count: integer('conversions_count').default(0),

    // Unique counts (approximate)
    unique_impressions: integer('unique_impressions').default(0), // unique IPs
    unique_clicks: integer('unique_clicks').default(0),

    // Computed CTR (will be added via migration)
    // ctr: numeric GENERATED ALWAYS AS (...)

    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueEventAgg: unique().on(
      table.campaign_id,
      table.allocation_id,
      table.creator_id,
      table.hour_bucket,
    ),
    idxCampaign: index('idx_events_agg_campaign').on(table.campaign_id),
    idxAllocation: index('idx_events_agg_allocation').on(table.allocation_id),
    idxHour: index('idx_events_agg_hour').on(table.hour_bucket),
  }),
);

// Apify jobs queue (with priorities)
export const apify_jobs_queue = pgTable(
  'apify_jobs_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    job_type: varchar('job_type', { length: 50 }).notNull(), // 'profile_scrape', 'posts_scrape', 'hashtag_search'
    social_profile_id: uuid('social_profile_id').references(
      () => creator_social_profiles.id,
    ),
    campaign_id: uuid('campaign_id').references(() => campaigns.id),
    allocation_id: uuid('allocation_id').references(
      () => campaign_allocations.id,
    ),

    // Job parameters
    parameters: jsonb('parameters').notNull(), // { username, platform, startDate, limit, etc. }

    // Priority (higher = more important)
    priority: integer('priority').default(0), // 0-100, higher = more urgent
    status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'running', 'completed', 'failed'

    // Rate limiting
    estimated_cost: integer('estimated_cost').default(1), // estimated API calls cost
    retry_count: integer('retry_count').default(0),
    max_retries: integer('max_retries').default(3),

    // Execution
    scheduled_at: timestamp('scheduled_at').defaultNow(),
    started_at: timestamp('started_at'),
    completed_at: timestamp('completed_at'),
    error_message: text('error_message'),
    result_data: jsonb('result_data'),

    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxStatus: index('idx_apify_jobs_status').on(table.status),
    idxPriority: index('idx_apify_jobs_priority').on(
      table.priority,
      table.scheduled_at,
    ),
  }),
);

// Apify rate limits tracking
export const apify_rate_limits = pgTable(
  'apify_rate_limits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    period_start: timestamp('period_start').notNull(), // start of period (day/hour)
    period_type: varchar('period_type', { length: 20 }).notNull(), // 'daily', 'hourly'
    calls_made: integer('calls_made').default(0),
    calls_limit: integer('calls_limit').notNull(), // 500 for daily, 50 for hourly
    cost_spent: numeric('cost_spent', { precision: 10, scale: 2 }).default(
      '0',
    ), // in USD
    cost_limit: numeric('cost_limit', { precision: 10, scale: 2 }), // monthly budget limit
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniquePeriod: unique().on(table.period_start, table.period_type),
    idxPeriod: index('idx_apify_limits_period').on(
      table.period_start,
      table.period_type,
    ),
  }),
);

// Apify API calls log (for monitoring)
export const apify_calls_log = pgTable('apify_calls_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  job_id: uuid('job_id').references(() => apify_jobs_queue.id),
  actor_id: text('actor_id').notNull(), // Apify actor ID
  run_id: text('run_id'), // Apify run ID
  status: varchar('status', { length: 20 }), // 'success', 'failed', 'rate_limited'
  cost: numeric('cost', { precision: 10, scale: 2 }).default('0'),
  duration_ms: integer('duration_ms'),
  error_message: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Auth tables
// Refresh tokens for JWT (stored in DB as hash)
export const refresh_tokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  token_hash: text('token_hash').notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Accounts table for OAuth providers (OAuth tokens stored in Redis)
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  provider: varchar('provider', { length: 20 }).notNull(), // google, tiktok, instagram
  subject: text('subject').notNull(), // provider user id (OIDC subject)
  is_verified: boolean('is_verified').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(users, {
    fields: [profile.user_id],
    references: [users.id],
  }),
  social_accounts: many(social_accounts),
  creator_social_profiles: many(creator_social_profiles),
  creatorBrandRelationships: many(creator_brand_relationships),
  brand: one(brands, {
    fields: [profile.id],
    references: [brands.profile_id],
  }),
  campaignAllocations: many(campaign_allocations),
  subscriptions: many(user_subscriptions),
  posts: many(posts),
  events: many(events_raw),
  eventsAggregated: many(events_aggregated),
}));

export const socialAccountsRelations = relations(
  social_accounts,
  ({ one, many }) => ({
    creator: one(profile, {
      fields: [social_accounts.creator_id],
      references: [profile.id],
    }),
    stats: many(platform_stats),
    jobs: many(scraper_jobs),
    posts: many(posts),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.user_id],
    references: [users.id],
  }),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  profile: one(profile, {
    fields: [brands.profile_id],
    references: [profile.id],
  }),
  creatorRelationships: many(creator_brand_relationships),
  campaigns: many(campaigns),
  subscriptions: many(user_subscriptions),
}));

export const creatorBrandRelationshipsRelations = relations(
  creator_brand_relationships,
  ({ one }) => ({
    creator: one(profile, {
      fields: [creator_brand_relationships.creator_id],
      references: [profile.id],
    }),
    brand: one(brands, {
      fields: [creator_brand_relationships.brand_id],
      references: [brands.id],
    }),
  }),
);

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brands, {
    fields: [campaigns.brand_id],
    references: [brands.id],
  }),
  allocations: many(campaign_allocations),
  trackingConfig: one(campaign_tracking_config, {
    fields: [campaigns.id],
    references: [campaign_tracking_config.campaign_id],
  }),
  posts: many(posts),
  events: many(events_raw),
  eventsAggregated: many(events_aggregated),
  reallocationHistory: many(budget_reallocation_history),
}));

export const campaignAllocationsRelations = relations(
  campaign_allocations,
  ({ one, many }) => ({
    campaign: one(campaigns, {
      fields: [campaign_allocations.campaign_id],
      references: [campaigns.id],
    }),
    creator: one(profile, {
      fields: [campaign_allocations.creator_id],
      references: [profile.id],
    }),
    posts: many(posts),
    events: many(events_raw),
    eventsAggregated: many(events_aggregated),
    reallocationHistory: many(budget_reallocation_history),
  }),
);

export const userSubscriptionsRelations = relations(
  user_subscriptions,
  ({ one }) => ({
    brand: one(brands, {
      fields: [user_subscriptions.brand_id],
      references: [brands.id],
    }),
    creator: one(profile, {
      fields: [user_subscriptions.creator_id],
      references: [profile.id],
    }),
  }),
);

export const postsRelations = relations(posts, ({ one }) => ({
  creator: one(profile, {
    fields: [posts.creator_id],
    references: [profile.id],
  }),
  socialProfile: one(creator_social_profiles, {
    fields: [posts.social_profile_id],
    references: [creator_social_profiles.id],
  }),
  campaign: one(campaigns, {
    fields: [posts.campaign_id],
    references: [campaigns.id],
  }),
  allocation: one(campaign_allocations, {
    fields: [posts.allocation_id],
    references: [campaign_allocations.id],
  }),
  socialAccount: one(social_accounts, {
    fields: [posts.social_account_id],
    references: [social_accounts.id],
  }),
}));

export const creatorSocialProfilesRelations = relations(
  creator_social_profiles,
  ({ one, many }) => ({
    creator: one(profile, {
      fields: [creator_social_profiles.creator_id],
      references: [profile.id],
    }),
    posts: many(posts),
    apifyJobs: many(apify_jobs_queue),
  }),
);

export const campaignTrackingConfigRelations = relations(
  campaign_tracking_config,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaign_tracking_config.campaign_id],
      references: [campaigns.id],
    }),
  }),
);

export const budgetReallocationHistoryRelations = relations(
  budget_reallocation_history,
  ({ one }) => ({
    allocation: one(campaign_allocations, {
      fields: [budget_reallocation_history.allocation_id],
      references: [campaign_allocations.id],
    }),
    campaign: one(campaigns, {
      fields: [budget_reallocation_history.campaign_id],
      references: [campaigns.id],
    }),
    createdBy: one(users, {
      fields: [budget_reallocation_history.created_by],
      references: [users.id],
    }),
  }),
);

export const eventsRawRelations = relations(events_raw, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [events_raw.campaign_id],
    references: [campaigns.id],
  }),
  allocation: one(campaign_allocations, {
    fields: [events_raw.allocation_id],
    references: [campaign_allocations.id],
  }),
  creator: one(profile, {
    fields: [events_raw.creator_id],
    references: [profile.id],
  }),
}));

export const eventsAggregatedRelations = relations(
  events_aggregated,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [events_aggregated.campaign_id],
      references: [campaigns.id],
    }),
    allocation: one(campaign_allocations, {
      fields: [events_aggregated.allocation_id],
      references: [campaign_allocations.id],
    }),
    creator: one(profile, {
      fields: [events_aggregated.creator_id],
      references: [profile.id],
    }),
  }),
);

export const apifyJobsQueueRelations = relations(
  apify_jobs_queue,
  ({ one }) => ({
    socialProfile: one(creator_social_profiles, {
      fields: [apify_jobs_queue.social_profile_id],
      references: [creator_social_profiles.id],
    }),
    campaign: one(campaigns, {
      fields: [apify_jobs_queue.campaign_id],
      references: [campaigns.id],
    }),
    allocation: one(campaign_allocations, {
      fields: [apify_jobs_queue.allocation_id],
      references: [campaign_allocations.id],
    }),
  }),
);

export const analyticsReportsRelations = relations(
  analytics_reports,
  ({ one }) => ({
    creator: one(profile, {
      fields: [analytics_reports.creator_id],
      references: [profile.id],
    }),
    brand: one(brands, {
      fields: [analytics_reports.brand_id],
      references: [brands.id],
    }),
  }),
);
