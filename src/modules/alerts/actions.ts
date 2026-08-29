"use server";

import { revalidatePath } from "next/cache";
import { CreateAlertSchema, type CreateAlertInput } from "@/src/modules/alerts/schemas";
import { requireWhitelistedUser } from "@/src/modules/auth/guard";
import { hasSupabaseConfig } from "@/src/shared/lib/env";
import { createSupabaseServerClient } from "@/src/shared/lib/supabase/server";

export type AlertActionResult = { ok: boolean; message: string; id?: string };

export async function createAlert(input: CreateAlertInput): Promise<AlertActionResult> {
  const parsed = CreateAlertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Sprawdź dane alertu" };
  if (!hasSupabaseConfig) return { ok: true, message: "Alert wygląda świetnie. W trybie demo nie został zapisany.", id: "demo" };

  try {
    const user = await requireWhitelistedUser();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("alerts").insert({
      user_id: user.id,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      is_round_trip: parsed.data.isRoundTrip,
      departure_date: parsed.data.departureDate,
      return_date: parsed.data.returnDate || null,
      flex_days: parsed.data.flexDays,
      max_price: parsed.data.maxPrice,
      active: parsed.data.active,
    }).select("id").single();
    if (error) throw error;
    revalidatePath("/");
    return { ok: true, message: "Alert został zapisany.", id: data.id };
  } catch (error) {
    console.error("Create alert failed", error);
    return { ok: false, message: "Nie udało się zapisać alertu. Spróbuj ponownie." };
  }
}

export async function toggleAlert(id: string, active: boolean): Promise<AlertActionResult> {
  if (!hasSupabaseConfig) return { ok: true, message: "Zmieniono stan alertu w trybie demo." };
  try {
    const user = await requireWhitelistedUser();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("alerts").update({ active }).eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/");
    return { ok: true, message: active ? "Alert włączony." : "Alert wstrzymany." };
  } catch (error) {
    console.error("Toggle alert failed", error);
    return { ok: false, message: "Nie udało się zmienić alertu." };
  }
}