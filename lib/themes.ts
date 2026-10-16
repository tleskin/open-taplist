export type ThemeId =
  | "midnight"
  | "liquid-glass"
  | "liquid-glass-light"
  | "daylight"
  | "chalkboard";

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
    name: "Liquid Glass Dark",
    description:
      "Frosted-glass cards floating over deep color — Apple's glass aesthetic, tuned for the TV at night.",
  },
  "liquid-glass-light": {
    id: "liquid-glass-light",
    name: "Liquid Glass Light",
    description:
      "The same frosted-glass look on a bright, airy background — for daytime viewing.",
  },
  daylight: {
    id: "daylight",
    name: "Daylight",
    description:
      "A bright taproom board — dark text on warm paper, easy on the eyes during the day.",
  },
  chalkboard: {
    id: "chalkboard",
    name: "Chalkboard",
    description:
      "Lime-chalk lettering on dark wood — the classic taproom board look.",
  },
};

export function isThemeId(value: unknown): value is ThemeId {
  return (
    value === "midnight" ||
    value === "liquid-glass" ||
    value === "liquid-glass-light" ||
    value === "daylight" ||
    value === "chalkboard"
  );
}

/* ---------- Custom themes (built in the admin theme maker) ---------- */

export const CARD_STYLES = ["solid", "glass", "outline"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

export type CustomThemeParams = {
  id: string;
  name: string;
  background: string;
  text: string;
  accent: string;
  card: string;
  cardStyle: CardStyle;
};

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isCardStyle(value: unknown): value is CardStyle {
  return (
    typeof value === "string" &&
    (CARD_STYLES as readonly string[]).includes(value)
  );
}

export function isValidCustomTheme(value: unknown): value is CustomThemeParams {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id.length >= 1 &&
    v.id.length <= 40 &&
    typeof v.name === "string" &&
    v.name.trim().length >= 1 &&
    v.name.trim().length <= 40 &&
    typeof v.background === "string" &&
    HEX_COLOR.test(v.background) &&
    typeof v.text === "string" &&
    HEX_COLOR.test(v.text) &&
    typeof v.accent === "string" &&
    HEX_COLOR.test(v.accent) &&
    typeof v.card === "string" &&
    HEX_COLOR.test(v.card) &&
    isCardStyle(v.cardStyle)
  );
}

/** Theme reference: "midnight" | "liquid-glass" | "custom:<id>". */
export function isCustomThemeRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("custom:");
}

export function customThemeRef(id: string): string {
  return `custom:${id}`;
}

/**
 * Static class bundle for custom themes. Colors come from CSS variables
 * (--ctp-*) set on the page root; see the .ctp-* rules in globals.css.
 * Everything here is a static string so Tailwind's scanner is happy.
 */
function customThemeStyles(cardStyle: CardStyle): ThemeStyles {
  const cardBase =
    cardStyle === "glass"
      ? "ctp-card ctp-card-glass"
      : cardStyle === "outline"
        ? "ctp-card ctp-card-outline"
        : "ctp-card";
  return {
    page: "ctp-page min-h-screen",
    header: "ctp-header relative px-6 py-6 sm:px-10",
    kicker: "ctp-kicker text-sm font-semibold uppercase tracking-[0.3em]",
    title: "ctp-title mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl",
    sectionTitle: "ctp-section-title text-2xl font-bold tracking-tight",
    sectionIconWrap: "ctp-section-icon",
    card: `${cardBase} flex gap-5 rounded-2xl p-6 shadow-lg`,
    cardShine: null,
    tapBadge: "ctp-tap-badge",
    nameText: "ctp-name-text",
    compact: false,
    styleText: "ctp-style-text mt-1 text-sm font-medium uppercase tracking-widest",
    statText: "ctp-stat-text mt-2 text-sm",
    statValue: "ctp-stat-value",
    bodyText: "ctp-body-text mt-2 leading-relaxed",
    mutedCard: "ctp-card ctp-card-outline flex gap-5 rounded-2xl p-6 opacity-80",
    footer: "ctp-footer relative px-6 pb-6 text-center text-xs sm:px-10",
    errorBox: "ctp-error rounded-xl px-5 py-4",
    emptyBox: "ctp-empty rounded-2xl px-6 py-20 text-center",
    emptyTitle: "ctp-empty-title text-3xl font-bold",
  };
}

export type ResolvedTheme = {
  styles: ThemeStyles;
  /** CSS variable values to set on the page root, or null for built-ins. */
  vars: Record<string, string> | null;
  label: string;
};

export function resolveTheme(
  themeRef: string,
  customThemes: CustomThemeParams[]
): ResolvedTheme {
  if (isCustomThemeRef(themeRef)) {
    const id = themeRef.slice("custom:".length);
    const custom = customThemes.find((c) => c.id === id);
    if (custom && isValidCustomTheme(custom)) {
      return {
        styles: customThemeStyles(custom.cardStyle),
        vars: {
          "--ctp-bg": custom.background,
          "--ctp-text": custom.text,
          "--ctp-accent": custom.accent,
          "--ctp-card": custom.card,
        },
        label: custom.name,
      };
    }
  }
  if (isThemeId(themeRef)) {
    return { styles: themeStyles[themeRef], vars: null, label: THEMES[themeRef].name };
  }
  return { styles: themeStyles.midnight, vars: null, label: THEMES.midnight.name };
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
  /** Pour name heading on tap cards (color, and font for themes that set one). */
  nameText: string;
  /** Dense list rows instead of large cards — fits more pours per screen. */
  compact: boolean;
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
    nameText: "text-zinc-100",
    compact: false,
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
    nameText: "text-white",
    compact: false,
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
  "liquid-glass-light": {
    page: "relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-100 via-[#f7f5ef] to-amber-100 text-zinc-900",
    header:
      "relative border-b border-white/70 bg-white/40 px-6 py-8 backdrop-blur-xl sm:px-10",
    kicker: "text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500",
    title:
      "mt-2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl",
    sectionTitle: "text-2xl font-semibold tracking-tight text-zinc-900",
    sectionIconWrap:
      "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/50 text-amber-600 shadow-lg backdrop-blur-md",
    card: "relative flex gap-5 overflow-hidden rounded-3xl border border-white/70 bg-white/55 p-6 shadow-[0_8px_40px_rgba(60,50,20,0.10)] backdrop-blur-xl",
    cardShine:
      "pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent",
    tapBadge:
      "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/60 text-3xl font-black text-amber-600 shadow-inner backdrop-blur-md",
    nameText: "text-zinc-900",
    compact: false,
    styleText:
      "mt-1 text-sm font-medium uppercase tracking-[0.2em] text-amber-700/80",
    statText: "mt-2 text-sm text-zinc-500",
    statValue: "font-semibold text-zinc-900",
    bodyText: "mt-2 leading-relaxed text-zinc-600",
    mutedCard:
      "relative flex gap-5 overflow-hidden rounded-3xl border border-dashed border-zinc-400/60 bg-white/35 p-6 opacity-80 backdrop-blur-md",
    footer: "relative px-6 pb-6 text-center text-xs text-zinc-500 sm:px-10",
    errorBox:
      "rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-800 backdrop-blur-md",
    emptyBox:
      "rounded-3xl border border-dashed border-zinc-400/60 bg-white/35 px-6 py-20 text-center backdrop-blur-md",
    emptyTitle: "text-3xl font-semibold text-zinc-700",
  },
  daylight: {
    page: "min-h-screen bg-[#faf6ee] text-zinc-900",
    header: "border-b border-amber-700/25 bg-white/70 px-6 py-6 sm:px-10",
    kicker:
      "text-sm font-semibold uppercase tracking-[0.3em] text-amber-700",
    title: "mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl",
    sectionTitle: "text-2xl font-bold tracking-tight",
    sectionIconWrap:
      "flex h-11 w-11 items-center justify-center rounded-xl bg-amber-700/10 text-amber-700",
    card: "flex gap-5 rounded-2xl border border-amber-950/10 bg-white p-6 shadow-lg",
    cardShine: null,
    tapBadge:
      "flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-700/10 text-3xl font-black text-amber-700",
    nameText: "text-zinc-900",
    compact: false,
    styleText:
      "mt-1 text-sm font-medium uppercase tracking-widest text-amber-700/90",
    statText: "mt-2 text-sm text-zinc-600",
    statValue: "font-semibold text-zinc-900",
    bodyText: "mt-2 leading-relaxed text-zinc-600",
    mutedCard:
      "flex gap-5 rounded-2xl border border-dashed border-zinc-400 bg-white/60 p-6 opacity-80",
    footer: "px-6 pb-6 text-center text-xs text-zinc-500 sm:px-10",
    errorBox:
      "rounded-xl border border-red-500/40 bg-red-50 px-5 py-4 text-red-800",
    emptyBox:
      "rounded-2xl border border-dashed border-zinc-400 px-6 py-20 text-center",
    emptyTitle: "text-3xl font-bold text-zinc-700",
  },
  chalkboard: {
    page: "chalkboard-page min-h-screen text-[#f2ede3]",
    header: "relative px-6 py-8 text-center sm:px-10",
    kicker:
      "text-sm font-semibold uppercase tracking-[0.35em] text-[#cde64e]/70",
    title:
      "font-chalk mt-2 text-5xl font-bold uppercase tracking-wide text-[#cde64e] sm:text-6xl",
    sectionTitle:
      "font-chalk text-3xl font-semibold uppercase tracking-wide text-[#cde64e]",
    sectionIconWrap:
      "flex h-11 w-11 items-center justify-center rounded-full border border-[#cde64e]/40 text-[#cde64e]",
    card: "flex gap-5 border-b border-white/10 p-6",
    cardShine: null,
    tapBadge:
      "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#cde64e]/60 text-3xl font-black text-[#cde64e]",
    nameText: "font-chalk text-[#cde64e]",
    compact: true,
    styleText:
      "mt-1 text-sm font-medium uppercase tracking-widest text-white/90",
    statText: "mt-2 text-sm text-stone-300",
    statValue: "font-semibold text-white",
    bodyText: "mt-2 leading-relaxed text-stone-300/90",
    mutedCard:
      "flex gap-5 border-b border-dashed border-white/10 p-6 opacity-70",
    footer: "relative px-6 pb-6 text-center text-xs text-stone-500 sm:px-10",
    errorBox:
      "rounded-xl border border-red-400/40 bg-red-950/50 px-5 py-4 text-red-200",
    emptyBox:
      "rounded-2xl border border-dashed border-white/20 px-6 py-20 text-center",
    emptyTitle:
      "font-chalk text-3xl font-semibold uppercase tracking-wide text-[#cde64e]",
  },
};
