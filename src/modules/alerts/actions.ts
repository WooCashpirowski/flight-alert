'use server';

import { revalidatePath } from 'next/cache';
import {
    CreateAlertSchema,
    type CreateAlertInput,
} from '@/src/modules/alerts/schemas';
import { requireWhitelistedUser } from '@/src/modules/auth/guard';
import { hasSupabaseConfig } from '@/src/shared/lib/env';
import { createSupabaseServerClient } from '@/src/shared/lib/supabase/server';
import { alertTranslations } from '@/src/translations/pl/alerts';

export type AlertActionResult = { ok: boolean; message: string; id?: string };

function alertPayload(input: CreateAlertInput, userId: string) {
    return {
        user_id: userId,
        origin: input.origin,
        destination: input.destination,
        is_round_trip: input.isRoundTrip,
        departure_date: input.departureDate,
        return_date: input.isRoundTrip ? input.returnDate || null : null,
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
            message:
                parsed.error.issues[0]?.message ??
                alertTranslations.validation.checkData,
        };
    if (!hasSupabaseConfig)
        return {
            ok: true,
            message: alertTranslations.actions.createDemo,
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
        return {
            ok: true,
            message: alertTranslations.actions.created,
            id: data.id,
        };
    } catch (error) {
        console.error('Create alert failed', error);
        return {
            ok: false,
            message: alertTranslations.actions.createFailed,
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
            message:
                parsed.error.issues[0]?.message ??
                alertTranslations.validation.checkData,
        };
    if (!hasSupabaseConfig)
        return {
            ok: true,
            message: alertTranslations.actions.updateDemo,
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
        if (!data)
            return {
                ok: false,
                message: alertTranslations.actions.notFound,
            };
        revalidatePath('/');
        revalidatePath(`/alerts/${id}`);
        return {
            ok: true,
            message: alertTranslations.actions.updated,
            id,
        };
    } catch (error) {
        console.error('Update alert failed', error);
        return {
            ok: false,
            message: alertTranslations.actions.updateFailed,
        };
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
                ? alertTranslations.actions.enabledDemo
                : alertTranslations.actions.pausedDemo,
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
        if (!data)
            return {
                ok: false,
                message: alertTranslations.actions.notFound,
            };
        revalidatePath('/');
        revalidatePath(`/alerts/${id}`);
        return {
            ok: true,
            message: active
                ? alertTranslations.actions.enabled
                : alertTranslations.actions.paused,
        };
    } catch (error) {
        console.error('Toggle alert failed', error);
        return {
            ok: false,
            message: alertTranslations.actions.toggleFailed,
        };
    }
}

export async function deleteAlert(id: string): Promise<AlertActionResult> {
    if (!hasSupabaseConfig)
        return {
            ok: true,
            message: alertTranslations.actions.deletedDemo,
        };
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
        if (!data)
            return {
                ok: false,
                message: alertTranslations.actions.notFound,
            };
        revalidatePath('/');
        return {
            ok: true,
            message: alertTranslations.actions.deleted,
        };
    } catch (error) {
        console.error('Delete alert failed', error);
        return {
            ok: false,
            message: alertTranslations.actions.deleteFailed,
        };
    }
}
