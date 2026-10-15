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
  ipa: "IPA Glass",
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
    body: "M20 8 C21 34 22 60 24 88 L40 88 C42 60 43 34 44 8 Z",
    foamRx: 12,
  },
  tulip: {
    // Footed glass: bulbous bowl, pinched waist, softly flared lip.
    body:
      "M21 9 C25 10 28 11 32 11 C36 11 39 10 43 9 " +
      "C41 16 41 20 42 25 C47 33 49 41 47 49 C45 59 39 65 34 67 " +
      "L34 83 L42 89 L22 89 L30 83 L30 67 " +
      "C25 65 19 59 17 49 C15 41 17 33 22 25 C23 20 23 16 21 9 Z",
    foamRx: 11,
  },
  snifter: {
    // Squat balloon bowl and narrow mouth to trap aroma, short stem.
    body:
      "M25 14 C18 22 12 32 12 42 C12 54 20 62 27 64 " +
      "L27 77 L21 87 L43 87 L37 77 L37 64 " +
      "C44 62 52 54 52 42 C52 32 46 22 39 14 C34 16 30 16 25 14 Z",
    foamRx: 9,
  },
  pilsner: {
    // Straight trumpet flute on a small foot.
    body: "M14 6 L50 6 L37 62 L37 79 L42 87 L22 87 L27 79 L27 62 Z",
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
    body:
      "M15 5 C20 22 23 36 24 50 C25 64 26 76 25 88 L39 88 " +
      "C38 76 39 64 40 50 C41 36 44 22 49 5 C39 9 25 9 15 5 Z",
    foamRx: 13,
  },
  ipa: {
    // Spiegelau-style: footed, with ridged double-bulb bowl and flared rim.
    body:
      "M18 8 C21 10 23 12 24 16 C20 20 18 24 19 28 C20 33 24 36 26 40 " +
      "C24 44 20 48 19 52 C18 57 22 60 26 62 L29 62 L29 77 L22 87 " +
      "L42 87 L35 77 L35 62 L38 62 C42 60 46 57 45 52 C44 48 40 44 38 40 " +
      "C40 36 44 33 45 28 C46 24 44 20 40 16 C41 12 43 10 46 8 " +
      "C38 11 26 11 18 8 Z",
    foamRx: 11,
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
