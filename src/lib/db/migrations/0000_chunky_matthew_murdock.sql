CREATE TABLE "system_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"source_url" text NOT NULL,
	"status" text,
	"topic" text,
	"summary" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "policy_items_source_id_source_unique" UNIQUE("source_id","source")
);
