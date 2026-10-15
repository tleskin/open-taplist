import "dotenv/config";
import { getDb } from "./index";
import { beers, settings, type NewBeer } from "./schema";

const sampleBeers: NewBeer[] = [
  {
    name: "Garage Door IPA",
    style: "West Coast IPA",
    abv: 6.8,
    ibu: 72,
    description:
      "Piney, resinous, and unapologetically bitter. Dry-hopped with Citra and Simcoe.",
    tapNumber: 1,
    isActive: true,
    status: "on_tap",
    srm: 6,
    glass: "pint",
  },
  {
    name: "Amber Waves",
    style: "American Amber Ale",
    abv: 5.4,
    ibu: 28,
    description:
      "Toasty malt, a kiss of caramel, and a clean citrus finish. The crowd-pleaser.",
    tapNumber: 2,
    isActive: true,
    status: "on_tap",
    srm: 12,
    glass: "tulip",
  },
  {
    name: "Midnight Oil Stout",
    style: "Imperial Stout",
    abv: 9.2,
    ibu: 55,
    description:
      "Roasted malt, dark chocolate, and a whisper of coffee. Brewed for late garage sessions.",
    tapNumber: 3,
    isActive: true,
    status: "on_tap",
    srm: 35,
    glass: "snifter",
  },
  {
    name: "Kölsch You Later",
    style: "Kölsch",
    abv: 4.9,
    ibu: 24,
    description:
      "Crisp and crushable. Fermented cool, lagering away — patience, people.",
    tapNumber: 0,
    isActive: true,
    status: "fermenting",
    srm: 3,
    glass: "pilsner",
  },
  {
    name: "Hazy Daze",
    style: "New England IPA",
    abv: 6.2,
    ibu: 38,
    description:
      "Juicy, hazy, and soft. Double dry-hop of Mosaic and Galaxy doing its thing in the fermenter.",
    tapNumber: 0,
    isActive: true,
    status: "fermenting",
    srm: 4,
    glass: "tulip",
  },
  {
    name: "Shop Dog Porter",
    style: "Robust Porter",
    abv: 6.0,
    ibu: 30,
    description:
      "Next up on the brew schedule. Chocolate malt, a little smoke, very good boy.",
    tapNumber: 0,
    isActive: true,
    status: "coming_soon",
    srm: 28,
    glass: "mug",
  },
];

async function main() {
  const db = getDb();
  console.log("Clearing beers and reseeding...");
  await db.delete(beers);
  await db.insert(beers).values(sampleBeers);
  console.log(`Inserted ${sampleBeers.length} beers.`);

  console.log("Seeding default settings...");
  await db
    .insert(settings)
    .values({ key: "theme", value: "midnight" })
    .onConflictDoNothing();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
