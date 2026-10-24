
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");

  // Only allow a local path, not an external redirect.
  const next =
    requestedNext?.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/admin/login";

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/login?error=confirmation_failed", url.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Email confirmation callback failed:", error.message);

    return NextResponse.redirect(
      new URL("/admin/login?error=confirmation_failed", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
