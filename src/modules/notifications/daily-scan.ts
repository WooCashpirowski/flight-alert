import { CreateAlertSchema } from "@/src/modules/alerts/schemas";
import { searchFlights } from "@/src/modules/flight-search/flight-service";
import { sendDailyDigest, type FlightDeal } from "@/src/modules/notifications/push-service";
import { createSupabaseAdminClient } from "@/src/shared/lib/supabase/admin";

export async function runDailyScan() {
  const admin = createSupabaseAdminClient();
  const { data: alerts, error } = await admin.from("alerts").select("*").eq("active", true);
  if (error) throw error;
  const dealsByUser = new Map<string, FlightDeal[]>();

  for (const alert of alerts) {
    try {
      const input = CreateAlertSchema.parse({ origin: alert.origin, destination: alert.destination, isRoundTrip: alert.is_round_trip, departureDate: alert.departure_date, returnDate: alert.return_date ?? "", flexDays: alert.flex_days, maxPrice: Number(alert.max_price), active: alert.active });
      const offers = await searchFlights(input);
      const best = offers[0];
      await admin.from("alerts").update({ last_checked_at: new Date().toISOString(), best_price: best?.price ?? null }).eq("id", alert.id);
      const matching = offers.filter((offer) => offer.price <= Number(alert.max_price)).map((offer) => ({ alertId: alert.id, offer }));
      if (matching.length) dealsByUser.set(alert.user_id, [...(dealsByUser.get(alert.user_id) ?? []), ...matching]);
    } catch (error) {
      console.error("Alert scan failed", { alertId: alert.id, route: `${alert.origin}-${alert.destination}`, error });
    }
  }

  let notifications = 0;
  const dispatchDate = new Date().toISOString().slice(0, 10);
  for (const [userId, deals] of dealsByUser) {
    try {
      const { data: subscriptions } = await admin.from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", userId);
      if (!subscriptions?.length) continue;
      const { error: dispatchError } = await admin.from("notification_dispatches").insert({ user_id: userId, dispatch_date: dispatchDate });
      if (dispatchError?.code === "23505") continue;
      if (dispatchError) throw dispatchError;
      const results = await Promise.allSettled(subscriptions.map((subscription) => sendDailyDigest({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, deals)));
      notifications += results.filter((result) => result.status === "fulfilled").length;
    } catch (error) { console.error("Daily push failed", { userId, error }); }
  }
  return { scanned: alerts.length, usersWithDeals: dealsByUser.size, notifications };
}