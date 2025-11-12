CREATE TABLE "apify_calls_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"actor_id" text NOT NULL,
	"run_id" text,
	"status" varchar(20),
	"cost" numeric(10, 2) DEFAULT '0',
	"duration_ms" integer,
	"error_message" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apify_jobs_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"social_profile_id" uuid,
	"campaign_id" uuid,
	"allocation_id" uuid,
	"parameters" jsonb NOT NULL,
	"priority" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"estimated_cost" integer DEFAULT 1,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"scheduled_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"result_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apify_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"calls_made" integer DEFAULT 0,
	"calls_limit" integer NOT NULL,
	"cost_spent" numeric(10, 2) DEFAULT '0',
	"cost_limit" numeric(10, 2),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "apify_rate_limits_period_start_period_type_unique" UNIQUE("period_start","period_type")
);
--> statement-breakpoint
CREATE TABLE "budget_reallocation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allocation_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"old_budget" integer NOT NULL,
	"new_budget" integer NOT NULL,
	"change_amount" integer NOT NULL,
	"change_percentage" numeric(5, 2) NOT NULL,
	"performance_snapshot" jsonb NOT NULL,
	"performance_score" numeric(5, 2) NOT NULL,
	"reason" varchar(50),
	"triggered_by" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "campaign_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"allocated_budget" integer NOT NULL,
	"current_budget" integer NOT NULL,
	"reach" integer DEFAULT 0,
	"engagement" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"ctr" numeric(5, 2) DEFAULT '0',
	"avg_engagement_rate" numeric(5, 2) DEFAULT '0',
	"posts_count" integer DEFAULT 0,
	"performance" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"tracking_link" text,
	"contract_accepted" boolean DEFAULT false,
	"contract_accepted_at" timestamp,
	"last_collected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_tracking_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"required_hashtags" text[],
	"optional_hashtags" text[],
	"required_mentions" text[],
	"tracking_link_pattern" text,
	"min_match_confidence" numeric(3, 2) DEFAULT '0.7',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_tracking_config_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"budget" integer NOT NULL,
	"current_budget" integer NOT NULL,
	"goals" text[],
	"target_audience" text,
	"platforms" text[],
	"audience_size" varchar(20),
	"target_location" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_social_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"platform_user_id" text,
	"username" text NOT NULL,
	"profile_url" text,
	"is_primary" boolean DEFAULT false,
	"followers_declared" integer,
	"engagement_rate_declared" numeric(5, 2),
	"niches" text[],
	"location" text,
	"followers_verified" integer,
	"engagement_rate_verified" numeric(5, 2),
	"following_count" integer,
	"posts_count" integer,
	"bio" text,
	"is_verified" boolean DEFAULT false,
	"last_verified_at" timestamp,
	"metadata" jsonb,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_social_profiles_creator_id_platform_unique" UNIQUE("creator_id","platform")
);
--> statement-breakpoint
CREATE TABLE "events_aggregated" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"allocation_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"hour_bucket" timestamp NOT NULL,
	"impressions_count" integer DEFAULT 0,
	"clicks_count" integer DEFAULT 0,
	"conversions_count" integer DEFAULT 0,
	"unique_impressions" integer DEFAULT 0,
	"unique_clicks" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_aggregated_campaign_id_allocation_id_creator_id_hour_bucket_unique" UNIQUE("campaign_id","allocation_id","creator_id","hour_bucket")
);
--> statement-breakpoint
CREATE TABLE "events_raw" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"allocation_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"utm_source" varchar(50),
	"utm_medium" varchar(50),
	"utm_campaign" varchar(50),
	"utm_content" varchar(50),
	"ip_address" "inet",
	"user_agent" text,
	"referrer" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"social_profile_id" uuid NOT NULL,
	"campaign_id" uuid,
	"allocation_id" uuid,
	"platform" varchar(20) NOT NULL,
	"platform_post_id" text NOT NULL,
	"url" text NOT NULL,
	"content" text,
	"text" text,
	"hashtags" text[],
	"mentions" text[],
	"content_type" varchar(20),
	"media_urls" jsonb,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"engagement_rate" numeric(5, 2) DEFAULT '0',
	"reach" integer,
	"impressions" integer,
	"is_campaign_content" boolean DEFAULT false,
	"campaign_match_confidence" numeric(3, 2) DEFAULT '0',
	"is_manually_confirmed" boolean DEFAULT false,
	"detection_rules_applied" jsonb,
	"posted_at" timestamp NOT NULL,
	"timestamp" timestamp NOT NULL,
	"scraped_at" timestamp DEFAULT now(),
	"collected_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"raw_data" jsonb,
	"social_account_id" uuid,
	"metrics" jsonb,
	CONSTRAINT "posts_platform_platform_post_id_unique" UNIQUE("platform","platform_post_id")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "apify_calls_log" ADD CONSTRAINT "apify_calls_log_job_id_apify_jobs_queue_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."apify_jobs_queue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apify_jobs_queue" ADD CONSTRAINT "apify_jobs_queue_social_profile_id_creator_social_profiles_id_fk" FOREIGN KEY ("social_profile_id") REFERENCES "public"."creator_social_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apify_jobs_queue" ADD CONSTRAINT "apify_jobs_queue_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apify_jobs_queue" ADD CONSTRAINT "apify_jobs_queue_allocation_id_campaign_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."campaign_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reallocation_history" ADD CONSTRAINT "budget_reallocation_history_allocation_id_campaign_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."campaign_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reallocation_history" ADD CONSTRAINT "budget_reallocation_history_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reallocation_history" ADD CONSTRAINT "budget_reallocation_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_allocations" ADD CONSTRAINT "campaign_allocations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_allocations" ADD CONSTRAINT "campaign_allocations_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_tracking_config" ADD CONSTRAINT "campaign_tracking_config_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_social_profiles" ADD CONSTRAINT "creator_social_profiles_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_aggregated" ADD CONSTRAINT "events_aggregated_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_aggregated" ADD CONSTRAINT "events_aggregated_allocation_id_campaign_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."campaign_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_aggregated" ADD CONSTRAINT "events_aggregated_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_raw" ADD CONSTRAINT "events_raw_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_raw" ADD CONSTRAINT "events_raw_allocation_id_campaign_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."campaign_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_raw" ADD CONSTRAINT "events_raw_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_social_profile_id_creator_social_profiles_id_fk" FOREIGN KEY ("social_profile_id") REFERENCES "public"."creator_social_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_allocation_id_campaign_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."campaign_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_apify_jobs_status" ON "apify_jobs_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_apify_jobs_priority" ON "apify_jobs_queue" USING btree ("priority","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_apify_limits_period" ON "apify_rate_limits" USING btree ("period_start","period_type");--> statement-breakpoint
CREATE INDEX "idx_creator_social_profiles_creator" ON "creator_social_profiles" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_creator_social_profiles_platform" ON "creator_social_profiles" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_events_agg_campaign" ON "events_aggregated" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_events_agg_allocation" ON "events_aggregated" USING btree ("allocation_id");--> statement-breakpoint
CREATE INDEX "idx_events_agg_hour" ON "events_aggregated" USING btree ("hour_bucket");--> statement-breakpoint
CREATE INDEX "idx_events_raw_campaign" ON "events_raw" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_events_raw_allocation" ON "events_raw" USING btree ("allocation_id");--> statement-breakpoint
CREATE INDEX "idx_events_raw_type" ON "events_raw" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_events_raw_timestamp" ON "events_raw" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_posts_creator" ON "posts" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_posts_campaign" ON "posts" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_posts_allocation" ON "posts" USING btree ("allocation_id");--> statement-breakpoint
CREATE INDEX "idx_posts_platform" ON "posts" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_posts_timestamp" ON "posts" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_posts_campaign_content" ON "posts" USING btree ("is_campaign_content");