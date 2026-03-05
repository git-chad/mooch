import { createMiddlewareClient } from "@mooch/db/middleware";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES = [
  "/auth/callback",
  "/auth/confirm",
  "/auth/reset-callback",
  "/design",
  "/join",
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // Refresh session — required for Server Components to read up-to-date auth state
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Always allow public routes (OAuth callbacks, etc.)
  if (isPublicRoute) {
    return response;
  }

  // Root "/" → redirect based on auth state
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? "/groups" : "/login", request.url),
    );
  }

  // Unauthenticated + protected route → /login
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated + auth route → /groups
  if (session && isAuthRoute) {
    const nextPath = request.nextUrl.searchParams.get("next");
    const safeNextPath = nextPath?.startsWith("/") ? nextPath : "/groups";
    return NextResponse.redirect(new URL(safeNextPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and api routes handled
     * by Next.js internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
