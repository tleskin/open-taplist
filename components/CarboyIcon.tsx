import { useId } from "react";

type CarboyIconProps = {
  className?: string;
};

/**
 * A classic 5-gallon carboy with an airlock — the Fermenting section icon.
 * Strokes use currentColor so the parent controls the tint.
 */
export default function CarboyIcon({ className }: CarboyIconProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `carboyclip-${uid}`;
  const body =
    "M28 24 C16 30 12 44 12 58 L12 76 C12 86 20 90 32 90 C44 90 52 86 52 76 L52 58 C52 44 48 30 36 24 Z";

  return (
    <svg
      viewBox="0 0 64 96"
      className={className}
      role="img"
      aria-label="Fermenting carboy"
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={body} />
        </clipPath>
      </defs>

      {/* airlock */}
      <rect x="29" y="2" width="6" height="9" rx="2" strokeWidth="2.5" />
      <rect x="27" y="11" width="10" height="4" rx="1.5" strokeWidth="2" />
      {/* neck */}
      <path d="M28 15 L28 26 M36 15 L36 26" strokeWidth="2.5" />

      {/* body */}
      <path d={body} strokeWidth="2.5" fill="rgba(255,255,255,0.04)" />

      {/* fermenting wort, clipped to the body */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="50" width="64" height="46" fill="#B45309" opacity="0.45" />
        <rect x="0" y="50" width="64" height="10" fill="#FDE68A" opacity="0.5" />
        {/* CO2 bubbles */}
        <circle cx="24" cy="70" r="2.5" fill="#FDE68A" opacity="0.8" />
        <circle cx="34" cy="78" r="2" fill="#FDE68A" opacity="0.7" />
        <circle cx="40" cy="64" r="3" fill="#FDE68A" opacity="0.6" />
        <circle cx="28" cy="58" r="1.8" fill="#FDE68A" opacity="0.7" />
      </g>

      {/* shine */}
      <path
        d="M18 44 C16 54 16 64 18 74"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
