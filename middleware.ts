import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicPaths = [
    '/login',
    '/auth/callback',
    '/offline',
    '/api/cron/check-flights',
];

export async function middleware(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return NextResponse.next();

    let response = NextResponse.next({ request });
    const supabase = createServerClient(url, anonKey, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (items) => {
                items.forEach(({ name, value }) =>
                    request.cookies.set(name, value),
                );
                response = NextResponse.next({ request });
                items.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options),
                );
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();
    const isPublic = publicPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path),
    );
    if (!user && !isPublic) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (user?.email) {
        const { data: allowed } = await supabase
            .from('allowed_users')
            .select('email')
            .ilike('email', user.email)
            .maybeSingle();
        if (!allowed) {
            await supabase.auth.signOut();
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/login';
            loginUrl.search = '?error=not_allowed';
            return NextResponse.redirect(loginUrl);
        }
    }
    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|icons/|locales/|og.png|sw.js|manifest.webmanifest).*)',
    ],
};
