import { createClient as createServerClient } from "@mooch/db/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/forgot-password?error=${encodeURIComponent(searchParams.get("error_description") ?? error)}`, origin),
    );
  }

  if (code) {
    const supabase = await createServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(new URL("/update-password", origin));
    }
    return NextResponse.redirect(
      new URL(`/forgot-password?error=${encodeURIComponent(exchangeError.message)}`, origin),
    );
  }

  return NextResponse.redirect(new URL("/forgot-password?error=no_code", origin));
}
