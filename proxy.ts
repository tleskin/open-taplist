import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Basic auth for the admin dashboard and every write endpoint.
 *
 * Set ADMIN_USERNAME (default "admin") and ADMIN_PASSWORD to protect the
 * admin — the browser shows its native login prompt once, then remembers.
 * When ADMIN_PASSWORD is unset the admin stays open, preserving the
 * previous behavior for trusted LAN setups. DEMO_MODE=true bypasses auth
 * because the demo is already read-only.
 */

// Runtime-agnostic constant-time string compare (proxy runs on the edge).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function checkAuth(authHeader: string, username: string, password: string) {
  const space = authHeader.indexOf(" ");
  if (space === -1) return false;
  const scheme = authHeader.slice(0, space);
  const encoded = authHeader.slice(space + 1);
  if (scheme !== "Basic" || !encoded) return false;
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }
  const colon = decoded.indexOf(":");
  if (colon === -1) return false;
  return (
    safeEqual(decoded.slice(0, colon), username) &&
    safeEqual(decoded.slice(colon + 1), password)
  );
}

export function proxy(request: NextRequest) {
  if (process.env.DEMO_MODE === "true") return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) return NextResponse.next();

  const username = process.env.ADMIN_USERNAME || "admin";
  const authHeader = request.headers.get("authorization") ?? "";
  if (checkAuth(authHeader, username, password)) {
    return NextResponse.next();
  }

  return new NextResponse("Admin access requires authentication.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="OpenTaplist Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/settings", "/api/beers/:path*/cheers"],
};
