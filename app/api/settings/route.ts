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
  const [storedTheme, storedName, storedLogo, storedCustom] = await Promise.all(
    [
      getSetting("theme"),
      getSetting("brewery_name"),
      getSetting("brewery_logo"),
      getSetting("custom_themes"),
    ]
  );
  const theme: ThemeId = isThemeId(storedTheme) ? storedTheme : DEFAULT_THEME;
  return Response.json({
    theme: isCustomThemeRef(storedTheme) ? storedTheme : theme,
    breweryName: storedName ?? DEFAULT_BREWERY_NAME,
    breweryLogo: storedLogo ?? null,
    customThemes: parseCustomThemes(storedCustom),
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

  return Response.json(out);
}
