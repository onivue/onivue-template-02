ALTER TABLE "event" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_street" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_postal_code" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_city" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_latitude" double precision;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_longitude" double precision;--> statement-breakpoint
-- the old free-text address was typed as a block of lines, the last of them "postcode city" and the
-- one above it the street. a block that does not end that way cannot be taken apart safely, so it is
-- kept whole as the venue name rather than guessed at — no address is lost either way.
WITH parsed AS (
	SELECT
		e."id",
		lines,
		array_length(lines, 1) AS count,
		regexp_match(lines[array_length(lines, 1)], '^(\d{4,5})\s+(.+)$') AS postal
	FROM "event" e
	CROSS JOIN LATERAL (
		SELECT array_agg(line ORDER BY position) AS lines
		FROM (
			SELECT btrim(line) AS line, position
			FROM unnest(string_to_array(e."location", E'\n')) WITH ORDINALITY AS t(line, position)
		) trimmed
		WHERE line <> ''
	) split
	WHERE e."location" IS NOT NULL AND lines IS NOT NULL
)
UPDATE "event" e
SET
	"location_street" = CASE WHEN p.postal IS NOT NULL AND p.count > 1 THEN p.lines[p.count - 1] END,
	"location_postal_code" = p.postal[1],
	"location_city" = p.postal[2],
	"location_name" = CASE
		WHEN p.postal IS NULL THEN array_to_string(p.lines, ', ')
		WHEN p.count > 2 THEN array_to_string(p.lines[1:p.count - 2], ', ')
	END
FROM parsed p
WHERE e."id" = p."id";
