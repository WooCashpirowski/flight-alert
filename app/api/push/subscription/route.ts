import { NextResponse } from "next/server";
import { PushSubscriptionInputSchema } from "@/src/modules/notifications/push-service";
import { requireWhitelistedUser } from "@/src/modules/auth/guard";
import { createSupabaseServerClient } from "@/src/shared/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await requireWhitelistedUser();
    const input = PushSubscriptionInputSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth }, { onConflict: "user_id,endpoint" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Save push subscription failed", error);
    return NextResponse.json({ ok: false, error: "Nie udało się zapisać powiadomień." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireWhitelistedUser();
    const input = PushSubscriptionInputSchema.pick({ endpoint: true }).parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", input.endpoint);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
}