import { connection } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { beers } from "@/db/schema";
import { getSetting } from "@/lib/settings";

// Blunt per-IP throttle: cheers are a vibe, not a bank balance. One device
// per guest plus localStorage on the client keeps honest counts; this just
// stops scripts from inflating them.
const WINDOW_MS = 60_000;
const MAX_HITS = 30;
const hits = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 2000) {
    const oldest = hits.keys().next().value;
    if (oldest !== undefined) hits.delete(oldest);
  }
  return recent.length > MAX_HITS;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id } = await params;
  const beerId = Number(id);
  if (!Number.isInteger(beerId) || beerId <= 0) {
    return Response.json({ error: "Invalid pour id." }, { status: 400 });
  }
  if ((await getSetting("cheers_enabled")) === "false") {
    return Response.json({ error: "Cheers are disabled." }, { status: 403 });
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (throttled(ip)) {
    return Response.json({ error: "Slow down." }, { status: 429 });
  }
  const db = getDb();
  const rows = await db
    .update(beers)
    .set({ cheers: sql`${beers.cheers} + 1`, updatedAt: new Date() })
    .where(eq(beers.id, beerId))
    .returning({ cheers: beers.cheers });
  if (rows.length === 0) {
    return Response.json({ error: "Pour not found." }, { status: 404 });
  }
  return Response.json({ cheers: rows[0].cheers });
}
