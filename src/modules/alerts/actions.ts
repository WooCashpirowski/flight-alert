'use server';

import { revalidatePath } from 'next/cache';
import {
    CreateAlertSchema,
    type CreateAlertInput,
} from '@/src/modules/alerts/schemas';
import { requireWhitelistedUser } from '@/src/modules/auth/guard';
import { hasSupabaseConfig } from '@/src/shared/lib/env';
import { createSupabaseServerClient } from '@/src/shared/lib/supabase/server';

export type AlertActionResult = { ok: boolean; message: string; id?: string };

function alertPayload(input: CreateAlertInput, userId: string) {
    return {
        user_id: userId,
        origin: input.origin,
        destination: input.destination,
        is_round_trip: input.isRoundTrip,
        departure_date: input.departureDate,
        return_date: input.returnDate || null,
        flex_days: input.flexDays,
        max_price: input.maxPrice,
        active: input.active,
    };
}

export async function createAlert(
    input: CreateAlertInput,
): Promise<AlertActionResult> {
    const parsed = CreateAlertSchema.safeParse(input);
    if (!parsed.success)
        return {
            ok: false,
            message: parsed.error.issues[0]?.message ?? 'Sprawdź dane alertu',
        };
    if (!hasSupabaseConfig)
        return {
            ok: true,
            message:
                'Alert wygląda świetnie. W trybie demo nie został zapisany.',
            id: 'demo',
        };

    try {
        const user = await requireWhitelistedUser();
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from('alerts')
            .insert(alertPayload(parsed.data, user.id))
            .select('id')
            .single();
        if (error) throw error;
        revalidatePath('/');
        return { ok: true, message: 'Alert został zapisany.', id: data.id };
    } catch (error) {
        console.error('Create alert failed', error);
        return {
            ok: false,
            message: 'Nie udało się zapisać alertu. Spróbuj ponownie.',
        };
    }
}

export async function updateAlert(
    id: string,
    input: CreateAlertInput,
): Promise<AlertActionResult> {
    const parsed = CreateAlertSchema.safeParse(input);
    if (!parsed.success)
        return {
            ok: false,
            message: parsed.error.issues[0]?.message ?? 'Sprawdź dane alertu',
        };
    if (!hasSupabaseConfig)
        return {
            ok: true,
            message: 'Zmiany wyglądają poprawnie w trybie demo.',
            id,
        };

    try {
        const user = await requireWhitelistedUser();
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from('alerts')
            .update(alertPayload(parsed.data, user.id))
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id')
            .maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, message: 'Nie znaleziono alertu.' };
        revalidatePath('/');
        revalidatePath(`/alerts/${id}`);
        return { ok: true, message: 'Zmiany zostały zapisane.', id };
    } catch (error) {
        console.error('Update alert failed', error);
        return { ok: false, message: 'Nie udało się zapisać zmian.' };
    }
}

export async function toggleAlert(
    id: string,
    active: boolean,
): Promise<AlertActionResult> {
    if (!hasSupabaseConfig)
        return {
            ok: true,
            message: active
                ? 'Alert włączony w trybie demo.'
                : 'Alert wstrzymany w trybie demo.',
        };
    try {
        const user = await requireWhitelistedUser();
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from('alerts')
            .update({ active })
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id')
            .maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, message: 'Nie znaleziono alertu.' };
        revalidatePath('/');
        revalidatePath(`/alerts/${id}`);
        return {
            ok: true,
            message: active ? 'Alert włączony.' : 'Alert wstrzymany.',
        };
    } catch (error) {
        console.error('Toggle alert failed', error);
        return { ok: false, message: 'Nie udało się zmienić alertu.' };
    }
}

export async function deleteAlert(id: string): Promise<AlertActionResult> {
    if (!hasSupabaseConfig)
        return { ok: true, message: 'Alert usunięty w trybie demo.' };
    try {
        const user = await requireWhitelistedUser();
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from('alerts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id')
            .maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, message: 'Nie znaleziono alertu.' };
        revalidatePath('/');
        return { ok: true, message: 'Alert został usunięty.' };
    } catch (error) {
        console.error('Delete alert failed', error);
        return { ok: false, message: 'Nie udało się usunąć alertu.' };
    }
}
