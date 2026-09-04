import { chromium, devices, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { chooseCalendarDay } from './calendar-test-helpers.mjs';

const baseUrl = (process.env.LIVE_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
);
const username = process.env.TEST_USERNAME;
const password = process.env.TEST_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;

const required = {
    TEST_USERNAME: username,
    TEST_PASSWORD: password,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    CRON_SECRET: cronSecret,
};
const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);
if (missing.length)
    throw new Error(`Missing test configuration: ${missing.join(', ')}`);

const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});
const anonymous = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});
const listedUsers = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
});
if (listedUsers.error) throw listedUsers.error;
const testUser = listedUsers.data.users.find(
    (user) => user.email?.toLowerCase() === username.toLowerCase(),
);
if (!testUser) throw new Error('Test user does not exist in Supabase Auth.');

const baselineSubscriptions = new Set(
    (
        await admin
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', testUser.id)
    ).data?.map((item) => item.id) ?? [],
);
const baselineDispatches = new Set(
    (
        await admin
            .from('notification_dispatches')
            .select('id')
            .eq('user_id', testUser.id)
    ).data?.map((item) => item.id) ?? [],
);
const results = [];
const createdAlertIds = new Set();
const temporaryPassword = `FlightAlert-${crypto.randomUUID()}-Aa1!`;
let browser;
let context;
let page;

class BlockedError extends Error {}

function cleanError(error) {
    let message = error instanceof Error ? error.message : String(error);
    for (const secret of [
        username,
        password,
        temporaryPassword,
        serviceRoleKey,
        cronSecret,
    ]) {
        if (secret) message = message.replaceAll(secret, '[redacted]');
    }
    return message.split('\n').slice(0, 4).join(' ');
}

async function check(name, action) {
    const startedAt = Date.now();
    try {
        const details = await action();
        results.push({
            name,
            status: 'passed',
            durationMs: Date.now() - startedAt,
            details: details ?? null,
        });
        return details;
    } catch (error) {
        results.push({
            name,
            status: error instanceof BlockedError ? 'blocked' : 'failed',
            durationMs: Date.now() - startedAt,
            error: cleanError(error),
        });
        return null;
    }
}

function dateAfter(days) {
    const value = new Date();
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
}

async function login(currentPassword = password) {
    await context.clearCookies();
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel('Adres e-mail').fill(username);
    await page.getByLabel('Hasło', { exact: true }).fill(currentPassword);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await expect(page).toHaveURL(`${baseUrl}/`, { timeout: 15_000 });
    await expect(
        page.getByRole('heading', { name: /Dzień dobry/ }),
    ).toBeVisible();
}

try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
        ...devices['Pixel 7'],
        serviceWorkers: 'allow',
    });
    await context.grantPermissions(['notifications'], { origin: baseUrl });
    page = await context.newPage();
    page.setDefaultTimeout(15_000);

    await check('Niepoprawne hasło jest odrzucane', async () => {
        await context.clearCookies();
        await page.goto(`${baseUrl}/login`);
        await page.getByLabel('Adres e-mail').fill(username);
        await page
            .getByLabel('Hasło', { exact: true })
            .fill('Definitely-wrong-password-123!');
        await page.getByRole('button', { name: 'Zaloguj się' }).click();
        await expect(page.getByRole('status')).toContainText(
            'Nieprawidłowy e-mail lub hasło',
        );
    });

    await check('Rejestracja spoza allowed_users jest odrzucana', async () => {
        await context.clearCookies();
        await page.goto(`${baseUrl}/login`);
        await page.getByRole('tab', { name: 'Rejestracja' }).click();
        await page
            .getByLabel('Adres e-mail')
            .fill(`not-allowed-${Date.now()}@example.com`);
        await page
            .getByLabel('Hasło', { exact: true })
            .fill('NotAllowed-Aa1!234');
        await page.getByLabel('Powtórz hasło').fill('NotAllowed-Aa1!234');
        await page.getByRole('button', { name: 'Utwórz konto' }).click();
        await expect(page.getByRole('status')).toContainText(
            'nie znajduje się na liście dostępu',
        );
    });

    await check(
        'Logowanie, trwałość sesji, wylogowanie i ochrona trasy',
        async () => {
            await login();
            await page.reload();
            await expect(
                page.getByRole('heading', { name: /Dzień dobry/ }),
            ).toBeVisible();
            await page.getByRole('button', { name: 'Otwórz profil' }).click();
            await page.getByRole('button', { name: 'Wyloguj się' }).click();
            await expect(page).toHaveURL(`${baseUrl}/login`);
            await page.goto(`${baseUrl}/alerts/new`);
            await expect(page).toHaveURL(/\/login\?next=%2Falerts%2Fnew$/);
        },
    );

    await check(
        'Ustawienie nowego hasła i przywrócenie hasła testowego',
        async () => {
            await login();
            await page.goto(`${baseUrl}/settings`);
            await page.getByLabel('Nowe hasło').fill(temporaryPassword);
            await page.getByLabel('Powtórz hasło').fill(temporaryPassword);
            await page.getByRole('button', { name: 'Zapisz hasło' }).click();
            await expect(page.getByRole('status')).toContainText(
                'Hasło zostało zapisane',
            );
            await login(temporaryPassword);
            await page.goto(`${baseUrl}/settings`);
            await page.getByLabel('Nowe hasło').fill(password);
            await page.getByLabel('Powtórz hasło').fill(password);
            await page.getByRole('button', { name: 'Zapisz hasło' }).click();
            await expect(page.getByRole('status')).toContainText(
                'Hasło zostało zapisane',
            );
        },
    );

    await check('Walidacja i rzeczywisty zapis alertu', async () => {
        await login();
        await page.goto(`${baseUrl}/alerts/new`);
        const roundTrip = page.getByRole('radio', { name: /W obie strony/ });
        await expect(roundTrip).toBeChecked();
        await roundTrip.click();
        await page.getByLabel('Elastyczność dat').selectOption('3');
        const origin = page.getByRole('combobox', { name: 'Wylot', exact: true });
        const destination = page.getByRole('combobox', { name: 'Przylot', exact: true });
        await page.getByRole('button', { name: 'Zamień lotniska' }).click();
        await expect(origin).toHaveValue('Barcelona (BCN)');
        await expect(destination).toHaveValue('Warszawa (WAW)');
        await page.getByRole('button', { name: 'Zamień lotniska' }).click();
        const price = page.getByRole('spinbutton', { name: /Maksymalna cena/ });
        await price.fill('0');
        await page.getByRole('button', { name: 'Zapisz alert' }).click();
        await expect(
            page
                .getByRole('status')
                .filter({ hasText: 'Cena musi być większa od 0' }),
        ).toBeVisible();

        await expect(origin).toHaveValue('Warszawa (WAW)');
        await expect(destination).toHaveValue('Barcelona (BCN)');
        await page.getByLabel('Daty wylotu i powrotu').click();
        await chooseCalendarDay(page, dateAfter(35));
        await chooseCalendarDay(page, dateAfter(39));
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await price.fill('9999');
        await page.getByRole('button', { name: 'Zapisz alert' }).click();
        try {
            await expect(page).toHaveURL(`${baseUrl}/`, { timeout: 10_000 });
        } catch (error) {
            const feedback = await page
                .locator('.form-message, .field-error')
                .allTextContents();
            throw new Error(
                `${error instanceof Error ? error.message : String(error)} UI feedback: ${feedback.join(' | ') || 'none'}`,
            );
        }

        const card = page
            .locator('article')
            .filter({ hasText: 'WAW → BCN' })
            .first();
        await expect(card).toBeVisible();
        await expect(card).toContainText('Aktywny');
        const detailsHref = await card
            .getByRole('link', { name: /Szczegóły/ })
            .getAttribute('href');
        if (!detailsHref)
            throw new Error('Created alert does not expose a details URL.');
        const alertId = detailsHref.split('/').at(-1);
        if (!alertId) throw new Error('Could not resolve created alert id.');
        createdAlertIds.add(alertId);
        await page.goto(`${baseUrl}${detailsHref}`);
        await expect(
            page.getByRole('heading', { name: 'WAW → BCN' }),
        ).toBeVisible();
        await expect(page.getByText('Limit 9999 zł')).toBeVisible();
        return { alertId };
    });

    await check('RLS ukrywa alerty przed niezalogowanym klientem', async () => {
        const response = await anonymous.from('alerts').select('id');
        if (response.error) throw response.error;
        expect(response.data).toEqual([]);
    });

    await check(
        'Rejestracja service workera i subskrypcja Web Push',
        async () => {
            await login();
            await page.goto(`${baseUrl}/`);
            await page.evaluate(async () => {
                await navigator.serviceWorker.ready;
            });
            if (
                !(await page.evaluate(() =>
                    Boolean(navigator.serviceWorker.controller),
                ))
            )
                await page.reload();
            await page.getByRole('button', { name: 'Włącz' }).click();
            const banner = page.locator('.push-banner');
            await page
                .waitForFunction(
                    () => {
                        const text =
                            document.querySelector('.push-banner')
                                ?.textContent ?? '';
                        return /Powiadomienia są aktywne|Nie udało się|push service|Zezwolenie|obsługuje Web Push/i.test(
                            text,
                        );
                    },
                    undefined,
                    { timeout: 15_000 },
                )
                .catch(() => {});
            const text = (await banner.innerText()).replace(/\s+/g, ' ').trim();
            if (!text.includes('Powiadomienia są aktywne')) {
                const loading = await page
                    .getByRole('button', { name: 'Włącz' })
                    .isDisabled()
                    .catch(() => false);
                if (loading)
                    throw new BlockedError(
                        'Headless Chromium did not obtain a Web Push endpoint; a physical installed PWA is required for the delivery test.',
                    );
                if (/permission denied/i.test(text))
                    throw new BlockedError(
                        'Headless Chromium refused the push service endpoint; a physical installed PWA is required for the delivery test.',
                    );
                throw new Error(`Push subscription was not activated: ${text}`);
            }
            const subscriptions = await admin
                .from('push_subscriptions')
                .select('id')
                .eq('user_id', testUser.id);
            if (subscriptions.error) throw subscriptions.error;
            if (!subscriptions.data?.length)
                throw new Error('Push subscription is missing in Supabase.');
            return { storedSubscriptions: subscriptions.data.length };
        },
    );

    await check('Cron odrzuca żądanie bez sekretu', async () => {
        const response = await fetch(`${baseUrl}/api/cron/check-flights`);
        expect(response.status).toBe(401);
    });

    await check('Rzeczywisty skan SerpApi i zapis ceny', async () => {
        if (!createdAlertIds.size)
            throw new Error('No test alert is available for the scan.');
        const activeAlerts = await admin
            .from('alerts')
            .select('id,user_id')
            .eq('active', true);
        if (activeAlerts.error) throw activeAlerts.error;
        const foreignAlerts = activeAlerts.data.filter(
            (alert) => alert.user_id !== testUser.id,
        );
        if (foreignAlerts.length)
            throw new Error(
                'Scan aborted because another user has an active alert.',
            );

        const response = await fetch(`${baseUrl}/api/cron/check-flights`, {
            headers: { authorization: `Bearer ${cronSecret}` },
        });
        const result = await response.json();
        if (!response.ok || !result.ok)
            throw new Error(`Cron returned HTTP ${response.status}`);
        const alertId = [...createdAlertIds][0];
        const alert = await admin
            .from('alerts')
            .select('last_checked_at,best_price')
            .eq('id', alertId)
            .single();
        if (alert.error) throw alert.error;
        if (!alert.data.last_checked_at)
            throw new Error('Cron did not update last_checked_at.');
        if (alert.data.best_price === null)
            throw new Error(
                'SerpApi returned no flight price for the test route.',
            );
        if (result.usersWithDeals < 1)
            throw new Error(
                'The high-price test alert did not produce a matching deal.',
            );
        await login();
        await page.goto(`${baseUrl}/alerts/${alertId}`);
        await expect(
            page.getByRole('link', { name: /Google Flights|Sprawdź ofertę/ }),
        ).toBeVisible();
        return {
            scanned: result.scanned,
            usersWithDeals: result.usersWithDeals,
            notificationsAccepted: result.notifications,
            bestPriceStored: Number(alert.data.best_price),
        };
    });

    await check('Edycja, wstrzymanie i wznowienie alertu', async () => {
        if (!createdAlertIds.size)
            throw new Error('No test alert is available for CRUD.');
        const alertId = [...createdAlertIds][0];
        await login();
        await page.goto(`${baseUrl}/alerts/${alertId}/edit`);
        await page
            .getByRole('spinbutton', { name: /Maksymalna cena/ })
            .fill('9998');
        await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
        await expect(page).toHaveURL(`${baseUrl}/alerts/${alertId}`);
        await expect(page.getByText('Limit 9998 zł')).toBeVisible();
        await page.getByRole('button', { name: 'Wstrzymaj alert' }).click();
        await expect(page.getByRole('status')).toContainText('wstrzymany');
        await page.reload();
        await expect(
            page.getByRole('button', { name: 'Wznów alert' }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Wznów alert' }).click();
        await expect(page.getByRole('status')).toContainText('włączony');
    });

    await check('Manifest, ikony PWA, badge i service worker', async () => {
        const [manifestResponse, workerResponse, iconResponse, badgeResponse] =
            await Promise.all([
                fetch(`${baseUrl}/manifest.webmanifest`),
                fetch(`${baseUrl}/sw.js`),
                fetch(`${baseUrl}/icons/icon-192.png`),
                fetch(`${baseUrl}/icons/notification-96.png`),
            ]);
        for (const response of [
            manifestResponse,
            workerResponse,
            iconResponse,
            badgeResponse,
        ])
            expect(response.ok).toBeTruthy();
        const manifest = await manifestResponse.json();
        expect(manifest.name).toBe('Flight Alert');
        const worker = await workerResponse.text();
        expect(worker).toContain('showNotification');
        expect(worker).toContain('/icons/notification-96.png');
    });

    await check('Fallback offline PWA', async () => {
        await login();
        await page.goto(`${baseUrl}/`);
        await page.evaluate(async () => {
            await navigator.serviceWorker.ready;
        });
        await page.reload();
        await context.setOffline(true);
        try {
            await page.goto(`${baseUrl}/settings?offline-smoke=${Date.now()}`, {
                waitUntil: 'domcontentloaded',
            });
            await expect(
                page.getByRole('heading', { name: 'Jesteś offline' }),
            ).toBeVisible();
        } finally {
            await context.setOffline(false);
        }
    });
} finally {
    if (context) await context.setOffline(false).catch(() => {});
    if (browser) await browser.close().catch(() => {});
    await admin.auth.admin
        .updateUserById(testUser.id, { password })
        .catch(() => {});
    if (createdAlertIds.size)
        await admin
            .from('alerts')
            .delete()
            .in('id', [...createdAlertIds])
            .eq('user_id', testUser.id);
    const currentSubscriptions = await admin
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', testUser.id);
    const newSubscriptionIds = (currentSubscriptions.data ?? [])
        .map((item) => item.id)
        .filter((id) => !baselineSubscriptions.has(id));
    if (newSubscriptionIds.length)
        await admin
            .from('push_subscriptions')
            .delete()
            .in('id', newSubscriptionIds)
            .eq('user_id', testUser.id);
    const currentDispatches = await admin
        .from('notification_dispatches')
        .select('id')
        .eq('user_id', testUser.id);
    const newDispatchIds = (currentDispatches.data ?? [])
        .map((item) => item.id)
        .filter((id) => !baselineDispatches.has(id));
    if (newDispatchIds.length)
        await admin
            .from('notification_dispatches')
            .delete()
            .in('id', newDispatchIds)
            .eq('user_id', testUser.id);
}

const passed = results.filter((result) => result.status === 'passed').length;
const failed = results.filter((result) => result.status === 'failed').length;
const blocked = results.filter((result) => result.status === 'blocked').length;
console.log(
    JSON.stringify(
        {
            summary: { passed, failed, blocked, total: results.length },
            results,
        },
        null,
        2,
    ),
);
if (failed) process.exitCode = 1;
