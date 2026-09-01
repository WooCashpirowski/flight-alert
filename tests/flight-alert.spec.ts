import { expect, test } from '@playwright/test';

test('mobile dashboard exposes the primary journey', async ({ page }) => {
    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: /Dzień dobry/ }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /Nowy alert/ }).first(),
    ).toBeVisible();
    await expect(page.getByText('Aktywne alerty')).toBeVisible();
    await page.getByRole('button', { name: 'Otwórz profil' }).click();
    await page.getByRole('button', { name: 'Wyloguj się' }).click();
    await expect(page).toHaveURL(/\/login$/);
});

test('login supports passwords and allowlisted registration', async ({
    page,
}) => {
    await page.goto('/login');
    await expect(page.getByRole('tab', { name: 'Logowanie' })).toHaveAttribute(
        'aria-selected',
        'true',
    );
    await expect(page.getByLabel('Adres e-mail')).toBeVisible();
    await expect(page.getByLabel('Hasło', { exact: true })).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Zaloguj się' }),
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Rejestracja' }).click();
    await expect(page.getByLabel('Powtórz hasło')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Utwórz konto' }),
    ).toBeVisible();
});

test('alert form validates a round trip and can submit in demo mode', async ({
    page,
}) => {
    await page.goto('/alerts/new');
    await expect(
        page.getByRole('heading', { name: 'Dodaj alert' }),
    ).toBeVisible();
    const price = page.getByRole('spinbutton', { name: /Maksymalna cena/ });
    await price.fill('0');
    await expect(price).toHaveValue('0');
    await page.getByRole('button', { name: 'Zapisz alert' }).click();
    await expect(page.getByText('Cena musi być większa od 0')).toBeVisible();
    await price.fill('700');
    await page.getByRole('button', { name: 'Zapisz alert' }).click();
    await expect(page.getByText(/trybie demo/)).toBeVisible();
});

test('PWA manifest and service worker assets are available', async ({
    request,
}) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).name).toBe('Flight Alert');
    const worker = await request.get('/sw.js');
    expect(worker.ok()).toBeTruthy();
    expect(await worker.text()).toContain('notificationclick');
});
