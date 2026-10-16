"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Beer, BeerStatus } from "@/db/schema";
import BeerGlass from "@/components/BeerGlass";
import CarboyIcon from "@/components/CarboyIcon";
import { srmToHex } from "@/lib/srm";
import {
  resolveTheme,
  type CustomThemeParams,
  type ThemeStyles,
} from "@/lib/themes";

type ApiBeer = Omit<Beer, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_BREWERY_NAME =
  process.env.NEXT_PUBLIC_BREWERY_NAME ?? "My Home Brewery";
const POLL_INTERVAL_MS = 30_000;

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SectionHeader({
  icon,
  title,
  t,
}: {
  icon: React.ReactNode;
  title: string;
  t: ThemeStyles;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className={t.sectionIconWrap}>{icon}</div>
      <h2 className={t.sectionTitle}>{title}</h2>
    </div>
  );
}

/**
 * The beer's visual on a card: its label image when one is saved,
 * otherwise the SRM-colored glass. Ghosted for beers not poured yet.
 */
function BeerVisual({ beer, ghost }: { beer: ApiBeer; ghost?: boolean }) {
  const ghostCls = ghost ? "opacity-40" : "";
  if (beer.labelImage) {
    return (
      <img
        src={beer.labelImage}
        alt={`${beer.name} label`}
        className={`h-44 w-44 shrink-0 rounded-2xl object-contain md:h-64 md:w-64 ${ghostCls}`}
      />
    );
  }
  return (
    <BeerGlass
      glass={beer.glass}
      srm={beer.srm}
      className={`h-24 w-auto shrink-0 ${ghostCls}`}
    />
  );
}

function BeerStats({ beer, t }: { beer: ApiBeer; t: ThemeStyles }) {  return (
    <p className={t.statText}>
      <span className={t.statValue}>{beer.abv.toFixed(1)}% ABV</span>
      {beer.ibu !== null && (
        <span className="ml-3">
          <span className={t.statValue}>{beer.ibu}</span> IBU
        </span>
      )}
    </p>
  );
}

export default function TapListPage() {
  const [beers, setBeers] = useState<ApiBeer[] | null>(null);
  const [themeRef, setThemeRef] = useState("midnight");
  const [customThemes, setCustomThemes] = useState<CustomThemeParams[]>([]);
  const [breweryName, setBreweryName] = useState(DEFAULT_BREWERY_NAME);
  const [breweryLogo, setBreweryLogo] = useState<string | null>(null);
  const [error, setError] = useState(false);
  // Computed after mount: reading the clock during prerender is blocked.
  const [year, setYear] = useState(2026);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const load = useCallback(async () => {
    try {
      const [beersRes, settingsRes] = await Promise.all([
        fetch("/api/beers", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
      ]);
      if (!beersRes.ok || !settingsRes.ok) throw new Error("bad response");
      setBeers(await beersRes.json());
      const settings = await settingsRes.json();
      if (typeof settings.theme === "string") setThemeRef(settings.theme);
      if (Array.isArray(settings.customThemes)) {
        setCustomThemes(settings.customThemes);
      }
      if (typeof settings.breweryName === "string" && settings.breweryName) {
        setBreweryName(settings.breweryName);
      }
      setBreweryLogo(
        typeof settings.breweryLogo === "string" ? settings.breweryLogo : null
      );
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const { styles: t, vars: themeVars } = resolveTheme(themeRef, customThemes);

  const byStatus = (status: BeerStatus) =>
    (beers ?? []).filter((b) => b.status === status);
  const onTap = byStatus("on_tap");
  const fermenting = byStatus("fermenting");
  const comingSoon = byStatus("coming_soon");
  const hasAny = onTap.length + fermenting.length + comingSoon.length > 0;

  return (
    <div className={t.page} style={themeVars as CSSProperties | undefined}>
      {themeRef === "liquid-glass" && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-500/25 blur-[120px]" />
          <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[130px]" />
          <div className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-rose-500/15 blur-[120px]" />
        </div>
      )}
      {themeRef === "liquid-glass-light" && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-300/50 blur-[120px]" />
          <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/50 blur-[130px]" />
          <div className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-rose-300/40 blur-[120px]" />
        </div>
      )}

      <header className={`relative ${t.header}`}>
        <div className="mx-auto max-w-3xl text-center">
          {breweryLogo && (
            <img
              src={breweryLogo}
              alt={`${breweryName} logo`}
              className="mx-auto mb-4 h-28 w-auto max-w-full object-contain sm:h-32"
            />
          )}
          <p className={t.kicker}>Now pouring</p>
          {!breweryLogo && <h1 className={t.title}>{breweryName}</h1>}
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl space-y-12 px-6 py-8 sm:px-10">
        {error && (
          <div className={t.errorBox}>
            Couldn&apos;t reach the tap list. Check the server connection.
          </div>
        )}

        {beers === null && !error && (
          <p className="py-16 text-center text-xl opacity-50">
            Tapping the kegs…
          </p>
        )}

        {beers !== null && !hasAny && !error && (
          <div className={t.emptyBox}>
            <p className={t.emptyTitle}>Taps are dry</p>
            <p className="mt-3 text-lg opacity-60">
              Nothing on tap right now — check back after the next brew day.
            </p>
          </div>
        )}

        {onTap.length > 0 && (
          <section>
            <SectionHeader
              t={t}
              title="On Tap"
              icon={<BeerGlass glass="pint" srm={6} className="h-7 w-auto" />}
            />
            <ul className="grid gap-5 md:grid-cols-2">
              {onTap.map((beer) => (
                <li key={beer.id} className={t.card}>
                  {t.cardShine && (
                    <div aria-hidden className={t.cardShine} />
                  )}
                  {beer.labelImage ? (
                    <div className="relative shrink-0 self-start">
                      <BeerVisual beer={beer} />
                      <div
                        className={`${t.tapBadge} absolute -left-3 -top-3 scale-75`}
                      >
                        {beer.tapNumber}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={t.tapBadge}>{beer.tapNumber}</div>
                      <BeerVisual beer={beer} />
                    </>
                  )}
                  <div className="relative min-w-0">
                    <h3 className="text-2xl font-bold leading-tight">
                      {beer.name}
                    </h3>
                    <p className={t.styleText}>{beer.style}</p>
                    <BeerStats beer={beer} t={t} />
                    {beer.description && (
                      <p className={t.bodyText}>{beer.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {fermenting.length > 0 && (
          <section>
            <SectionHeader
              t={t}
              title="Fermenting"
              icon={<CarboyIcon className="h-7 w-auto" />}
            />
            <ul className="grid gap-5 md:grid-cols-2">
              {fermenting.map((beer) => (
                <li key={beer.id} className={t.card}>
                  {t.cardShine && (
                    <div aria-hidden className={t.cardShine} />
                  )}
                  <CarboyIcon srm={beer.srm} className="h-24 w-auto shrink-0 opacity-90" />
                  <div className="relative min-w-0">
                    <h3 className="text-2xl font-bold leading-tight">
                      {beer.name}{" "}
                      <span
                        title={`~${beer.srm ?? "?"} SRM`}
                        className="inline-block h-4 w-4 rounded-full border border-white/30 align-middle"
                        style={{ backgroundColor: srmToHex(beer.srm) }}
                      />
                    </h3>
                    <p className={t.styleText}>{beer.style}</p>
                    <BeerStats beer={beer} t={t} />
                    {beer.description && (
                      <p className={t.bodyText}>{beer.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {comingSoon.length > 0 && (
          <section>
            <SectionHeader
              t={t}
              title="Coming Soon"
              icon={<ClockIcon className="h-6 w-6" />}
            />
            <ul className="grid gap-5 md:grid-cols-2">
              {comingSoon.map((beer) => (
                <li key={beer.id} className={t.mutedCard}>
                  {t.cardShine && (
                    <div aria-hidden className={t.cardShine} />
                  )}
                  <BeerVisual beer={beer} ghost />
                  <div className="relative min-w-0">
                    <h3 className="text-2xl font-bold leading-tight">
                      {beer.name}
                    </h3>
                    <p className={t.styleText}>{beer.style}</p>
                    <BeerStats beer={beer} t={t} />
                    {beer.description && (
                      <p className={t.bodyText}>{beer.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className={`relative ${t.footer}`}>
        <p>© {year} OpenTaplist · Brewed with love 🍻</p>
        <p className="mt-1 opacity-70">Refreshes automatically</p>
      </footer>
    </div>
  );
}
