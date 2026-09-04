# Flight Alert — current system specification

## 1. Purpose and scope

Flight Alert is a private, installable PWA for monitoring flight prices. The user defines a route, travel dates, date flexibility, and a maximum price. Once a day, the application checks active alerts, saves the best offer found, and sends a consolidated Web Push notification if the price is within the limit.

Key principles:

- a mobile-first interface;
- access restricted to email addresses in the `allowed_users` table;
- login and registration using an email address and password;
- at most one consolidated notification per user per day;
- clicking a notification opens the relevant alert;
- user data protected by Supabase Row Level Security;
- a simple feature-driven architecture using App Router, RSC, and Server Actions.

## 2. Deployment status

- The repository is connected to GitHub and a Vercel project.
- Current production URL: `https://flight-alert-alpha.vercel.app`.
- Supabase is configured, and migrations `0001_initial.sql` and `0002_offer_details.sql` have been applied.
- The application has been installed and tested as a PWA on a physical phone.
- Actual Web Push delivery, the icon, the monochrome badge, and the deep link to an alert have been verified manually.
- The current changes in the local repository still need to be committed and pushed to reach production.

## 3. Technology stack

| Layer                   | Current technology                                                               |
| ----------------------- | -------------------------------------------------------------------------------- |
| Framework               | Next.js 16.2, App Router, TypeScript                                              |
| UI                      | React 19, layered custom CSS with Tailwind CSS 4, Lucide React, selective GSAP use  |
| Font                    | Locally bundled Outfit Variable via `@fontsource-variable/outfit`                  |
| Localization            | Static, typed Polish dictionaries organized by module                            |
| Forms                   | React Hook Form + Zod 4                                                          |
| Database and auth       | Supabase PostgreSQL, Supabase Auth, RLS                                           |
| Flight search           | Google Flights via SerpApi; the public Ryanair endpoint as a fallback             |
| Notifications           | Web Push API, `web-push`, VAPID, custom service worker                             |
| Scheduling              | Vercel Cron, `0 7 * * *`                                                          |
| Tests                   | Playwright: mobile, desktop, and a live integration smoke test                     |
| Hosting                 | Vercel                                                                           |

The project does not currently use shadcn/ui. The Amadeus adapter remains in the codebase but is not connected to the active search flow because the self-service portal has been discontinued.

## 4. Authentication and access

### 4.1 Allowed users

An email address must first be added to the `public.allowed_users` table:

```sql
insert into public.allowed_users (email)
values
  ('pierwszy@example.com'),
  ('drugi@example.com')
on conflict (email) do nothing;
```

Any number of email addresses can be added. Email address comparisons are case-insensitive.

### 4.2 Registration and login

- Registration requires an email address from `allowed_users` and a password between 8 and 72 characters long.
- If email confirmation is enabled in Supabase, the user receives an activation email and then logs in with the password they set.
- Login uses `signInWithPassword`.
- Middleware refreshes the session, protects private routes, and also checks the allowlist.
- The user can change or set a password in Settings. This also supports accounts previously created through a magic link.
- The profile menu shows the user's email address and provides a logout option.

Magic links are not the primary login method.

### 4.3 Public routes

- `/login`
- `/auth/callback`
- `/offline`
- `/api/cron/check-flights` — the endpoint remains publicly reachable but requires a valid secret in the `Authorization` header.

All other routes require an active, allowlisted session when Supabase is configured. Without Supabase configuration, the application runs in a safe UI demo mode.

## 5. Price alerts

### 5.1 Form

The `/alerts/new` form includes:

- a searchable departure airport, defaulting to `Warszawa (WAW)` (Warsaw);
- a searchable destination airport, defaulting to `Barcelona (BCN)`; `ANY` is also supported;
- a button to swap the departure and arrival airports;
- trip type: **Round trip** by default (the Polish UI label is **W obie strony**), with one-way travel as an option;
- a departure date, defaulting to 21 days from the current date;
- a return date, defaulting to 25 days from the current date;
- flexibility: exact dates, ±1, ±2, or ±3 days;
- a maximum price in PLN, defaulting to PLN 600;
- a toggle to enable or disable the alert.

React Hook Form and Zod validate the form on the client. The same Zod schema is checked again in the Server Action. For round trips, a return date is required and cannot precede the departure date. The price must be greater than zero.

Airport fields use a custom accessible combobox. Search supports IATA codes, cities, airport names, countries, and aliases, ignoring case and Polish diacritics. The selected value is displayed as `Miasto (IATA)` (City (IATA)), while the form and database continue to store only the three-letter code. A code that is not in the catalog can be explicitly confirmed as a manual value.

The global catalog is stored as a generated snapshot in the repository. The full catalog is sent to the browser only on the form page; the dashboard reads it on the server and passes only the labels for airports used in alerts. It includes airports with IATA codes and scheduled service from the public OurAirports dataset. Country names are localized into Polish, and the existing Polish names of popular airports are preserved as labels and aliases. The production airport search does not query an external API. The snapshot can be refreshed with `pnpm airports`.

After a successful save, the user returns to the dashboard, where the new alert is immediately visible.

### 5.2 Management

The user can:

- view all, active, or paused alerts;
- quickly pause or resume an alert from the dashboard;
- open alert details;
- edit all parameters at `/alerts/[id]/edit`;
- delete an alert after confirmation.

Every operation is restricted to the record owner, both in the Server Action and through RLS.

### 5.3 Offer details

After a scan, the alert stores:

- `best_price`;
- `best_provider`;
- `best_offer_url`;
- `last_checked_at`.

The `/alerts/[id]` view shows the best price and a button linking to the offer page, currently most often Google Flights. The link is rendered only if it is a valid HTTP or HTTPS URL.

## 6. Flight search

Shared offer format:

```ts
export interface FlightOffer {
    provider: string;
    origin: string;
    destination: string;
    price: number;
    currency: string;
    departureDate: string;
    returnDate?: string;
    bookingUrl: string;
}
```

### 6.1 Active provider selection order

1. If `SERPAPI_API_KEY` is present, only `SerpApiProvider` is used to retrieve Google Flights results.
2. If the SerpApi key is missing, `RyanairProvider` is used as a fallback source.

A provider error is logged and results in an empty list instead of interrupting the entire daily scan.

### 6.2 Airline coverage

SerpApi does not return offers from just one specific airline. It provides Google Flights results, so the set of carriers depends on the route and the data available in Google Flights. Wizz Air may appear in Google Flights results, but the application has no separate Wizz Air adapter or direct Wizz Air API integration.

### 6.3 Flexible dates

For an alert with date flexibility, the application selects one offset within the allowed range for a given day and rotates it across successive scans. It does not check every date combination in a single run, which limits SerpApi request usage.

## 7. Daily scan and notifications

### 7.1 Schedule

Vercel calls `/api/cron/check-flights` daily at `07:00 UTC`.

- In Poland's standard time, this is approximately 08:00.
- In Poland's daylight saving time, this is approximately 09:00.

The dashboard dynamically calculates and displays the next scan time in the `Europe/Warsaw` time zone.

The endpoint requires this header:

```text
Authorization: Bearer <CRON_SECRET>
```

### 7.2 Scan flow

1. All active alerts are retrieved.
2. Each alert is validated and searched independently.
3. The best price, provider, link, and check timestamp are saved to the database.
4. Offers within the price limit are grouped by user.
5. A user with an active subscription receives one consolidated notification.

The `notification_dispatches` table and the uniqueness constraint on `(user_id, dispatch_date)` prevent more than one consolidated push notification from being sent per day. If all delivery attempts fail, the daily reservation is removed so that a later retry is possible.

### 7.3 Web Push

- The user enables notifications in the PWA after granting system permission.
- An existing browser subscription is automatically synchronized with Supabase.
- After successful activation, the banner prompting the user to enable notifications disappears from the dashboard, while Settings retains an unobtrusive status confirming activation.
- The notification uses the full icon at `/icons/icon-192.png` and the monochrome badge at `/icons/notification-96.png`.
- Clicking opens `/alerts/[id]` and focuses an existing PWA window when possible.
- The maximum notification TTL is 12 hours.

## 8. PWA and interface

- `display: standalone`, portrait orientation, dark theme.
- Icons: 192×192, 512×512, maskable 512×512, and Apple Touch Icon.
- The custom Flight Alert icon is used in the header, PWA installation, and notifications.
- The service worker caches the offline screen and icon assets.
- The service worker also caches its own small dictionary of notification messages.
- Failed network navigation displays the `/offline` page.
- The layout is mobile-first, with bottom navigation optimized for phones and a prominent central action for adding an alert.
- The desktop dashboard uses a 5/7 editorial split: a pinned summary on the left and a scrolling alert list on the right. On phones, the first alert begins within the initial viewport.
- Alerts have always-visible filters labeled `Wszystkie` (All), `Aktywne` (Active), and `Wstrzymane` (Paused), a clear route → dates → price hierarchy, and distinct active and paused states.
- Route headings on dashboard cards show a caption beneath each IATA code in the form `(Miasto, lotnisko)` (meaning “City, airport”), wrapping within the width of the code. A green airplane pointing horizontally to the right is centered in the heading at the level of the codes. `ANY` has the caption `(Dowolne miejsce)` (Anywhere), while manual codes without a catalog entry use `(Kod IATA spoza katalogu)` (IATA code not in the catalog).
- The UI uses Outfit Variable, a single mint accent, dark surfaces with a limited number of borders, and Lucide icons.
- Forms are built as a continuous surface with separators, natively accessible fields, a custom toggle, and a sticky primary action on phones.
- Route fields are stacked vertically on phones and use a combobox that supports mouse, touch, and keyboard input; on larger screens, they return to a horizontal layout.
- All key interactive elements have a visible `focus-visible` state; the login tabs and delete dialog support keyboard input, and the interface does not block page zoom.
- GSAP is used only on the desktop dashboard to pin the summary and provide subtle card entrance animations. `prefers-reduced-motion` disables animations, while phones retain a static, lightweight rendering path.
- Styles are separated into foundations, dashboard, forms, and authentication in `src/styles/`.
- Next.js links use prefetching, the form prefetches its destination route, and dynamic transitions have a loading screen. No unnecessary double refresh is performed after a redirect.

## 9. Data model

### `allowed_users`

- `email` — primary key;
- `created_at`.

### `alerts`

- an identifier and `user_id`, with cascading deletion when the account is deleted;
- route, trip type, dates, and flexibility;
- price limit and active state;
- best price, provider, offer link, and last scan timestamp;
- creation timestamp.

### `push_subscriptions`

- subscription owner;
- Push API endpoint;
- `p256dh` and `auth` keys;
- unique pair `(user_id, endpoint)`.

### `notification_dispatches`

- user and dispatch date;
- unique pair `(user_id, dispatch_date)`.

RLS is enabled for all four tables. Users can read their own allowlist entry and perform operations only on their own alerts and subscriptions. The cron scan uses the service role key on the server.

## 10. Project structure

```text
app/
├── (auth)/login/
├── (dashboard)/
│   ├── alerts/new/
│   ├── alerts/[id]/
│   ├── alerts/[id]/edit/
│   ├── settings/
│   ├── loading.tsx
│   └── page.tsx
├── api/cron/check-flights/
├── api/push/subscription/
├── auth/callback/
├── offline/
├── layout.tsx
├── not-found.tsx
└── manifest.ts

src/modules/
├── alerts/               # schemas, airport catalog, search, Server Actions, and alert UI
├── auth/                 # login, registration, password, guard, and profile
├── flight-search/        # shared service and provider adapters
├── notifications/        # daily scan, Web Push, and activation banner
└── pwa/                  # service worker registration

src/shared/lib/
├── supabase/             # browser, server, and admin clients
├── i18n/                 # locale, time zone, and currency configuration
├── env.ts
└── utils.ts

src/translations/pl/      # typed dictionaries for the app, alerts, auth, and notifications
src/styles/               # visual foundations and dashboard, form, and auth styles

public/                   # service worker, icons, and Open Graph image
supabase/migrations/      # migrations 0001 and 0002
tests/                    # Playwright tests
scripts/                  # airport catalog and icon generators, and the live smoke test
```

## 11. Environment variables

### Public

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

### Server-only

- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `CRON_SECRET`
- `SERPAPI_API_KEY`

The service role key, private VAPID key, cron secret, and SerpApi key must never be placed in a `NEXT_PUBLIC_*` variable, logs, client code, or the repository.

### Live tests

The `.env.test.local` file, which is not committed to the repository, contains:

- `TEST_USERNAME`
- `TEST_PASSWORD`

The test account must exist in both Supabase Auth and `allowed_users`.

## 12. Production configuration

All variables from section 11 must be configured for the Production environment in Vercel. `NEXT_PUBLIC_SITE_URL` should point to the canonical deployment URL without a trailing slash.

In Supabase Authentication → URL Configuration:

- Site URL should point to the production URL;
- Redirect URLs should include `https://flight-alert-alpha.vercel.app/auth/callback`;
- the local callback `http://localhost:3000/auth/callback` can remain for development.

A new Vercel deployment is required after changing public environment variables or icons. The installed PWA updates its service worker when the application is reopened.

## 13. Testing and acceptance criteria

Commands:

```bash
pnpm lint
pnpm build
pnpm e2e
pnpm e2emobile
pnpm e2elive
```

The `pnpm airports` command refreshes the committed airport catalog from OurAirports and does not run during builds or in production.

`pnpm build` and Playwright tests must run sequentially: Next.js and Vinext, which is used by the tests, generate route types in the same `.next/types` directory.

`pnpm e2elive` logs in with a real test account, checks authentication, creates an alert, runs a real SerpApi scan, verifies that the price and offer link were saved, edits and toggles the alert, tests the PWA, and cleans up the data it created. The test password is restored in the final cleanup block.

Most recent verification of the current repository:

- lint: passed;
- production Next.js build: passed;
- Playwright mobile: 7/7 tests passed;
- Playwright mobile + desktop: 14/14 tests passed, including airport search by city and country, manual IATA codes, keyboard and delete dialog support, zoom, and reduced motion;
- alert card headings: airport captions, width constrained to the IATA code, and a centered green airplane verified at viewport widths of 320, 412, and 1440 px; no horizontal overflow;
- live smoke: 11 passed, 0 errors, 1 check blocked by the Web Push limitation in headless Chromium;
- actual Web Push delivery and opening: verified manually;
- migration `0002_offer_details.sql`: confirmed in Supabase;
- data created by the live test: deleted.

## 14. Known limitations

- There is no direct Wizz Air integration; offers from this airline depend on their availability in Google Flights.
- The public Ryanair endpoint may change or block automated requests.
- SerpApi is subject to the account's request quota.
- The Amadeus adapter is not used in the active configuration.
- Testing Web Push delivery requires a browser on a physical device or an installed PWA; headless Chromium does not provide a real push endpoint.
- Flexible dates are rotated across scans rather than searched exhaustively in a single run.
- The airport catalog is a manually updated snapshot. An airport with scheduled service that is not yet in the catalog can still be entered by explicitly confirming its IATA code.
- The Next.js warning about the deprecated `middleware.ts` convention does not block compilation, but the file should be migrated to the `proxy.ts` convention in the future.

## 15. Guidelines for further development

- Preserve the feature-driven architecture and RSC/Server Actions.
- Do not bypass RLS or ownership checks in write operations.
- Validate every external API response with a Zod schema.
- Failure of a single alert or provider must not interrupt the entire scan.
- Design new features for phones first and verify them in the Playwright `mobile-chromium` project.
- Add data model changes as subsequent, idempotent SQL migrations.
- Do not store secrets or login credentials in the repository.
