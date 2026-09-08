ALTER TABLE "event" ADD COLUMN "notification_email" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "notify_on_response" boolean DEFAULT false NOT NULL;