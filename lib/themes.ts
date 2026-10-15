export type ThemeId = "midnight" | "liquid-glass";

export const THEMES: Record<
  ThemeId,
  { id: ThemeId; name: string; description: string }
> = {
  midnight: {
    id: "midnight",
    name: "Midnight",
    description:
      "The classic dark taproom board — high contrast, easy to read across the garage.",
  },
  "liquid-glass": {
    id: "liquid-glass",
    name: "Liquid Glass",
    description:
      "Frosted-glass cards floating over soft color — Apple's glass aesthetic, tuned for the TV.",
  },
};

export function isThemeId(value: unknown): value is ThemeId {
  return value === "midnight" || value === "liquid-glass";
}

/**
 * Class-name bundles per theme for the tap list display. Each theme keeps
 * its own visual language; the page picks a bundle by the active theme id.
 */
export type ThemeStyles = {
  page: string;
  header: string;
  kicker: string;
  title: string;
  sectionTitle: string;
  sectionIconWrap: string;
  card: string;
  cardShine: string | null;
  tapBadge: string;
  styleText: string;
  statText: string;
  statValue: string;
  bodyText: string;
  mutedCard: string;
  footer: string;
  errorBox: string;
  emptyBox: string;
  emptyTitle: string;
};

export const themeStyles: Record<ThemeId, ThemeStyles> = {
  midnight: {
    page: "min-h-screen bg-zinc-950 text-zinc-100",
    header: "border-b border-amber-500/30 bg-zinc-900/60 px-6 py-6 sm:px-10",
    kicker:
      "text-sm font-semibold uppercase tracking-[0.3em] text-amber-400",
    title: "mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl",
    sectionTitle: "text-2xl font-bold tracking-tight",
    sectionIconWrap:
      "flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400",
    card: "flex gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg",
    cardShine: null,
    tapBadge:
      "flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-3xl font-black text-amber-400",
    styleText:
      "mt-1 text-sm font-medium uppercase tracking-widest text-amber-400/90",
    statText: "mt-2 text-sm text-zinc-400",
    statValue: "font-semibold text-zinc-200",
    bodyText: "mt-2 leading-relaxed text-zinc-400",
    mutedCard:
      "flex gap-5 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 opacity-80",
    footer: "px-6 pb-6 text-center text-xs text-zinc-600 sm:px-10",
    errorBox:
      "rounded-xl border border-red-500/40 bg-red-950/40 px-5 py-4 text-red-200",
    emptyBox:
      "rounded-2xl border border-dashed border-zinc-700 px-6 py-20 text-center",
    emptyTitle: "text-3xl font-bold text-zinc-300",
  },
  "liquid-glass": {
    page: "relative min-h-screen overflow-hidden bg-[#07070d] text-white",
    header:
      "relative border-b border-white/10 bg-white/5 px-6 py-8 backdrop-blur-xl sm:px-10",
    kicker:
      "text-sm font-semibold uppercase tracking-[0.35em] text-white/60",
    title:
      "mt-2 bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl",
    sectionTitle: "text-2xl font-semibold tracking-tight text-white/95",
    sectionIconWrap:
      "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-white/90 shadow-lg backdrop-blur-md",
    card: "relative flex gap-5 overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl",
    cardShine:
      "pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.14] to-transparent",
    tapBadge:
      "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-3xl font-black text-white shadow-inner backdrop-blur-md",
    styleText:
      "mt-1 text-sm font-medium uppercase tracking-[0.2em] text-white/60",
    statText: "mt-2 text-sm text-white/60",
    statValue: "font-semibold text-white/95",
    bodyText: "mt-2 leading-relaxed text-white/65",
    mutedCard:
      "relative flex gap-5 overflow-hidden rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-6 opacity-75 backdrop-blur-md",
    footer: "relative px-6 pb-6 text-center text-xs text-white/35 sm:px-10",
    errorBox:
      "rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-red-100 backdrop-blur-md",
    emptyBox:
      "rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-6 py-20 text-center backdrop-blur-md",
    emptyTitle: "text-3xl font-semibold text-white/85",
  },
};
