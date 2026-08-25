import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/monitoring", "/riwayat", "/energi", "/biaya", "/perangkat", "/alarm", "/pengaturan", "/profil"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresLogin = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthenticated = request.cookies.get("spw_demo_auth")?.value === "1";

  if (requiresLogin && !isAuthenticated) {
    const landingUrl = request.nextUrl.clone();
    landingUrl.pathname = "/";
    landingUrl.search = "";
    return NextResponse.redirect(landingUrl);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
