import { connection } from "next/server";
import {
  isCustomThemeRef,
  isThemeId,
  isValidCustomTheme,
  type CustomThemeParams,
  type ThemeId,
} from "@/lib/themes";
import { deleteSetting, getSetting, setSetting } from "@/lib/settings";

const DEFAULT_THEME: ThemeId = "midnight";
const DEFAULT_BREWERY_NAME = "My Home Brewery";
const MAX_NAME_LENGTH = 80;
// ~2MB image file becomes ~2.7MB as a base64 data URL.
const MAX_LOGO_LENGTH = 2_800_000;
const DEFAULT_ROTATE_SECONDS = 12;
const MIN_ROTATE_SECONDS = 5;
const MAX_ROTATE_SECONDS = 120;

function parseRotateSeconds(raw: string | null): number {
  const n = parseInt(raw ?? "", 10);
  if (!Number.isInteger(n)) return DEFAULT_ROTATE_SECONDS;
  return Math.min(MAX_ROTATE_SECONDS, Math.max(MIN_ROTATE_SECONDS, n));
}

function isLogoValue(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.startsWith("data:image/") &&
    v.length <= MAX_LOGO_LENGTH
  );
}

function parseCustomThemes(raw: string | null): CustomThemeParams[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCustomTheme);
  } catch {
    return [];
  }
}

export async function GET() {
  await connection(); // skip prerendering: reads the live database
  const [
    storedTheme,
    storedName,
    storedLogo,
    storedCustom,
    storedRotate,
    storedRotateSecs,
    storedCheers,
    storedDesc,
    storedOnTap,
    storedFerm,
    storedSoon,
  ] = await Promise.all([
    getSetting("theme"),
    getSetting("brewery_name"),
    getSetting("brewery_logo"),
    getSetting("custom_themes"),
    getSetting("display_rotate"),
    getSetting("display_rotate_seconds"),
    getSetting("cheers_enabled"),
    getSetting("show_descriptions"),
    getSetting("show_on_tap"),
    getSetting("show_fermenting"),
    getSetting("show_coming_soon"),
  ]);
  const theme: ThemeId = isThemeId(storedTheme) ? storedTheme : DEFAULT_THEME;
  return Response.json({
    theme: isCustomThemeRef(storedTheme) ? storedTheme : theme,
    breweryName: storedName ?? DEFAULT_BREWERY_NAME,
    breweryLogo: storedLogo ?? null,
    customThemes: parseCustomThemes(storedCustom),
    display: {
      rotate: storedRotate !== "false",
      rotateSeconds: parseRotateSeconds(storedRotateSecs),
    },
    cheersEnabled: storedCheers !== "false",
    showDescriptions: storedDesc !== "false",
    showOnTap: storedOnTap !== "false",
    showFermenting: storedFerm !== "false",
    showComingSoon: storedSoon !== "false",
  });
}

export async function PUT(request: Request) {
  await connection(); // skip prerendering: writes the live database
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown> | null) ?? {};
  const out: Record<string, unknown> = {};

  if ("theme" in b) {
    const themeOk =
      isThemeId(b.theme) ||
      (typeof b.theme === "string" && /^custom:[A-Za-z0-9_-]+$/.test(b.theme));
    if (!themeOk) {
      return Response.json(
        { error: "theme must be 'midnight', 'liquid-glass', 'liquid-glass-light', 'daylight', or 'custom:<id>'." },
        { status: 400 }
      );
    }
    await setSetting("theme", b.theme as string);
    out.theme = b.theme;
  }

  if ("breweryName" in b) {
    const name =
      typeof b.breweryName === "string" ? b.breweryName.trim() : "";
    if (!name || name.length > MAX_NAME_LENGTH) {
      return Response.json(
        { error: "breweryName must be 1–80 characters." },
        { status: 400 }
      );
    }
    await setSetting("brewery_name", name);
    out.breweryName = name;
  }

  if ("breweryLogo" in b) {
    const logo = b.breweryLogo;
    if (logo !== null && !isLogoValue(logo)) {
      return Response.json(
        {
          error:
            "breweryLogo must be null or an image data URL under ~2MB.",
        },
        { status: 400 }
      );
    }
    if (logo === null) {
      await deleteSetting("brewery_logo");
    } else {
      await setSetting("brewery_logo", logo);
    }
    out.breweryLogo = logo;
  }

  if ("customThemes" in b) {
    const list = b.customThemes;
    if (
      !Array.isArray(list) ||
      list.length > 50 ||
      !list.every(isValidCustomTheme)
    ) {
      return Response.json(
        { error: "customThemes must be an array of up to 50 valid themes." },
        { status: 400 }
      );
    }
    await setSetting("custom_themes", JSON.stringify(list));
    out.customThemes = list;
  }

  if ("displayRotate" in b) {
    if (typeof b.displayRotate !== "boolean") {
      return Response.json(
        { error: "displayRotate must be a boolean." },
        { status: 400 }
      );
    }
    await setSetting("display_rotate", b.displayRotate ? "true" : "false");
    out.displayRotate = b.displayRotate;
  }

  if ("displayRotateSeconds" in b) {
    const n = b.displayRotateSeconds;
    if (
      !Number.isInteger(n) ||
      (n as number) < MIN_ROTATE_SECONDS ||
      (n as number) > MAX_ROTATE_SECONDS
    ) {
      return Response.json(
        {
          error: `displayRotateSeconds must be an integer ${MIN_ROTATE_SECONDS}–${MAX_ROTATE_SECONDS}.`,
        },
        { status: 400 }
      );
    }
    await setSetting("display_rotate_seconds", String(n));
    out.displayRotateSeconds = n;
  }

  if ("cheersEnabled" in b) {
    if (typeof b.cheersEnabled !== "boolean") {
      return Response.json(
        { error: "cheersEnabled must be a boolean." },
        { status: 400 }
      );
    }
    await setSetting("cheers_enabled", b.cheersEnabled ? "true" : "false");
    out.cheersEnabled = b.cheersEnabled;
  }

  if ("showDescriptions" in b) {
    if (typeof b.showDescriptions !== "boolean") {
      return Response.json(
        { error: "showDescriptions must be a boolean." },
        { status: 400 }
      );
    }
    await setSetting("show_descriptions", b.showDescriptions ? "true" : "false");
    out.showDescriptions = b.showDescriptions;
  }

  for (const [bodyKey, storeKey] of [
    ["showOnTap", "show_on_tap"],
    ["showFermenting", "show_fermenting"],
    ["showComingSoon", "show_coming_soon"],
  ] as const) {
    if (bodyKey in b) {
      if (typeof b[bodyKey] !== "boolean") {
        return Response.json(
          { error: `${bodyKey} must be a boolean.` },
          { status: 400 }
        );
      }
      await setSetting(storeKey, b[bodyKey] ? "true" : "false");
      out[bodyKey] = b[bodyKey];
    }
  }

  return Response.json(out);
}
