CREATE TABLE "beers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"style" text NOT NULL,
	"abv" real NOT NULL,
	"ibu" integer,
	"description" text,
	"tap_number" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
