import { hasSupabaseConfig } from '@/src/shared/lib/env';
import { createSupabaseServerClient } from '@/src/shared/lib/supabase/server';
import { getWhitelistedUser } from '@/src/modules/auth/guard';
import { alertTranslations } from '@/src/translations/pl/alerts';

export type DashboardAlert = {
    id: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string | null;
    flexDays: number;
    maxPrice: number;
    active: boolean;
    bestPrice: number | null;
    bestOfferUrl: string | null;
    bestProvider: string | null;
};

const demoAlerts: DashboardAlert[] = [
    {
        id: 'demo-waw-bcn',
        origin: 'WAW',
        destination: 'BCN',
        departureDate: '2026-09-12',
        returnDate: '2026-09-16',
        flexDays: 2,
        maxPrice: 650,
        active: true,
        bestPrice: 489,
        bestOfferUrl: 'https://www.google.com/travel/flights?hl=pl&curr=PLN',
        bestProvider: 'Google Flights',
    },
    {
        id: 'demo-krk-fco',
        origin: 'KRK',
        destination: 'FCO',
        departureDate: '2026-10-03',
        returnDate: '2026-10-07',
        flexDays: 0,
        maxPrice: 520,
        active: true,
        bestPrice: null,
        bestOfferUrl: null,
        bestProvider: null,
    },
];

export async function getDashboardData(): Promise<{
    alerts: DashboardAlert[];
    name: string;
    email: string | null;
    demo: boolean;
}> {
    if (!hasSupabaseConfig)
        return {
            alerts: demoAlerts,
            name: alertTranslations.defaultTravelerName,
            email: null,
            demo: true,
        };
    const user = await getWhitelistedUser();
    if (!user)
        return {
            alerts: [],
            name: alertTranslations.defaultTravelerName,
            email: null,
            demo: false,
        };
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('alerts')
        .select(
            'id,origin,destination,departure_date,return_date,flex_days,max_price,active,best_price,best_offer_url,best_provider',
        )
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Load alerts failed', error);
        return {
            alerts: [],
            name:
                user.email?.split('@')[0] ??
                alertTranslations.defaultTravelerName,
            email: user.email ?? null,
            demo: false,
        };
    }
    return {
        alerts: data.map((item) => ({
            id: item.id,
            origin: item.origin,
            destination: item.destination,
            departureDate: item.departure_date,
            returnDate: item.return_date,
            flexDays: item.flex_days,
            maxPrice: Number(item.max_price),
            active: item.active,
            bestPrice:
                item.best_price === null ? null : Number(item.best_price),
            bestOfferUrl: item.best_offer_url,
            bestProvider: item.best_provider,
        })),
        name:
            user.user_metadata.full_name ??
            user.email?.split('@')[0] ??
            alertTranslations.defaultTravelerName,
        email: user.email ?? null,
        demo: false,
    };
}
