import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/monitoring", "/riwayat", "/energi", "/biaya", "/perangkat", "/alarm", "/pengaturan", "/profil"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDeveloperPath = pathname === "/dashboard/developer" || pathname.startsWith("/dashboard/developer/");
  const isUserPath = pathname === "/dashboard/user" || pathname.startsWith("/dashboard/user/");
  const requiresLogin = isDeveloperPath || isUserPath || protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthenticated = request.cookies.get("spw_demo_auth")?.value === "1";
  const role = request.cookies.get("spw_demo_role")?.value === "DEVELOPER" ? "DEVELOPER" : "USER";

  if (requiresLogin && !isAuthenticated) {
    const landingUrl = request.nextUrl.clone();
    landingUrl.pathname = "/login";
    landingUrl.search = "?message=Silakan masuk untuk membuka dashboard.";
    return NextResponse.redirect(landingUrl);
  }

  if (pathname === "/dashboard") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = role === "DEVELOPER" ? "/dashboard/developer" : "/dashboard/user";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }
  if (isDeveloperPath && role !== "DEVELOPER") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard/user";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }
  if (isUserPath && role === "DEVELOPER") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard/developer";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
