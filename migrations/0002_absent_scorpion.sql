CREATE TABLE "analytics_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid,
	"brand_id" uuid,
	"report_type" varchar(20),
	"period_start" timestamp,
	"period_end" timestamp,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website_url" text,
	"logo_url" text,
	"brand_type" varchar(20),
	"profile_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_brand_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"role" varchar(20),
	"status" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "statistics_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(20),
	"entity_id" uuid,
	"calculation_type" varchar(20),
	"period" varchar(20),
	"value" text,
	"metadata" jsonb,
	"calculated_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user_role" ALTER COLUMN "name" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "status" varchar(20);--> statement-breakpoint
ALTER TABLE "scraper_jobs" ADD COLUMN "platform" varchar(20);--> statement-breakpoint
ALTER TABLE "scraper_jobs" ADD COLUMN "retry_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "scraper_jobs" ADD COLUMN "max_retries" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "scraper_jobs" ADD COLUMN "priority" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_brand_relationships" ADD CONSTRAINT "creator_brand_relationships_creator_id_profile_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_brand_relationships" ADD CONSTRAINT "creator_brand_relationships_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;