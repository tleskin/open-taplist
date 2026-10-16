"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import type { Beer, BeerStatus } from "@/db/schema";
import BeerGlass from "@/components/BeerGlass";
import CarboyIcon from "@/components/CarboyIcon";
import SplashScreen from "@/components/SplashScreen";
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
// ---------- TV dashboard ----------
// Every TV tile is a fixed-size card, so rotating pages never shifts the
// layout. Sections get screen space proportional to their pour counts: a
// big On Tap section gets its own tall band while small sections pair up
// into a shared row (e.g. 8 on tap -> top two-thirds, 1 fermenting +
// 1 coming soon share the bottom third, left-aligned).
const TV_TILE_W = 360;
const TV_TILE_H = 200;
const TV_GAP = 20; // gap-5
const TV_COMPACT_ROW_H = 68;

/** Section flex weight ~ how many tile rows it wants (1-3). */
function tvWeight(count: number) {
  return Math.min(3, Math.max(1, Math.ceil(count / 4)));
}

/** How many fixed tiles fit in the measured area (cols x rows). */
function useFitCount(
  ref: RefObject<HTMLDivElement | null>,
  tileW: number,
  tileH: number,
  fixedCols?: number
) {
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      const cols =
        fixedCols ??
        Math.max(1, Math.floor((r.width + TV_GAP) / (tileW + TV_GAP)));
      const rows = Math.max(
        1,
        Math.floor((r.height + TV_GAP) / (tileH + TV_GAP))
      );
      setFit(Math.max(1, cols * rows));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, tileW, tileH, fixedCols]);
  return fit;
}

function useTvPager(
  count: number,
  pageSize: number,
  rotate: boolean,
  rotateSeconds: number
) {
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const [pageIdx, setPageIdx] = useState(0);
  useEffect(() => {
    setPageIdx((i) => Math.min(i, pageCount - 1));
  }, [pageCount]);
  useEffect(() => {
    if (!rotate || pageCount <= 1) return;
    const id = setInterval(
      () => setPageIdx((i) => (i + 1) % pageCount),
      rotateSeconds * 1000
    );
    return () => clearInterval(id);
  }, [pageCount, rotate, rotateSeconds]);
  return { pageIdx, setPageIdx, pageCount };
}

/** Page dots for a TV section column. */
function TvDots({
  pageCount,
  pageIdx,
  setPageIdx,
  label,
}: {
  pageCount: number;
  pageIdx: number;
  setPageIdx: (i: number) => void;
  label: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-3 flex justify-center gap-2">
      {Array.from({ length: pageCount }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setPageIdx(i)}
          aria-label={`Show ${label} page ${i + 1}`}
          className={`h-2 w-2 rounded-full transition-colors ${
            i === pageIdx
              ? "bg-amber-400"
              : "bg-current opacity-25 hover:opacity-60"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Grid columns for a card row: never more columns than cards, so a short
 * row spreads across the full width instead of bunching up on the left.
 */
function gridCols(count: number, isMd: boolean, isTv: boolean, maxTv: number) {
  if (!isMd) return 1;
  return Math.max(1, Math.min(count, isTv ? maxTv : 2));
}

/** Fixed-size TV card tile: an identical box for every pour. */
function TvPourTile({
  beer,
  t,
  art,
  badge,
  afterName,
  cheers,
  showDescriptions,
  cardClass,
}: {
  beer: ApiBeer;
  t: ThemeStyles;
  art: ReactNode;
  badge?: ReactNode;
  afterName?: ReactNode;
  cheers?: ReactNode;
  showDescriptions: boolean;
  cardClass?: string;
}) {
  return (
    <li
      style={{ width: TV_TILE_W, height: TV_TILE_H }}
      className={`${cardClass ?? t.card} shrink-0 items-center overflow-hidden`}
    >
      {t.cardShine && <div aria-hidden className={t.cardShine} />}
      <div className="relative shrink-0">
        {art}
        {badge}
      </div>
      <div className="relative min-w-0 flex-1">
        <h3
          className={`line-clamp-2 text-xl font-bold leading-tight ${t.nameText}`}
        >
          {beer.name} {afterName}
        </h3>
        <p className={t.styleText}>{beer.style}</p>
        <BeerStats beer={beer} t={t} />
        {cheers}
        {showDescriptions && beer.description && (
          <p className={`${t.bodyText} mt-1 line-clamp-3`}>{beer.description}</p>
        )}
      </div>
    </li>
  );
}

/** Fixed-height dense row for compact themes on the TV. */
function TvCompactRow({
  beer,
  t,
  leading,
  meta,
  showDescriptions,
}: {
  beer: ApiBeer;
  t: ThemeStyles;
  leading: ReactNode;
  meta: ReactNode;
  showDescriptions: boolean;
}) {
  return (
    <li
      style={{ height: TV_COMPACT_ROW_H }}
      className="flex w-full shrink-0 items-center gap-4 overflow-hidden border-b border-white/10"
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-x-3">
          <h3 className={`truncate text-xl font-bold leading-tight ${t.nameText}`}>
            {beer.name}
          </h3>
          <p className="shrink-0 text-sm font-medium uppercase tracking-widest text-white/80">
            {beer.style}
          </p>
          <div className="flex min-w-0 items-center gap-3">{meta}</div>
        </div>
        {showDescriptions && beer.description && (
          <p className={`truncate text-sm opacity-70 ${t.bodyText}`}>
            {beer.description}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * One TV dashboard section: header, a measured tile area that pages
 * through pours (left-aligned fixed tiles), and rotation dots.
 */
function TvSection({
  title,
  icon,
  beers,
  t,
  renderTile,
  rotate,
  rotateSeconds,
  flexGrow,
}: {
  title: string;
  icon: ReactNode;
  beers: ApiBeer[];
  t: ThemeStyles;
  renderTile: (beer: ApiBeer) => ReactNode;
  rotate: boolean;
  rotateSeconds: number;
  flexGrow: number;
}) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const perPage = useFitCount(
    areaRef,
    TV_TILE_W,
    t.compact ? TV_COMPACT_ROW_H : TV_TILE_H,
    t.compact ? 1 : undefined
  );
  const { pageIdx, setPageIdx, pageCount } = useTvPager(
    beers.length,
    perPage,
    rotate,
    rotateSeconds
  );
  const safeIdx = pageCount > 0 ? pageIdx % pageCount : 0;
  const pageBeers = beers.slice(safeIdx * perPage, safeIdx * perPage + perPage);
  return (
    <section
      className="flex min-h-0 min-w-0 flex-col"
      style={{ flexGrow, flexShrink: 1, flexBasis: 0 }}
    >
      <SectionHeader t={t} title={title} icon={icon} />
      <div ref={areaRef} className="min-h-0 min-w-0 flex-1">
        <div
          key={safeIdx}
          className="animate-pagefade flex flex-wrap content-start items-stretch justify-start gap-5"
        >
          {pageBeers.map((beer) => (
            <Fragment key={beer.id}>{renderTile(beer)}</Fragment>
          ))}
        </div>
      </div>
      <TvDots
        pageCount={pageCount}
        pageIdx={safeIdx}
        setPageIdx={setPageIdx}
        label={title}
      />
    </section>
  );
}

/**
 * The TV dashboard: sections share the screen proportionally to their
 * pour counts. Sections wanting 2+ tile rows get their own full-width
 * band; small sections pair up into a shared row.
 */
export function TvBoard({
  onTap,
  fermenting,
  comingSoon,
  t,
  cheersEnabled,
  showDescriptions,
  rotate,
  rotateSeconds,
}: {
  onTap: ApiBeer[];
  fermenting: ApiBeer[];
  comingSoon: ApiBeer[];
  t: ThemeStyles;
  cheersEnabled: boolean;
  showDescriptions: boolean;
  rotate: boolean;
  rotateSeconds: number;
}) {
  const tapBadge = (n: number) => (
    <div className={`${t.tapBadge} absolute -left-2 -top-2 scale-[0.65]`}>
      {n}
    </div>
  );
  const cheers = (beer: ApiBeer) =>
    cheersEnabled ? (
      <span className="inline-flex items-center [&>button]:m-0">
        <CheersButton beerId={beer.id} count={beer.cheers ?? 0} />
      </span>
    ) : undefined;

  const renderOnTap = (beer: ApiBeer) =>
    t.compact ? (
      <TvCompactRow
        beer={beer}
        t={t}
        leading={
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#cde64e]/60 text-lg font-black text-[#cde64e]">
            {beer.tapNumber}
          </div>
        }
        meta={
          <>
            <BeerStats beer={beer} t={t} />
            {cheers(beer)}
          </>
        }
        showDescriptions={showDescriptions}
      />
    ) : (
      <TvPourTile
        beer={beer}
        t={t}
        art={<BeerVisual beer={beer} />}
        badge={tapBadge(beer.tapNumber)}
        cheers={cheers(beer)}
        showDescriptions={showDescriptions}
      />
    );

  const renderFerm = (beer: ApiBeer) =>
    t.compact ? (
      <TvCompactRow
        beer={beer}
        t={t}
        leading={
          <CarboyIcon srm={beer.srm} className="h-10 w-auto shrink-0 opacity-90" />
        }
        meta={
          <>
            <BeerStats beer={beer} t={t} />
            <span
              title={`~${beer.srm ?? "?"} SRM`}
              className="inline-block h-4 w-4 shrink-0 rounded-full border border-white/30"
              style={{ backgroundColor: srmToHex(beer.srm) }}
            />
          </>
        }
        showDescriptions={showDescriptions}
      />
    ) : (
      <TvPourTile
        beer={beer}
        t={t}
        art={
          <CarboyIcon srm={beer.srm} className="h-20 w-auto shrink-0 opacity-90" />
        }
        afterName={
          <span
            title={`~${beer.srm ?? "?"} SRM`}
            className="inline-block h-4 w-4 rounded-full border border-white/30 align-middle"
            style={{ backgroundColor: srmToHex(beer.srm) }}
          />
        }
        showDescriptions={showDescriptions}
      />
    );

  const renderSoon = (beer: ApiBeer) =>
    t.compact ? (
      <TvCompactRow
        beer={beer}
        t={t}
        leading={
          <BeerGlass
            glass={beer.glass}
            srm={beer.srm}
            className="h-10 w-auto shrink-0 opacity-40"
          />
        }
        meta={<BeerStats beer={beer} t={t} />}
        showDescriptions={showDescriptions}
      />
    ) : (
      <TvPourTile
        beer={beer}
        t={t}
        cardClass={t.mutedCard}
        art={<BeerVisual beer={beer} ghost />}
        showDescriptions={showDescriptions}
      />
    );

  const defs = [
    {
      key: "onTap",
      title: "On Tap",
      icon: <BeerGlass glass="pint" srm={6} className="h-7 w-auto" />,
      beers: onTap,
      renderTile: renderOnTap,
    },
    {
      key: "ferm",
      title: "Fermenting",
      icon: <CarboyIcon className="h-7 w-auto" />,
      beers: fermenting,
      renderTile: renderFerm,
    },
    {
      key: "soon",
      title: "Coming Soon",
      icon: <ClockIcon className="h-6 w-6" />,
      beers: comingSoon,
      renderTile: renderSoon,
    },
  ].filter((d) => d.beers.length > 0);

  const bands: { defs: typeof defs; flex: number }[] = [];
  let small: typeof defs = [];
  const flushSmall = () => {
    if (small.length > 0) {
      bands.push({ defs: small, flex: 1 });
      small = [];
    }
  };
  for (const d of defs) {
    if (tvWeight(d.beers.length) >= 2) {
      flushSmall();
      bands.push({ defs: [d], flex: tvWeight(d.beers.length) });
    } else {
      small.push(d);
      if (small.length === 2) flushSmall();
    }
  }
  flushSmall();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 2xl:gap-8">
      {bands.map((band) =>
        band.defs.length === 1 ? (
          <TvSection
            key={band.defs[0].key}
            title={band.defs[0].title}
            icon={band.defs[0].icon}
            beers={band.defs[0].beers}
            t={t}
            renderTile={band.defs[0].renderTile}
            rotate={rotate}
            rotateSeconds={rotateSeconds}
            flexGrow={band.flex}
          />
        ) : (
          <div
            key={band.defs.map((d) => d.key).join("-")}
            className="flex min-h-0 min-w-0 gap-6 2xl:gap-8"
            style={{ flexGrow: band.flex, flexShrink: 1, flexBasis: 0 }}
          >
            {band.defs.map((d) => (
              <TvSection
                key={d.key}
                title={d.title}
                icon={d.icon}
                beers={d.beers}
                t={t}
                renderTile={d.renderTile}
                rotate={rotate}
                rotateSeconds={rotateSeconds}
                flexGrow={1}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

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
        className={`h-44 w-44 shrink-0 rounded-2xl object-contain md:h-64 md:w-64 2xl:h-28 2xl:w-28 ${ghostCls}`}
      />
    );
  }
  return (
    <BeerGlass
      glass={beer.glass}
      srm={beer.srm}
      className={`h-24 w-auto shrink-0 2xl:h-20 ${ghostCls}`}
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

function CheersButton({
  beerId,
  count: initialCount,
}: {
  beerId: number;
  count: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [cheered, setCheered] = useState(false);
  const [pops, setPops] = useState<number[]>([]);

  // The TV poll refreshes counts live; a poll landing mid-cheer converges
  // once the POST below resolves with the authoritative count.
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    try {
      setCheered(window.localStorage.getItem(`cheers:${beerId}`) === "1");
    } catch {
      // storage unavailable — cheering still works, just isn't remembered
    }
  }, [beerId]);

  async function onCheers() {
    if (cheered) return;
    setCheered(true);
    try {
      window.localStorage.setItem(`cheers:${beerId}`, "1");
    } catch {}
    setCount((c) => c + 1);
    const popId = Date.now() + Math.random();
    setPops((prev) => [...prev, popId]);
    window.setTimeout(() => {
      setPops((prev) => prev.filter((id) => id !== popId));
    }, 1100);
    try {
      const res = await fetch(`/api/beers/${beerId}/cheers`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.cheers === "number") setCount(data.cheers);
      }
    } catch {
      // optimistic count stands
    }
  }

  return (
    <button
      type="button"
      onClick={onCheers}
      disabled={cheered}
      aria-label={cheered ? "Cheered!" : "Cheers this pour"}
      title={cheered ? "Cheered!" : "Cheers this pour"}
      className={`relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-current px-3 py-1 text-sm font-semibold transition disabled:cursor-default ${
        cheered ? "opacity-100" : "opacity-60 hover:opacity-100"
      }`}
    >
      <span className="relative inline-block" aria-hidden>
        &#x1F37B;
        {pops.map((id) => (
          <span
            key={id}
            className="animate-cheers-pop absolute -top-1 left-1/2 -translate-x-1/2"
          >
            &#x1F37B;
          </span>
        ))}
      </span>
      <span>{count}</span>
    </button>
  );
}

export function OnTapCard({
  beer,
  t,
  cheersEnabled,
  isTv,
  showDescriptions,
}: {
  beer: ApiBeer;
  t: ThemeStyles;
  cheersEnabled: boolean;
  isTv: boolean;
  showDescriptions: boolean;
}) {
  if (t.compact) {
    // Dense taplist.io-style row: tap number, name + stats on one line.
    return (
      <li className="flex items-center gap-4 border-b border-white/10 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#cde64e]/60 text-lg font-black text-[#cde64e]">
          {beer.tapNumber}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className={`text-xl font-bold leading-tight ${t.nameText}`}>
              {beer.name}
            </h3>
            <p className="text-sm font-medium uppercase tracking-widest text-white/80">
              {beer.style}
            </p>
            <p className="text-sm text-stone-300">
              <span className={t.statValue}>{beer.abv.toFixed(1)}% ABV</span>
              {beer.ibu !== null && (
                <span className="ml-3">
                  <span className={t.statValue}>{beer.ibu}</span> IBU
                </span>
              )}
            </p>
            {cheersEnabled && (
              <CheersButton beerId={beer.id} count={beer.cheers ?? 0} />
            )}
          </div>
          {showDescriptions && beer.description && (
            <p className={t.bodyText}>{beer.description}</p>
          )}
        </div>
      </li>
    );
  }
  return (
    <li className={`${t.card} ${isTv ? "items-center" : ""} 2xl:gap-4 2xl:p-5`}>
      {t.cardShine && <div aria-hidden className={t.cardShine} />}
      <div className="relative shrink-0 self-start">
        <BeerVisual beer={beer} />
        <div className={`${t.tapBadge} absolute -left-3 -top-3 scale-75`}>
          {beer.tapNumber}
        </div>
      </div>
      <div className="relative min-w-0">
        <h3 className={`text-2xl font-bold leading-tight 2xl:text-xl ${t.nameText}`}>
          {beer.name}
        </h3>
        <p className={t.styleText}>{beer.style}</p>
        <BeerStats beer={beer} t={t} />
        {cheersEnabled && (
          <CheersButton beerId={beer.id} count={beer.cheers ?? 0} />
        )}
        {showDescriptions && beer.description && (
          <p className={t.bodyText}>{beer.description}</p>
        )}
      </div>
    </li>
  );
}

function OnTapSection({
  beers,
  t,
  cheersEnabled,
  isMd,
  isTv,
  showDescriptions,
}: {
  beers: ApiBeer[];
  t: ThemeStyles;
  cheersEnabled: boolean;
  isMd: boolean;
  isTv: boolean;
  showDescriptions: boolean;
}) {
  const cols = t.compact ? 1 : gridCols(beers.length, isMd, isTv, 4);
  return (
    <section className={isTv ? "flex min-h-0 flex-1 flex-col" : undefined}>
      <SectionHeader
        t={t}
        title="On Tap"
        icon={<BeerGlass glass="pint" srm={6} className="h-7 w-auto" />}
      />
      <ul
        className={`grid gap-5 ${isTv ? "min-h-0 flex-1" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          ...(isTv ? { gridAutoRows: "1fr" } : {}),
        }}
      >
        {beers.map((beer) => (
          <OnTapCard
            key={beer.id}
            beer={beer}
            t={t}
            cheersEnabled={cheersEnabled}
            isTv={isTv}
            showDescriptions={showDescriptions}
          />
        ))}
      </ul>
    </section>
  );
}

function FermentingSection({
  beers,
  t,
  isMd,
  isTv,
  showDescriptions,
}: {
  beers: ApiBeer[];
  t: ThemeStyles;
  isMd: boolean;
  isTv: boolean;
  showDescriptions: boolean;
}) {
  const cols = t.compact ? 1 : gridCols(beers.length, isMd, isTv, 3);
  return (
    <section>
      <SectionHeader
        t={t}
        title="Fermenting"
        icon={<CarboyIcon className="h-7 w-auto" />}
      />
      <ul
        className="grid gap-5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {beers.map((beer) => (
          <li key={beer.id} className={t.card}>
            {t.cardShine && <div aria-hidden className={t.cardShine} />}
            <CarboyIcon
              srm={beer.srm}
              className={
                t.compact
                  ? "h-10 w-auto shrink-0 opacity-90"
                  : "h-24 w-auto shrink-0 opacity-90"
              }
            />
            <div className="relative min-w-0">
              <h3 className={`text-2xl font-bold leading-tight ${t.nameText}`}>
                {beer.name}{" "}
                <span
                  title={`~${beer.srm ?? "?"} SRM`}
                  className="inline-block h-4 w-4 rounded-full border border-white/30 align-middle"
                  style={{ backgroundColor: srmToHex(beer.srm) }}
                />
              </h3>
              <p className={t.styleText}>{beer.style}</p>
              <BeerStats beer={beer} t={t} />
              {showDescriptions && beer.description && (
                <p className={t.bodyText}>{beer.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ComingSoonSection({
  beers,
  t,
  isMd,
  isTv,
  showDescriptions,
}: {
  beers: ApiBeer[];
  t: ThemeStyles;
  isMd: boolean;
  isTv: boolean;
  showDescriptions: boolean;
}) {
  const cols = t.compact ? 1 : gridCols(beers.length, isMd, isTv, 3);
  return (
    <section>
      <SectionHeader
        t={t}
        title="Coming Soon"
        icon={<ClockIcon className="h-6 w-6" />}
      />
      <ul
        className="grid gap-5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {beers.map((beer) => (
          <li key={beer.id} className={t.mutedCard}>
            {t.cardShine && <div aria-hidden className={t.cardShine} />}
            <BeerVisual beer={beer} ghost />
            <div className="relative min-w-0">
              <h3 className={`text-2xl font-bold leading-tight ${t.nameText}`}>{beer.name}</h3>
              <p className={t.styleText}>{beer.style}</p>
              <BeerStats beer={beer} t={t} />
              {showDescriptions && beer.description && (
                <p className={t.bodyText}>{beer.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
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
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showOnTap, setShowOnTap] = useState(true);
  const [showFermenting, setShowFermenting] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(true);
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
      if (settings.display && typeof settings.display === "object") {
        if (typeof settings.display.rotate === "boolean") {
          setRotate(settings.display.rotate);
        }
        const rs = settings.display.rotateSeconds;
        if (Number.isInteger(rs)) {
          setRotateSeconds(Math.min(120, Math.max(5, rs as number)));
        }
      }
      if (typeof settings.showDescriptions === "boolean") {
        setShowDescriptions(settings.showDescriptions);
      }
      if (typeof settings.showOnTap === "boolean") {
        setShowOnTap(settings.showOnTap);
      }
      if (typeof settings.showFermenting === "boolean") {
        setShowFermenting(settings.showFermenting);
      }
      if (typeof settings.showComingSoon === "boolean") {
        setShowComingSoon(settings.showComingSoon);
      }
      if (typeof settings.cheersEnabled === "boolean") {
        setCheersEnabled(settings.cheersEnabled);
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
  const onTap = showOnTap ? byStatus("on_tap") : [];
  const fermenting = showFermenting ? byStatus("fermenting") : [];
  const comingSoon = showComingSoon ? byStatus("coming_soon") : [];
  const hasAny = onTap.length + fermenting.length + comingSoon.length > 0;

  const [rotate, setRotate] = useState(true);
  const [rotateSeconds, setRotateSeconds] = useState(12);
  const [cheersEnabled, setCheersEnabled] = useState(true);
  // Paging/rotation is a TV affair; smaller screens show the whole list.
  const [isTv, setIsTv] = useState(false);
  const [isMd, setIsMd] = useState(false);
  // Branded splash: always shows for ~2.2s on initial load, then fades.
  const [splashFaded, setSplashFaded] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFaded(true), 2200);
    const goneTimer = setTimeout(() => setSplashGone(true), 2750);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);
  useEffect(() => {
    const tv = window.matchMedia("(min-width: 1536px)");
    const md = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setIsTv(tv.matches);
      setIsMd(md.matches);
    };
    update();
    tv.addEventListener("change", update);
    md.addEventListener("change", update);
    return () => {
      tv.removeEventListener("change", update);
      md.removeEventListener("change", update);
    };
  }, []);

  return (
    <div
      className={`${t.page} flex min-h-screen flex-col`}
      style={themeVars as CSSProperties | undefined}
    >
      {!splashGone && (
        <div
          aria-hidden={splashFaded}
          className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
            splashFaded ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <SplashScreen />
        </div>
      )}
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

      <main
        className={`relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 2xl:max-w-[1720px] ${
          isTv ? "min-h-0" : "justify-center space-y-12"
        }`}
      >
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

        {beers !== null && !error && hasAny && (
          isTv ? (
            <TvBoard
              onTap={onTap}
              fermenting={fermenting}
              comingSoon={comingSoon}
              t={t}
              cheersEnabled={cheersEnabled}
              showDescriptions={showDescriptions}
              rotate={rotate}
              rotateSeconds={rotateSeconds}
            />
          ) : (
            <div className="space-y-12">
              {onTap.length > 0 && (
                <OnTapSection
                  beers={onTap}
                  t={t}
                  cheersEnabled={cheersEnabled}
                  isMd={isMd}
                  isTv={isTv}
                  showDescriptions={showDescriptions}
                />
              )}
              {fermenting.length > 0 && (
                <FermentingSection beers={fermenting} t={t} isMd={isMd} isTv={isTv} showDescriptions={showDescriptions} />
              )}
              {comingSoon.length > 0 && (
                <ComingSoonSection beers={comingSoon} t={t} isMd={isMd} isTv={isTv} showDescriptions={showDescriptions} />
              )}
            </div>
          )
        )}
      </main>

      <footer className={`relative ${t.footer}`}>
        <p>
          © {year} OpenTaplist · Brewed with love 🍻
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
            <>
              <span className="ml-2 rounded-full border border-amber-400/50 px-2 py-0.5 text-xs font-semibold text-amber-300">
                Demo
              </span>
              <a
                href="/admin"
                className="ml-2 text-xs font-semibold text-amber-300 underline decoration-amber-400/60 underline-offset-4 hover:text-amber-200"
              >
                Try the admin →
              </a>
            </>
          )}
        </p>
        <p className="mt-1 opacity-70">Refreshes automatically</p>
      </footer>
    </div>
  );
}
