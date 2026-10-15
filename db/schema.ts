import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const BEER_STATUSES = ["on_tap", "fermenting", "coming_soon"] as const;
export type BeerStatus = (typeof BEER_STATUSES)[number];

export const GLASS_TYPES = [
  "pint",
  "tulip",
  "snifter",
  "pilsner",
  "mug",
  "weizen",
  "ipa",
] as const;
export type GlassType = (typeof GLASS_TYPES)[number];

export const beers = pgTable("beers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  style: text("style").notNull(),
  abv: real("abv").notNull(),
  ibu: integer("ibu"),
  description: text("description"),
  tapNumber: integer("tap_number").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("on_tap").$type<BeerStatus>(),
  srm: real("srm"),
  glass: text("glass").notNull().default("pint").$type<GlassType>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Beer = typeof beers.$inferSelect;
export type NewBeer = typeof beers.$inferInsert;
export type Setting = typeof settings.$inferSelect;
