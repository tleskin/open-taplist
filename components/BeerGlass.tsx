import { useId } from "react";
import type { GlassType } from "@/db/schema";
import { srmToHex } from "@/lib/srm";

export const GLASS_LABELS: Record<GlassType, string> = {
  pint: "Pint",
  tulip: "Tulip",
  snifter: "Snifter",
  pilsner: "Pilsner",
  mug: "Mug",
  weizen: "Weizen",
};

type GlassDef = {
  /** Silhouette path used for the glass body (also the clip shape). */
  body: string;
  /** Horizontal radius of the foam cap. */
  foamRx: number;
  /** Optional extra SVG (e.g. mug handle) drawn outside the beer clip. */
  extra?: React.ReactNode;
};

const GLASSES: Record<GlassType, GlassDef> = {
  pint: {
    // American shaker: gently tapered, wider at the mouth.
    body: "M20 8 C22 32 24 60 26 88 L38 88 C40 60 42 32 44 8 Z",
    foamRx: 11,
  },
  tulip: {
    // Bulbous body, pinched waist, flared lip, stem and foot.
    body: "M22 8 C17 18 15 30 17 42 C19 56 25 66 28 74 L28 80 L23 88 L41 88 L37 80 L37 74 C40 66 46 56 48 42 C50 30 48 18 43 8 C36 12 29 12 22 8 Z",
    foamRx: 10,
  },
  snifter: {
    // Short stem, wide bowl, narrow mouth to trap aroma.
    body: "M23 20 C14 28 12 44 16 57 C19 66 24 71 28 73 L28 80 L22 88 L42 88 L36 80 L36 73 C40 71 45 66 48 57 C52 44 50 28 41 20 C35 17 29 17 23 20 Z",
    foamRx: 8,
  },
  pilsner: {
    // Tall flute: narrow foot flaring to a wide mouth.
    body: "M19 6 C25 24 28 44 28 62 L28 78 L24 88 L40 88 L36 78 L36 62 C36 44 39 24 45 6 C36 10 28 10 19 6 Z",
    foamRx: 12,
  },
  mug: {
    // Chunky dimpled mug with a big ear handle.
    body: "M17 14 L37 14 C39 14 39 16 39 18 L39 82 C39 84 39 86 37 86 L17 86 C15 86 15 84 15 82 L15 18 C15 16 15 14 17 14 Z",
    foamRx: 10,
    extra: (
      <path
        d="M39 32 C57 32 57 66 39 66"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="7"
        strokeLinecap="round"
      />
    ),
  },
  weizen: {
    // Tall wheat glass: narrow base, gentle S-curve to a wide mouth.
    body: "M17 6 C23 22 26 40 27 58 L27 80 L24 88 L40 88 L37 80 L37 58 C38 40 41 22 47 6 C37 10 27 10 17 6 Z",
    foamRx: 14,
  },
};

const FOAM_Y = 15;
const FOAM_COLOR = "#FBF3DC";

type BeerGlassProps = {
  glass: GlassType;
  srm: number | null;
  className?: string;
};

/**
 * A beer glass silhouette filled with the beer color derived from SRM,
 * topped with a foam head. Looks best around 64–96px.
 */
export default function BeerGlass({ glass, srm, className }: BeerGlassProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const def = GLASSES[glass] ?? GLASSES.pint;
  const color = srmToHex(srm);
  const clipId = `beerclip-${uid}`;
  const shadeId = `beershade-${uid}`;

  return (
    <svg
      viewBox="0 0 64 96"
      className={className}
      role="img"
      aria-label={`${GLASS_LABELS[glass] ?? glass} glass`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={def.body} />
        </clipPath>
        <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* glass tint */}
      <path d={def.body} fill="rgba(255,255,255,0.05)" />

      {/* beer + foam, clipped to the glass silhouette */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y={FOAM_Y} width="64" height={96 - FOAM_Y} fill={color} />
        <rect
          x="0"
          y={FOAM_Y}
          width="64"
          height={96 - FOAM_Y}
          fill={`url(#${shadeId})`}
        />
        {/* foam head */}
        <ellipse
          cx="32"
          cy={FOAM_Y + 1}
          rx={def.foamRx}
          ry="7"
          fill={FOAM_COLOR}
        />
        <circle cx={32 - def.foamRx * 0.55} cy={FOAM_Y - 2} r="4.5" fill={FOAM_COLOR} />
        <circle cx={32 + def.foamRx * 0.5} cy={FOAM_Y - 3} r="5.5" fill={FOAM_COLOR} />
        <circle cx="32" cy={FOAM_Y - 6} r="4" fill={FOAM_COLOR} />
        {/* glass shine */}
        <rect
          x="21"
          y="12"
          width="5"
          height="68"
          rx="2.5"
          fill="#ffffff"
          opacity="0.22"
        />
      </g>

      {def.extra}

      {/* glass outline — currentColor so it adapts to light/dark themes */}
      <path
        d={def.body}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
