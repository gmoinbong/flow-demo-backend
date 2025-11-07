CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(20) NOT NULL,
	"subject" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid,
	"followers_count" integer,
	"following_count" integer,
	"total_posts" integer,
	"total_views" integer,
	"engagement_rate" text,
	"raw_data" jsonb,
	"scraped_at" timestamp DEFAULT now(),
	"provider" varchar(50),
	"ttl_expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "scraper_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid,
	"status" varchar(20),
	"provider" varchar(50),
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"result_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid,
	"platform" varchar(20),
	"platform_user_id" text,
	"username" text,
	"metadata" jsonb,
	"is_primary" boolean DEFAULT false,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_stats" ADD CONSTRAINT "platform_stats_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraper_jobs" ADD CONSTRAINT "scraper_jobs_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;