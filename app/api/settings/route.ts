import { connection } from "next/server";
import { isThemeId, type ThemeId } from "@/lib/themes";
import { getSetting, setSetting } from "@/lib/settings";

const DEFAULT_THEME: ThemeId = "midnight";

export async function GET() {
  await connection(); // skip prerendering: reads the live database
  const stored = await getSetting("theme");
  const theme: ThemeId = isThemeId(stored) ? stored : DEFAULT_THEME;
  return Response.json({ theme });
}

export async function PUT(request: Request) {
  await connection(); // skip prerendering: writes the live database
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const theme = (body as { theme?: unknown } | null)?.theme;
  if (!isThemeId(theme)) {
    return Response.json(
      { error: "theme must be 'midnight' or 'liquid-glass'." },
      { status: 400 }
    );
  }
  await setSetting("theme", theme);
  return Response.json({ theme });
}
