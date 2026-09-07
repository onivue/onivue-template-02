CREATE TYPE "public"."event_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."form_field_scope" AS ENUM('guest', 'invitation');--> statement-breakpoint
CREATE TYPE "public"."form_field_type" AS ENUM('text', 'textarea', 'select', 'radio', 'checkbox');--> statement-breakpoint
CREATE TYPE "public"."guest_age_group" AS ENUM('adult', 'child');--> statement-breakpoint
CREATE TYPE "public"."guest_response" AS ENUM('open', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."response_log_actor" AS ENUM('guest', 'admin');--> statement-breakpoint
CREATE TYPE "public"."response_log_kind" AS ENUM('response', 'answer');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text,
	"title" text NOT NULL,
	"greeting" text,
	"location" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"response_deadline" timestamp with time zone,
	"status" "event_status" DEFAULT 'active' NOT NULL,
	"theme_accent" text DEFAULT '#bbfa0d' NOT NULL,
	"theme_mode" "theme_mode" DEFAULT 'light' NOT NULL,
	"theme_font" text DEFAULT 'grotesk' NOT NULL,
	"theme_header_image_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"field_id" text NOT NULL,
	"guest_id" text,
	"invitation_id" text,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_answer_single_target" CHECK (("event_answer"."guest_id" IS NULL) <> ("event_answer"."invitation_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "event_form_field" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"type" "form_field_type" NOT NULL,
	"label" text NOT NULL,
	"help_text" text,
	"scope" "form_field_scope" DEFAULT 'guest' NOT NULL,
	"only_when_attending" boolean DEFAULT false NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer NOT NULL,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_guest" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"note" text,
	"age_group" "guest_age_group" DEFAULT 'adult' NOT NULL,
	"is_main_guest" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"response" "guest_response" DEFAULT 'open' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"token" text NOT NULL,
	"sent_at" timestamp with time zone,
	"response_deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "event_response_log" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"guest_id" text,
	"field_id" text,
	"kind" "response_log_kind" NOT NULL,
	"previous_value" jsonb,
	"next_value" jsonb,
	"actor" "response_log_actor" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_answer" ADD CONSTRAINT "event_answer_field_id_event_form_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."event_form_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_answer" ADD CONSTRAINT "event_answer_guest_id_event_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."event_guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_answer" ADD CONSTRAINT "event_answer_invitation_id_event_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."event_invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_form_field" ADD CONSTRAINT "event_form_field_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_guest" ADD CONSTRAINT "event_guest_invitation_id_event_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."event_invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_response_log" ADD CONSTRAINT "event_response_log_invitation_id_event_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."event_invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_response_log" ADD CONSTRAINT "event_response_log_guest_id_event_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."event_guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_response_log" ADD CONSTRAINT "event_response_log_field_id_event_form_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."event_form_field"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_organizationId_idx" ON "event" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_answer_field_guest_idx" ON "event_answer" USING btree ("field_id","guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_answer_field_invitation_idx" ON "event_answer" USING btree ("field_id","invitation_id");--> statement-breakpoint
CREATE INDEX "event_form_field_eventId_idx" ON "event_form_field" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_guest_invitationId_idx" ON "event_guest" USING btree ("invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_guest_main_idx" ON "event_guest" USING btree ("invitation_id") WHERE "event_guest"."is_main_guest";--> statement-breakpoint
CREATE INDEX "event_invitation_eventId_idx" ON "event_invitation" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_response_log_invitationId_idx" ON "event_response_log" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "event_response_log_guestId_idx" ON "event_response_log" USING btree ("guest_id");