"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  BEER_STATUSES,
  GLASS_TYPES,
  beers,
  type BeerStatus,
  type GlassType,
} from "@/db/schema";

export type BeerInput = {
  name: string;
  style: string;
  abv: number;
  ibu: number | null;
  description: string | null;
  tapNumber: number;
  status: BeerStatus;
  srm: number | null;
  glass: GlassType;
  labelImage: string | null;
};

const MAX_IMAGE_LENGTH = 2_800_000; // ~2MB image as a data URL

function isImageValue(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.startsWith("data:image/") &&
    v.length <= MAX_IMAGE_LENGTH
  );
}

function validate(input: BeerInput) {
  if (!input.name.trim()) throw new Error("Name is required.");
  if (!input.style.trim()) throw new Error("Style is required.");
  if (!Number.isFinite(input.abv) || input.abv < 0 || input.abv > 100) {
    throw new Error("ABV must be between 0 and 100.");
  }
  if (
    input.ibu !== null &&
    (!Number.isInteger(input.ibu) || input.ibu < 0)
  ) {
    throw new Error("IBU must be a non-negative whole number.");
  }
  if (!(BEER_STATUSES as readonly string[]).includes(input.status)) {
    throw new Error("Status must be on tap, fermenting, or coming soon.");
  }
  if (
    input.srm !== null &&
    (!Number.isFinite(input.srm) || input.srm < 1 || input.srm > 40)
  ) {
    throw new Error("SRM must be between 1 and 40.");
  }
  if (!(GLASS_TYPES as readonly string[]).includes(input.glass)) {
    throw new Error("Unknown glass type.");
  }
  if (input.labelImage !== null && !isImageValue(input.labelImage)) {
    throw new Error("Label image must be an image under ~2MB.");
  }
  if (input.status === "on_tap") {
    if (!Number.isInteger(input.tapNumber) || input.tapNumber < 1) {
      throw new Error("Tap number must be a positive whole number.");
    }
  }
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/api/beers");
}

/** Throw if another on-tap beer already pours this tap number. */
async function assertTapFree(tapNumber: number, excludeId: number | null) {
  const db = getDb();
  const clashes = await db
    .select({ id: beers.id, name: beers.name })
    .from(beers)
    .where(and(eq(beers.status, "on_tap"), eq(beers.tapNumber, tapNumber)));
  const other = clashes.find((b) => b.id !== excludeId);
  if (other) {
    throw new Error(`Tap ${tapNumber} is already poured by "${other.name}".`);
  }
}

export async function createBeer(input: BeerInput) {
  validate(input);
  if (input.status === "on_tap") {
    await assertTapFree(input.tapNumber, null);
  }
  const db = getDb();
  await db.insert(beers).values({
    name: input.name.trim(),
    style: input.style.trim(),
    abv: input.abv,
    ibu: input.ibu,
    description: input.description?.trim() || null,
    tapNumber: input.status === "on_tap" ? input.tapNumber : 0,
    isActive: true,
    status: input.status,
    srm: input.srm,
    glass: input.glass,
    labelImage: input.labelImage,
  });
  refresh();
}

export async function updateBeer(id: number, input: BeerInput) {
  validate(input);
  if (input.status === "on_tap") {
    await assertTapFree(input.tapNumber, id);
  }
  const db = getDb();
  await db
    .update(beers)
    .set({
      name: input.name.trim(),
      style: input.style.trim(),
      abv: input.abv,
      ibu: input.ibu,
      description: input.description?.trim() || null,
      tapNumber: input.status === "on_tap" ? input.tapNumber : 0,
      status: input.status,
      srm: input.srm,
      glass: input.glass,
      labelImage: input.labelImage,
      updatedAt: new Date(),
    })
    .where(eq(beers.id, id));
  refresh();
}

export async function toggleBeerActive(id: number, isActive: boolean) {
  const db = getDb();
  await db
    .update(beers)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(beers.id, id));
  refresh();
}

export async function deleteBeer(id: number) {
  const db = getDb();
  await db.delete(beers).where(eq(beers.id, id));
  refresh();
}

/**
 * Move an on-tap beer up or down one position by swapping tap numbers
 * with its neighbor in tap order.
 */
export async function moveBeerTap(id: number, direction: "up" | "down") {
  const db = getDb();
  const onTap = await db
    .select()
    .from(beers)
    .where(eq(beers.status, "on_tap"))
    .orderBy(asc(beers.tapNumber), asc(beers.id));
  const idx = onTap.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Beer not found.");
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= onTap.length) return;
  const a = onTap[idx];
  const b = onTap[swapIdx];
  await db
    .update(beers)
    .set({ tapNumber: b.tapNumber, updatedAt: new Date() })
    .where(eq(beers.id, a.id));
  await db
    .update(beers)
    .set({ tapNumber: a.tapNumber, updatedAt: new Date() })
    .where(eq(beers.id, b.id));
  refresh();
}
