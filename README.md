# Flight Alert

Mobile-first PWA do prywatnego monitorowania cen lotów. Aplikacja używa Next.js App Router, Supabase Auth/PostgreSQL z RLS, danych ofertowych Google Flights przez SerpApi z awaryjnym połączeniem Ryanair, Web Push i jednego dziennego skanu.

## Start lokalny

1. Skopiuj `.env.example` do `.env.local` i uzupełnij wartości opisane niżej.
2. Uruchom kolejno wszystkie migracje z `supabase/migrations` w Supabase SQL Editor.
3. Dodaj własny adres do `allowed_users`, np. `insert into public.allowed_users(email) values ('ty@example.com');`. Ten adres może następnie utworzyć konto z hasłem na stronie `/login`.
4. Uruchom `pnpm dev`.

Bez zmiennych Supabase interfejs działa w bezpiecznym trybie demo, dzięki czemu można rozwijać i testować UI bez zewnętrznych usług.

## Skąd wziąć zmienne

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` i `SUPABASE_SERVICE_ROLE_KEY`: utwórz projekt na supabase.com, a następnie przejdź do **Project Settings → API**. Klucza service role nigdy nie umieszczaj w zmiennej publicznej ani w repozytorium.
- W **Authentication → URL Configuration** dodaj `http://localhost:3000/auth/callback` oraz późniejszy adres produkcyjny do dozwolonych przekierowań.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` i `VAPID_PRIVATE_KEY`: wygeneruj poleceniem `pnpm exec web-push generate-vapid-keys`. `VAPID_SUBJECT` ustaw na kontakt administratora w formie `mailto:adres@example.com`.
- `CRON_SECRET`: wygeneruj losową wartość o długości co najmniej 32 bajtów i dodaj ją również jako sekret środowiskowy platformy wdrożeniowej. Vercel Cron wysyła ją jako `Authorization: Bearer ...`.
- `SERPAPI_API_KEY`: utwórz konto w SerpApi, skopiuj klucz z dashboardu i zachowaj go wyłącznie po stronie serwera. Bez klucza aplikacja podejmie próbę użycia endpointu Ryanair, który może odrzucać automatyczne zapytania.

## Harmonogram

`vercel.json` uruchamia `/api/cron/check-flights` codziennie o 07:00 UTC. Endpoint jest chroniony `CRON_SECRET`. Unikalny indeks `(user_id, dispatch_date)` zapewnia maksymalnie jeden zbiorczy push dziennie na użytkownika.

## Testy

- `pnpm e2e` — Playwright na widoku Pixel 7 i desktopowym Chromium.
- `pnpm e2emobile` — pełny przebieg Playwright tylko w widoku mobilnym.
- `pnpm e2elive` — test integracyjny na prawdziwym koncie z `.env.test.local`; tworzy alert, uruchamia skan i sprząta utworzone dane.
- `pnpm build` — produkcyjna kompilacja.
