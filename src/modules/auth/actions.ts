"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/src/shared/lib/supabase/admin";
import { createSupabaseServerClient } from "@/src/shared/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/shared/lib/env";

const EmailSchema = z.string().trim().email("Podaj poprawny adres e-mail");
export type AuthActionResult = { ok: boolean; message: string };

export async function requestMagicLink(rawEmail: string): Promise<AuthActionResult> {
  const parsed = EmailSchema.safeParse(rawEmail);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Niepoprawny e-mail" };
  if (!hasSupabaseConfig) return { ok: false, message: "Tryb demonstracyjny — dodaj konfigurację Supabase, aby wysłać link." };

  try {
    const admin = createSupabaseAdminClient();
    const { data: allowed } = await admin.from("allowed_users").select("email").ilike("email", parsed.data).maybeSingle();
    if (!allowed) return { ok: false, message: "Brak dostępu. Skontaktuj się z administratorem." };

    const supabase = await createSupabaseServerClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) throw error;
    return { ok: true, message: "Sprawdź skrzynkę. Link do logowania jest ważny przez kilka minut." };
  } catch (error) {
    console.error("Magic link request failed", error);
    return { ok: false, message: "Nie udało się wysłać linku. Spróbuj ponownie." };
  }
}