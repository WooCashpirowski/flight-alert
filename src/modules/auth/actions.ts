'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/src/shared/lib/supabase/admin';
import { createSupabaseServerClient } from '@/src/shared/lib/supabase/server';
import { hasSupabaseConfig } from '@/src/shared/lib/env';

const EmailSchema = z.string().trim().email('Podaj poprawny adres e-mail');
const PasswordSchema = z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .max(72, 'Hasło może mieć maksymalnie 72 znaki');

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
            error: email.error.issues[0]?.message ?? 'Niepoprawny e-mail',
        };
    const password = PasswordSchema.safeParse(rawPassword);
    if (!password.success)
        return {
            success: false,
            error: password.error.issues[0]?.message ?? 'Niepoprawne hasło',
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
            message: 'Logowanie jest niedostępne w trybie demonstracyjnym.',
        };

    try {
        if (!(await isAllowedEmail(credentials.email))) {
            return {
                ok: false,
                message: 'Brak dostępu. Skontaktuj się z administratorem.',
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
            message: 'Zalogowano pomyślnie.',
        };
    } catch (error) {
        console.error('Password sign-in failed', error);
        return { ok: false, message: 'Nieprawidłowy e-mail lub hasło.' };
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
            message: 'Rejestracja jest niedostępna w trybie demonstracyjnym.',
        };

    try {
        if (!(await isAllowedEmail(credentials.email))) {
            return {
                ok: false,
                message: 'Ten adres nie znajduje się na liście dostępu.',
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
                message: 'Konto zostało utworzone.',
            };
        }

        return {
            ok: true,
            message:
                'Sprawdź skrzynkę i potwierdź adres e-mail. Potem zalogujesz się hasłem.',
        };
    } catch (error) {
        console.error('Password registration failed', error);
        const reason = error instanceof Error ? error.message : '';
        if (/email address not authorized/i.test(reason)) {
            return {
                ok: false,
                message:
                    'Nie można wysłać potwierdzenia na ten adres. Administrator musi skonfigurować wysyłkę SMTP.',
            };
        }
        if (/rate limit/i.test(reason)) {
            return {
                ok: false,
                message:
                    'Wysłano zbyt wiele wiadomości. Odczekaj chwilę i spróbuj ponownie.',
            };
        }
        return {
            ok: false,
            message:
                'Nie udało się utworzyć konta. Jeśli korzystałeś wcześniej z magic linku, ustaw hasło w Ustawieniach w aktywnej sesji.',
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
            message: password.error.issues[0]?.message ?? 'Niepoprawne hasło',
        };
    if (password.data !== rawConfirmation)
        return { ok: false, message: 'Hasła nie są takie same.' };
    if (!hasSupabaseConfig)
        return {
            ok: false,
            message: 'Zmiana hasła jest niedostępna w trybie demonstracyjnym.',
        };

    try {
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email || !(await isAllowedEmail(user.email))) {
            return {
                ok: false,
                message: 'Sesja wygasła. Zaloguj się ponownie.',
            };
        }
        const { error } = await supabase.auth.updateUser({
            password: password.data,
        });
        if (error) throw error;
        return {
            ok: true,
            message:
                'Hasło zostało zapisane. Możesz używać go na wszystkich urządzeniach.',
        };
    } catch (error) {
        console.error('Password update failed', error);
        return {
            ok: false,
            message: 'Nie udało się zapisać hasła. Spróbuj ponownie.',
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
