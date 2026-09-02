# Flight Alert — specyfikacja aktualnego systemu

> Żywa dokumentacja projektu. Stan lokalnego repozytorium na 2 września 2026 r.  
> Zmiany opisane w tym dokumencie trafią na produkcję po wysłaniu bieżącej wersji repozytorium do GitHuba i zakończeniu wdrożenia na Vercelu.

## 1. Cel i zakres

Flight Alert to prywatna, instalowalna aplikacja PWA do monitorowania cen lotów. Użytkownik definiuje trasę, termin, elastyczność dat i maksymalną cenę. Raz dziennie aplikacja sprawdza aktywne alerty, zapisuje najlepszą znalezioną ofertę i wysyła zbiorcze powiadomienie Web Push, jeżeli cena mieści się w limicie.

Najważniejsze założenia:

- interfejs projektowany mobile-first;
- dostęp wyłącznie dla adresów z tabeli `allowed_users`;
- logowanie i rejestracja za pomocą adresu e-mail oraz hasła;
- maksymalnie jedno zbiorcze powiadomienie dziennie na użytkownika;
- kliknięcie powiadomienia otwiera właściwy alert;
- dane użytkowników chronione przez Supabase Row Level Security;
- prosta architektura feature-driven wykorzystująca App Router, RSC i Server Actions.

## 2. Stan wdrożenia

- Repozytorium jest połączone z GitHubem i projektem Vercel.
- Aktualny adres produkcyjny: `https://flight-alert-alpha.vercel.app`.
- Supabase jest skonfigurowany, a migracje `0001_initial.sql` i `0002_offer_details.sql` zostały wykonane.
- Aplikacja została zainstalowana i sprawdzona jako PWA na fizycznym telefonie.
- Rzeczywiste powiadomienie Web Push, ikona, monochromatyczny badge i deep link do alertu zostały potwierdzone manualnie.
- Bieżące poprawki w lokalnym repozytorium wymagają jeszcze commita i pushu, aby trafiły na produkcję.

## 3. Stos technologiczny

| Warstwa | Aktualna technologia |
| --- | --- |
| Framework | Next.js 16.2, App Router, TypeScript |
| UI | React 19, własny CSS z Tailwind CSS 4, Lucide React |
| Font | lokalnie bundlowany Roboto przez `@fontsource/roboto` |
| Lokalizacja | statyczne, typowane słowniki PL podzielone według modułów |
| Formularze | React Hook Form + Zod 4 |
| Baza i uwierzytelnianie | Supabase PostgreSQL, Supabase Auth, RLS |
| Wyszukiwanie lotów | Google Flights przez SerpApi; awaryjnie publiczny endpoint Ryanair |
| Powiadomienia | Web Push API, `web-push`, VAPID, własny service worker |
| Harmonogram | Vercel Cron, `0 7 * * *` |
| Testy | Playwright: mobile, desktop i rzeczywisty smoke test integracyjny |
| Hosting | Vercel |

Projekt nie używa obecnie shadcn/ui. Adapter Amadeus pozostaje w kodzie, ale nie jest podłączony do aktywnej ścieżki wyszukiwania, ponieważ portal self-service został wycofany.

## 4. Uwierzytelnianie i dostęp

### 4.1 Lista dozwolonych użytkowników

Adres musi najpierw znaleźć się w tabeli `public.allowed_users`:

```sql
insert into public.allowed_users (email)
values
  ('pierwszy@example.com'),
  ('drugi@example.com')
on conflict (email) do nothing;
```

Można dodać dowolną liczbę adresów. Porównanie adresów jest wykonywane bez rozróżniania wielkości liter.

### 4.2 Rejestracja i logowanie

- Rejestracja wymaga adresu z `allowed_users` i hasła mającego od 8 do 72 znaków.
- Jeżeli w Supabase włączone jest potwierdzanie adresu, użytkownik otrzymuje wiadomość aktywacyjną, a następnie loguje się ustawionym hasłem.
- Logowanie używa `signInWithPassword`.
- Middleware odświeża sesję, chroni prywatne trasy i dodatkowo sprawdza allowlistę.
- Użytkownik może zmienić lub ustawić hasło w Ustawieniach. Obsługuje to także konta utworzone wcześniej przez magic link.
- Menu profilu pokazuje adres użytkownika i umożliwia wylogowanie.

Magic link nie jest podstawowym sposobem logowania.

### 4.3 Publiczne trasy

- `/login`
- `/auth/callback`
- `/offline`
- `/api/cron/check-flights` — endpoint pozostaje publicznie osiągalny, ale wymaga poprawnego sekretu w nagłówku `Authorization`.

Pozostałe trasy wymagają aktywnej, dozwolonej sesji, jeśli Supabase jest skonfigurowany. Bez konfiguracji Supabase aplikacja uruchamia bezpieczny tryb demonstracyjny UI.

## 5. Alerty cenowe

### 5.1 Formularz

Formularz `/alerts/new` zawiera:

- kod lotniska wylotu, domyślnie `WAW`;
- kod lotniska docelowego, domyślnie `BCN`; obsługiwane jest również `ANY`;
- przycisk zamiany lotniska wylotu i przylotu;
- typ podróży: domyślnie **W obie strony**, opcjonalnie jedna strona;
- datę wylotu, domyślnie 21 dni od bieżącej daty;
- datę powrotu, domyślnie 25 dni od bieżącej daty;
- elastyczność: dokładne daty, ±1, ±2 lub ±3 dni;
- maksymalną cenę w PLN, domyślnie 600 PLN;
- przełącznik aktywności alertu.

React Hook Form i Zod walidują formularz po stronie klienta. Ta sama definicja Zod jest ponownie sprawdzana w Server Action. Dla podróży w obie strony data powrotu jest obowiązkowa i nie może poprzedzać daty wylotu. Cena musi być większa od zera.

Po poprawnym zapisie użytkownik wraca do panelu, gdzie nowy alert jest natychmiast widoczny.

### 5.2 Zarządzanie

Użytkownik może:

- wyświetlić wszystkie, aktywne albo wstrzymane alerty;
- szybko wstrzymać lub wznowić alert z panelu;
- otworzyć szczegóły alertu;
- edytować wszystkie parametry na `/alerts/[id]/edit`;
- usunąć alert po potwierdzeniu.

Każda operacja jest ograniczona do właściciela rekordu zarówno w Server Action, jak i przez RLS.

### 5.3 Szczegóły oferty

Po skanie alert przechowuje:

- `best_price`;
- `best_provider`;
- `best_offer_url`;
- `last_checked_at`.

Widok `/alerts/[id]` pokazuje najlepszą cenę i przycisk prowadzący do strony oferty, obecnie najczęściej do Google Flights. Link jest renderowany tylko wtedy, gdy jest poprawnym adresem HTTP lub HTTPS.

## 6. Wyszukiwanie lotów

Wspólny format oferty:

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

### 6.1 Aktywna kolejność dostawców

1. Jeśli istnieje `SERPAPI_API_KEY`, używany jest wyłącznie `SerpApiProvider`, który pobiera wyniki Google Flights.
2. Jeżeli klucza SerpApi nie ma, używany jest `RyanairProvider` jako awaryjne źródło.

Błąd dostawcy jest logowany i zwraca pustą listę zamiast przerywać cały dzienny skan.

### 6.2 Zakres linii lotniczych

SerpApi nie zwraca ofert jednej konkretnej linii. Udostępnia wyniki Google Flights, więc zestaw przewoźników zależy od trasy i danych widocznych w Google Flights. Wizz Air może pojawić się w wynikach Google Flights, ale aplikacja nie ma osobnego adaptera ani bezpośredniego API Wizz Air.

### 6.3 Elastyczne daty

Dla alertu z elastycznością aplikacja wybiera jeden offset w dozwolonym zakresie na dany dzień i rotuje go między kolejnymi skanami. Nie wykonuje wszystkich kombinacji dat w jednym przebiegu, co ogranicza zużycie zapytań SerpApi.

## 7. Skan dzienny i powiadomienia

### 7.1 Harmonogram

Vercel wywołuje `/api/cron/check-flights` codziennie o `07:00 UTC`.

- w polskim czasie zimowym jest to około 08:00;
- w polskim czasie letnim jest to około 09:00.

Panel oblicza i pokazuje następną godzinę skanu dynamicznie w strefie `Europe/Warsaw`.

Endpoint wymaga nagłówka:

```text
Authorization: Bearer <CRON_SECRET>
```

### 7.2 Przebieg skanu

1. Pobierane są wszystkie aktywne alerty.
2. Każdy alert jest walidowany i wyszukiwany niezależnie.
3. Najlepsza cena, provider, link oraz czas sprawdzenia są zapisywane w bazie.
4. Oferty mieszczące się w limicie są grupowane według użytkownika.
5. Użytkownik z aktywną subskrypcją otrzymuje jedno zbiorcze powiadomienie.

Tabela `notification_dispatches` i unikalność `(user_id, dispatch_date)` zapobiegają wysłaniu więcej niż jednego zbiorczego push dziennie. Jeśli wszystkie próby dostarczenia zakończą się błędem, rezerwacja dzienna jest usuwana, dzięki czemu możliwa jest późniejsza ponowna próba.

### 7.3 Web Push

- Użytkownik aktywuje powiadomienia w PWA po udzieleniu zgody systemowej.
- Istniejąca subskrypcja przeglądarki jest automatycznie synchronizowana z Supabase.
- Po skutecznej aktywacji banner zachęcający do włączenia powiadomień znika zarówno z panelu, jak i Ustawień.
- Powiadomienie używa pełnej ikony `/icons/icon-192.png` oraz monochromatycznego badge `/icons/notification-96.png`.
- Kliknięcie otwiera `/alerts/[id]` i skupia istniejące okno PWA, jeśli to możliwe.
- Maksymalny TTL powiadomienia wynosi 12 godzin.

## 8. PWA i interfejs

- `display: standalone`, orientacja pionowa, ciemny motyw.
- Ikony 192×192, 512×512, maskable 512×512 i Apple Touch Icon.
- Własna ikona Flight Alert jest używana w nagłówku, instalacji PWA i powiadomieniach.
- Service worker buforuje ekran offline oraz zasoby ikon.
- Service worker buforuje również własny mały słownik komunikatów powiadomień.
- Dla nieudanej nawigacji sieciowej pokazywana jest strona `/offline`.
- Układ jest mobile-first, z dolną nawigacją zoptymalizowaną dla telefonu.
- UI używa Roboto, własnego ciemnego systemu wizualnego i ikon Lucide.
- Linki Next.js korzystają z prefetchingu, formularz prefetchuje trasę docelową, a dynamiczne przejścia mają ekran ładowania. Po przekierowaniu nie jest wykonywane zbędne podwójne odświeżenie.

## 9. Model danych

### `allowed_users`

- `email` — klucz główny;
- `created_at`.

### `alerts`

- identyfikator i `user_id` z kaskadowym usuwaniem po usunięciu konta;
- trasa, typ podróży, daty i elastyczność;
- limit ceny i stan aktywności;
- najlepsza cena, provider, link do oferty i czas ostatniego skanu;
- czas utworzenia.

### `push_subscriptions`

- właściciel subskrypcji;
- endpoint Push API;
- klucze `p256dh` i `auth`;
- unikalna para `(user_id, endpoint)`.

### `notification_dispatches`

- użytkownik i data wysyłki;
- unikalna para `(user_id, dispatch_date)`.

RLS jest włączone dla wszystkich czterech tabel. Użytkownicy mogą odczytywać własny wpis allowlisty i wykonywać operacje wyłącznie na swoich alertach oraz subskrypcjach. Skan cron korzysta z klucza service role po stronie serwera.

## 10. Struktura projektu

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
└── manifest.ts

src/modules/
├── alerts/               # schematy, zapytania, Server Actions i UI alertów
├── auth/                 # logowanie, rejestracja, hasło, guard i profil
├── flight-search/        # wspólny serwis i adaptery dostawców
├── notifications/        # skan dzienny, Web Push i banner aktywacji
└── pwa/                  # rejestracja service workera

src/shared/lib/
├── supabase/             # klienci browser, server i admin
├── i18n/                 # konfiguracja locale, strefy czasowej i waluty
├── env.ts
└── utils.ts

src/translations/pl/      # typowane słowniki aplikacji, alertów, auth i powiadomień

public/                   # service worker, ikony i grafika Open Graph
supabase/migrations/      # migracje 0001 i 0002
tests/                    # testy Playwright
scripts/                  # generator ikon i rzeczywisty smoke test
```

## 11. Zmienne środowiskowe

### Publiczne

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

### Wyłącznie serwerowe

- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `CRON_SECRET`
- `SERPAPI_API_KEY`

Klucza service role, prywatnego VAPID, sekretu cron ani klucza SerpApi nie wolno umieszczać w zmiennej `NEXT_PUBLIC_*`, logach, kodzie klienta ani repozytorium.

### Testy rzeczywiste

Plik `.env.test.local`, który nie trafia do repozytorium, zawiera:

- `TEST_USERNAME`
- `TEST_PASSWORD`

Konto testowe musi istnieć zarówno w Supabase Auth, jak i `allowed_users`.

## 12. Konfiguracja produkcyjna

Na Vercelu należy ustawić wszystkie zmienne z sekcji 11 dla środowiska Production. `NEXT_PUBLIC_SITE_URL` powinien wskazywać kanoniczny adres wdrożenia bez końcowego ukośnika.

W Supabase Authentication → URL Configuration:

- Site URL powinien wskazywać adres produkcyjny;
- Redirect URLs powinny zawierać `https://flight-alert-alpha.vercel.app/auth/callback`;
- lokalny callback `http://localhost:3000/auth/callback` może pozostać do developmentu.

Po zmianie publicznych zmiennych środowiskowych lub ikon potrzebny jest nowy deployment Vercel. Zainstalowana PWA aktualizuje service worker po ponownym otwarciu aplikacji.

## 13. Testowanie i kryteria odbioru

Polecenia:

```bash
pnpm lint
pnpm build
pnpm e2e
pnpm e2emobile
pnpm e2elive
```

`pnpm e2elive` loguje się prawdziwym kontem testowym, sprawdza uwierzytelnianie, tworzy alert, uruchamia rzeczywisty skan SerpApi, sprawdza zapis ceny i linku oferty, edytuje oraz przełącza alert, testuje PWA i sprząta utworzone dane. Hasło testowe jest przywracane w bloku końcowym.

Ostatnia weryfikacja bieżącego repozytorium:

- lint: zaliczony;
- produkcyjny build Next.js: zaliczony;
- Playwright mobile: 5/5 testów zaliczonych;
- live smoke: 11 zaliczonych, 0 błędów, 1 punkt zablokowany przez ograniczenie Web Push w headless Chromium;
- fizyczne dostarczenie i otwarcie Web Push: potwierdzone manualnie;
- migracja `0002_offer_details.sql`: potwierdzona w Supabase;
- dane utworzone przez test live: usunięte.

## 14. Znane ograniczenia

- Bezpośrednia integracja Wizz Air nie istnieje; oferty tej linii zależą od obecności w Google Flights.
- Publiczny endpoint Ryanair może się zmienić lub blokować automatyczne zapytania.
- SerpApi podlega limitowi zapytań przypisanemu do konta.
- Adapter Amadeus nie jest używany w aktywnej konfiguracji.
- Test dostarczenia Web Push wymaga fizycznej przeglądarki lub zainstalowanej PWA; headless Chromium nie zapewnia prawdziwego endpointu push.
- Elastyczne daty są rotowane między skanami, a nie przeszukiwane wyczerpująco w jednym uruchomieniu.
- Ostrzeżenie Next.js o przestarzałej konwencji `middleware.ts` nie blokuje kompilacji, ale plik powinien zostać w przyszłości zmigrowany do konwencji `proxy.ts`.

## 15. Zasady dalszego rozwoju

- Zachować architekturę feature-driven oraz RSC/Server Actions.
- Nie omijać RLS ani kontroli właściciela w operacjach zapisu.
- Każdą odpowiedź z zewnętrznego API walidować schematem Zod.
- Awaria pojedynczego alertu lub dostawcy nie może przerwać całego skanu.
- Nowe funkcje projektować najpierw dla telefonu i weryfikować w projekcie Playwright `mobile-chromium`.
- Zmiany modelu danych dodawać jako kolejne, idempotentne migracje SQL.
- Nie zapisywać sekretów ani danych logowania w repozytorium.
