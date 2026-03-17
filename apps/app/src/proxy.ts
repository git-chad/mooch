import { createMiddlewareClient } from "@mooch/db/middleware";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES = [
  "/api/webhooks/",
  "/auth/callback",
  "/auth/confirm",
  "/auth/reset-callback",
  "/design",
  "/join",
];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // Refresh session cookies — required for Server Components to read auth state
  await supabase.auth.getSession();

  // Verify the user with the Supabase Auth server (secure)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (isPublicRoute) {
    return response;
  }

  // Unauthenticated + protected route → /login
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated + auth route → /
  if (user && isAuthRoute) {
    const nextPath = request.nextUrl.searchParams.get("next");
    const safeNextPath = nextPath?.startsWith("/") ? nextPath : "/groups";
    return NextResponse.redirect(new URL(safeNextPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
