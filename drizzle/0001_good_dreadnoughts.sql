CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beers" ADD COLUMN "status" text DEFAULT 'on_tap' NOT NULL;--> statement-breakpoint
ALTER TABLE "beers" ADD COLUMN "srm" real;--> statement-breakpoint
ALTER TABLE "beers" ADD COLUMN "glass" text DEFAULT 'pint' NOT NULL;