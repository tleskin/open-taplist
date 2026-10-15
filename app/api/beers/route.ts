import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { beers, type BeerStatus } from "@/db/schema";

const STATUS_ORDER: Record<BeerStatus, number> = {
  on_tap: 0,
  fermenting: 1,
  coming_soon: 2,
};

export async function GET() {
  await connection(); // skip prerendering: this route reads the live database
  const db = getDb();
  const rows = await db
    .select()
    .from(beers)
    .where(eq(beers.isActive, true))
    .orderBy(asc(beers.tapNumber));

  // Group by status (on tap → fermenting → coming soon), keeping tap order
  // within each group.
  rows.sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );

  return Response.json(rows);
}
