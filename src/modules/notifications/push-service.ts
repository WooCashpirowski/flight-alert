import webpush, { type PushSubscription } from 'web-push';
import { z } from 'zod';
import type { FlightOffer } from '@/src/modules/flight-search/types';
import { notificationTranslations } from '@/src/translations/pl/notifications';

const SubscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
});
export const PushSubscriptionInputSchema = SubscriptionSchema;
export type FlightDeal = { alertId: string; offer: FlightOffer };

function configureWebPush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject)
        throw new Error(notificationTranslations.push.missingVapid);
    webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendDailyDigest(
    subscription: unknown,
    deals: FlightDeal[],
) {
    configureWebPush();
    const parsed = SubscriptionSchema.parse(subscription) as PushSubscription;
    const cheapest = deals.reduce((best, deal) =>
        deal.offer.price < best.offer.price ? deal : best,
    );
    const offer = cheapest.offer;
    const payload = JSON.stringify({
        title:
            deals.length === 1
                ? notificationTranslations.push.singleDealTitle
                : notificationTranslations.push.multipleDealsTitle(
                      deals.length,
                  ),
        body: notificationTranslations.push.cheapest(
            offer.origin,
            offer.destination,
            offer.price,
            offer.currency,
        ),
        url: `/alerts/${cheapest.alertId}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/notification-96.png',
        tag: `flight-alert-${new Date().toISOString().slice(0, 10)}`,
    });
    await webpush.sendNotification(parsed, payload, {
        TTL: 60 * 60 * 12,
        urgency: 'normal',
    });
}
