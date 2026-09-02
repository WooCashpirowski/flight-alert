import type { User } from '@supabase/supabase-js';
import { hasSupabaseConfig } from '@/src/shared/lib/env';
import { createSupabaseServerClient } from '@/src/shared/lib/supabase/server';
import { authTranslations } from '@/src/translations/pl/auth';

export async function getWhitelistedUser(): Promise<User | null> {
    if (!hasSupabaseConfig) return null;
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    const { data } = await supabase
        .from('allowed_users')
        .select('email')
        .ilike('email', user.email)
        .maybeSingle();
    return data ? user : null;
}

export async function requireWhitelistedUser() {
    const user = await getWhitelistedUser();
    if (!user) throw new Error(authTranslations.actions.accessDenied);
    return user;
}
