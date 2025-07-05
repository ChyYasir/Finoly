import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/signin", "/signup"];

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If user is not authenticated and trying to access protected route
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // If user is authenticated and trying to access auth routes
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);

    // If there's an error checking session and it's a protected route
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
  }
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
