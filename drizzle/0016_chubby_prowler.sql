ALTER TABLE "event" ADD COLUMN "notes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
-- the two named columns became one list of sections. what a host already wrote moves over, each
-- with the symbol and title its column stood for; the columns themselves go in the next migration.
UPDATE "event" SET "notes" =
	(CASE WHEN "food_and_drinks" IS NOT NULL THEN jsonb_build_array(jsonb_build_object(
		'id', gen_random_uuid()::text,
		'icon', 'food',
		'title', 'Essen & Trinken',
		'body', "food_and_drinks"
	)) ELSE '[]'::jsonb END)
	||
	(CASE WHEN "general_info" IS NOT NULL THEN jsonb_build_array(jsonb_build_object(
		'id', gen_random_uuid()::text,
		'icon', 'info',
		'title', 'Gut zu wissen',
		'body', "general_info"
	)) ELSE '[]'::jsonb END)
WHERE "food_and_drinks" IS NOT NULL OR "general_info" IS NOT NULL;
