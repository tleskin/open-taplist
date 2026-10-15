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
    body: "M18 6 L46 6 L40 90 L24 90 Z",
    foamRx: 14,
  },
  tulip: {
    body: "M18 6 C20 16 26 20 26 30 C26 48 22 62 26 74 C28 80 30 82 32 82 C34 82 36 80 38 74 C42 62 38 48 38 30 C38 20 44 16 46 6 Z",
    foamRx: 13,
  },
  snifter: {
    body: "M24 22 C14 30 12 52 18 66 C22 76 27 80 32 80 C37 80 42 76 46 66 C52 52 50 30 40 22 C36 19 28 19 24 22 Z",
    foamRx: 12,
  },
  pilsner: {
    body: "M26 4 C27 30 26 55 20 90 L44 90 C38 55 37 30 38 4 Z",
    foamRx: 12,
  },
  mug: {
    body: "M16 12 L42 12 L42 88 L16 88 Z",
    foamRx: 13,
    extra: (
      <path
        d="M42 30 C56 30 56 62 42 62"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    ),
  },
  weizen: {
    body: "M26 4 C28 24 24 44 20 62 C18 74 20 84 22 90 L42 90 C44 84 46 74 44 62 C40 44 36 24 38 4 Z",
    foamRx: 12,
  },
};

const FOAM_Y = 16;
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

      {/* glass outline */}
      <path
        d={def.body}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
