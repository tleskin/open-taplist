import { connection } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { beers, type BeerStatus } from "@/db/schema";

const STATUS_ORDER: Record<BeerStatus, number> = {
  on_tap: 0,
  fermenting: 1,
  coming_soon: 2,
};

export async function GET(request: Request) {
  await connection(); // skip prerendering: this route reads the live database
  const db = getDb();

  // Cheap version stamp for conditional requests. Every beer write bumps
  // updatedAt, so max(updatedAt) + row count fully describes the payload.
  // The TV polls every 30s; a 304 avoids re-downloading ~200KB+ of label
  // images when nothing changed (Neon free tier = 5GB transfer/month).
  const version = await db
    .select({
      maxUpdated: sql<string | null>`max(${beers.updatedAt})`,
      count: sql<number>`count(*)`,
    })
    .from(beers)
    .where(eq(beers.isActive, true));
  const v = version[0] ?? { maxUpdated: null, count: 0 };
  const etag = `"beers-${v.count}-${v.maxUpdated ?? "none"}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

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

  return Response.json(rows, { headers: { ETag: etag } });
}
