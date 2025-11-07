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

// Social accounts linked to creators
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
  creatorBrandRelationships: many(creator_brand_relationships),
  brand: one(brands, {
    fields: [profile.id],
    references: [brands.profile_id],
  }),
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
