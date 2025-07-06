import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

import { JWT_SECRET } from "@/lib/auth/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/signin", "/signup"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const sessionToken = request.cookies.get("session_token")?.value;

  let session = null;
  if (sessionToken && JWT_SECRET) {
    try {
      const { payload } = await jose.jwtVerify(
        sessionToken,
        new TextEncoder().encode(JWT_SECRET)
      );
      session = payload;
    } catch (error) {
      console.error("JWT verification failed:", error);
      // If token is invalid, treat as no session
    }
  }

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
