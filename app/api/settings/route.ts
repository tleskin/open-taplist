import { connection } from "next/server";
import { isThemeId, type ThemeId } from "@/lib/themes";
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

export async function GET() {
  await connection(); // skip prerendering: reads the live database
  const [storedTheme, storedName, storedLogo] = await Promise.all([
    getSetting("theme"),
    getSetting("brewery_name"),
    getSetting("brewery_logo"),
  ]);
  const theme: ThemeId = isThemeId(storedTheme) ? storedTheme : DEFAULT_THEME;
  return Response.json({
    theme,
    breweryName: storedName ?? DEFAULT_BREWERY_NAME,
    breweryLogo: storedLogo ?? null,
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
    if (!isThemeId(b.theme)) {
      return Response.json(
        { error: "theme must be 'midnight' or 'liquid-glass'." },
        { status: 400 }
      );
    }
    await setSetting("theme", b.theme);
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

  return Response.json(out);
}
