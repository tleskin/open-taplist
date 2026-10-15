/**
 * Convert a beer color in SRM (Standard Reference Method) to a hex color.
 *
 * Uses the standard SRM anchor table with linear interpolation between
 * anchors in RGB space. Values are clamped to the 1–40 range; a null or
 * missing SRM falls back to a neutral amber.
 */

// [srm, hex] anchors sampled from the standard SRM color chart.
const ANCHORS: Array<[number, string]> = [
  [1, "#FDEA8E"],
  [2, "#F7F779"],
  [4, "#FFCA5A"],
  [6, "#F8A600"],
  [8, "#EA8F00"],
  [10, "#DE7C00"],
  [13, "#CB6200"],
  [16, "#B44A00"],
  [20, "#963300"],
  [24, "#722100"],
  [28, "#4A1200"],
  [30, "#551704"],
  [34, "#241419"],
  [40, "#2B090A"],
];

const DEFAULT_HEX = "#F8A600"; // neutral amber

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function srmToHex(srm: number | null | undefined): string {
  if (srm === null || srm === undefined || !Number.isFinite(srm)) {
    return DEFAULT_HEX;
  }
  const clamped = Math.min(40, Math.max(1, srm));

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [s0, h0] = ANCHORS[i];
    const [s1, h1] = ANCHORS[i + 1];
    if (clamped >= s0 && clamped <= s1) {
      if (s0 === s1 || clamped === s0) return h0.toUpperCase();
      if (clamped === s1) return h1.toUpperCase();
      const t = (clamped - s0) / (s1 - s0);
      const [r0, g0, b0] = hexToRgb(h0);
      const [r1, g1, b1] = hexToRgb(h1);
      return rgbToHex(
        r0 + (r1 - r0) * t,
        g0 + (g1 - g0) * t,
        b0 + (b1 - b0) * t
      );
    }
  }
  // clamped is exactly 40 (or beyond the last anchor)
  return ANCHORS[ANCHORS.length - 1][1].toUpperCase();
}
