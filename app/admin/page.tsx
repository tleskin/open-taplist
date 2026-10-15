import type { Metadata } from "next";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { beers } from "@/db/schema";
import { getSetting } from "@/lib/settings";
import {
  isCustomThemeRef,
  isThemeId,
  isValidCustomTheme,
  type CustomThemeParams,
} from "@/lib/themes";
import BeerManager from "./BeerManager";
import BrewerySettings from "./BrewerySettings";
import ThemeSettings from "./ThemeSettings";
import AdminTabs from "./AdminTabs";

export const metadata: Metadata = {
  title: "Admin · OpenTapList",
};

// This page reads the live database on every request; opting out of
// instant-navigation validation (blocking render is fine for an admin UI).
export const instant = false;

export default async function AdminPage() {
  await connection(); // skip prerendering: this page reads the live database
  const db = getDb();
  const allBeers = await db
    .select()
    .from(beers)
    .orderBy(asc(beers.tapNumber));

  const storedTheme = await getSetting("theme");
  const themeRef =
    typeof storedTheme === "string" &&
    (isThemeId(storedTheme) || isCustomThemeRef(storedTheme))
      ? storedTheme
      : "midnight";

  const storedThemes = await getSetting("custom_themes");
  let customThemes: CustomThemeParams[] = [];
  try {
    const parsed = JSON.parse(storedThemes ?? "[]");
    if (Array.isArray(parsed)) {
      customThemes = parsed.filter(isValidCustomTheme);
    }
  } catch {
    customThemes = [];
  }

  const storedName = await getSetting("brewery_name");
  const breweryName =
    storedName ??
    process.env.NEXT_PUBLIC_BREWERY_NAME ??
    "My Home Brewery";
  const breweryLogo = await getSetting("brewery_logo");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-6 sm:px-10">
        <img
          src="/logo-lockup-dark.png"
          alt="OpenTaplist"
          className="h-12 w-auto"
        />
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Manage taps
        </h1>
        <a
          href="/"
          className="mt-2 inline-block text-sm text-zinc-400 underline hover:text-amber-400"
        >
          ← Back to tap list
        </a>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 sm:px-10">
        <AdminTabs
          beers={<BeerManager initialBeers={allBeers} />}
          settings={
            <>
              <BrewerySettings
                initialName={breweryName}
                initialLogo={breweryLogo}
              />
              <ThemeSettings
                initialThemes={customThemes}
                initialThemeRef={themeRef}
                breweryName={breweryName}
              />
            </>
          }
        />
      </main>
    </div>
  );
}
