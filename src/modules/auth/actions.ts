'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/src/shared/lib/supabase/admin';
import { createSupabaseServerClient } from '@/src/shared/lib/supabase/server';
import { hasSupabaseConfig } from '@/src/shared/lib/env';
import { authTranslations } from '@/src/translations/pl/auth';

const EmailSchema = z
    .string()
    .trim()
    .email(authTranslations.validation.email);
const PasswordSchema = z
    .string()
    .min(8, authTranslations.validation.passwordMin)
    .max(72, authTranslations.validation.passwordMax);

export type AuthActionResult = {
    ok: boolean;
    message: string;
    authenticated?: boolean;
};

async function isAllowedEmail(email: string) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
        .from('allowed_users')
        .select('email')
        .ilike('email', email)
        .maybeSingle();

    if (error) throw error;
    return Boolean(data);
}

function parseCredentials(
    rawEmail: string,
    rawPassword: string,
):
    | { success: true; email: string; password: string }
    | { success: false; error: string } {
    const email = EmailSchema.safeParse(rawEmail);
    if (!email.success)
        return {
            success: false,
            error:
                email.error.issues[0]?.message ??
                authTranslations.validation.invalidEmail,
        };
    const password = PasswordSchema.safeParse(rawPassword);
    if (!password.success)
        return {
            success: false,
            error:
                password.error.issues[0]?.message ??
                authTranslations.validation.invalidPassword,
        };
    return {
        success: true,
        email: email.data.toLowerCase(),
        password: password.data,
    };
}

export async function signInWithPassword(
    rawEmail: string,
    rawPassword: string,
): Promise<AuthActionResult> {
    const credentials = parseCredentials(rawEmail, rawPassword);
    if (!credentials.success) return { ok: false, message: credentials.error };
    if (!hasSupabaseConfig)
        return {
            ok: false,
            message: authTranslations.actions.loginUnavailable,
        };

    try {
        if (!(await isAllowedEmail(credentials.email))) {
            return {
                ok: false,
                message: authTranslations.actions.accessDenied,
            };
        }

        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });
        if (error) throw error;
        return {
            ok: true,
            authenticated: true,
            message: authTranslations.actions.signedIn,
        };
    } catch (error) {
        console.error('Password sign-in failed', error);
        return {
            ok: false,
            message: authTranslations.actions.invalidCredentials,
        };
    }
}

export async function registerWithPassword(
    rawEmail: string,
    rawPassword: string,
): Promise<AuthActionResult> {
    const credentials = parseCredentials(rawEmail, rawPassword);
    if (!credentials.success) return { ok: false, message: credentials.error };
    if (!hasSupabaseConfig)
        return {
            ok: false,
            message: authTranslations.actions.registrationUnavailable,
        };

    try {
        if (!(await isAllowedEmail(credentials.email))) {
            return {
                ok: false,
                message: authTranslations.actions.emailNotAllowed,
            };
        }

        const supabase = await createSupabaseServerClient();
        const origin =
            process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
            'http://localhost:3000';
        const { data, error } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: { emailRedirectTo: `${origin}/auth/callback` },
        });
        if (error) throw error;

        if (data.session) {
            return {
                ok: true,
                authenticated: true,
                message: authTranslations.actions.accountCreated,
            };
        }

        return {
            ok: true,
            message: authTranslations.actions.confirmEmail,
        };
    } catch (error) {
        console.error('Password registration failed', error);
        const reason = error instanceof Error ? error.message : '';
        if (/email address not authorized/i.test(reason)) {
            return {
                ok: false,
                message: authTranslations.actions.smtpUnavailable,
            };
        }
        if (/rate limit/i.test(reason)) {
            return {
                ok: false,
                message: authTranslations.actions.rateLimited,
            };
        }
        return {
            ok: false,
            message: authTranslations.actions.registrationFailed,
        };
    }
}

export async function updatePassword(
    rawPassword: string,
    rawConfirmation: string,
): Promise<AuthActionResult> {
    const password = PasswordSchema.safeParse(rawPassword);
    if (!password.success)
        return {
            ok: false,
            message:
                password.error.issues[0]?.message ??
                authTranslations.validation.invalidPassword,
        };
    if (password.data !== rawConfirmation)
        return {
            ok: false,
            message: authTranslations.validation.passwordsMismatch,
        };
    if (!hasSupabaseConfig)
        return {
            ok: false,
            message: authTranslations.actions.passwordChangeUnavailable,
        };

    try {
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email || !(await isAllowedEmail(user.email))) {
            return {
                ok: false,
                message: authTranslations.actions.sessionExpired,
            };
        }
        const { error } = await supabase.auth.updateUser({
            password: password.data,
        });
        if (error) throw error;
        return {
            ok: true,
            message: authTranslations.actions.passwordSaved,
        };
    } catch (error) {
        console.error('Password update failed', error);
        return {
            ok: false,
            message: authTranslations.actions.passwordSaveFailed,
        };
    }
}

export async function signOut(): Promise<void> {
    if (hasSupabaseConfig) {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.signOut();
    }
    redirect('/login');
}
