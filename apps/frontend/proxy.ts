import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  hasSessionHintCookie,
  isProtectedPath,
  ROUTE_GUARD_SESSION_COOKIE,
} from "@/lib/auth/route-protection";

/**
 * Next.js 16+ network boundary (formerly middleware.ts).
 * Session hint only — backend JWT remains the source of truth for money/data.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get(ROUTE_GUARD_SESSION_COOKIE)?.value;
  if (hasSessionHintCookie(sessionValue)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/assets/:path*",
    "/dashboard/profile",
    "/dashboard/profile/:path*",
    "/dashboard/support",
    "/dashboard/support/:path*",
    "/dashboard/notifications",
    "/dashboard/notifications/:path*",
    "/dashboard/secondary-market",
    "/dashboard/secondary-market/:path*",
  ],
};
