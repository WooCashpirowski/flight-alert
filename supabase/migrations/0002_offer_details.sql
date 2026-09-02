alter table public.alerts
  add column if not exists best_offer_url text,
  add column if not exists best_provider text;
