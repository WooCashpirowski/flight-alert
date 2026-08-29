import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/shared/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=invalid_link", url.origin));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=invalid_link", url.origin));

  const { data: { user } } = await supabase.auth.getUser();
  const { data: allowed } = user?.email
    ? await supabase.from("allowed_users").select("email").ilike("email", user.email).maybeSingle()
    : { data: null };

  if (!allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=not_allowed", url.origin));
  }
  return NextResponse.redirect(new URL("/", url.origin));
}