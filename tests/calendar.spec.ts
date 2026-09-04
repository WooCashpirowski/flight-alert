import { expect, test, type Page } from '@playwright/test';
import { chooseCalendarDay } from '../scripts/calendar-test-helpers.mjs';
import { addCalendarDays, displayDate, todayInWarsaw } from '../src/modules/alerts/dates';

test.use({ timezoneId: 'America/Los_Angeles' });

const date = (offset: number) => addCalendarDays(todayInWarsaw(), offset);
const field = (page: Page) => page.getByRole('combobox', { name: /Data wylotu|Daty wylotu i powrotu/ });
const ok = (page: Page) => page.getByRole('button', { name: 'OK', exact: true });

test('range selection commits only a changed, complete range', async ({ page }) => {
    await page.goto('/alerts/new');
    const original = await field(page).inputValue();
    await expect(field(page)).toHaveAccessibleName('Daty wylotu i powrotu');
    await field(page).click();
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, date(21));
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, date(25));
    await expect(ok(page)).toBeDisabled();

    await chooseCalendarDay(page, date(28));
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, date(33));
    await expect(ok(page)).toBeEnabled();
    await expect(field(page)).toHaveValue(original);
    await expect(page.locator(`.rdp-day[data-day="${date(32)}"]:not([data-outside])`)).toHaveClass(/rdp-range_middle/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await ok(page).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(field(page)).toHaveValue(`${displayDate(date(28))} – ${displayDate(date(33))}`);
    await expect(field(page)).toBeFocused();
    await field(page).click();
    await expect(ok(page)).toBeDisabled();
});

test('one-way selection, cancel, Escape and backdrop preserve committed dates', async ({ page }) => {
    await page.goto('/alerts/new');
    await page.getByRole('radio', { name: /Jedna strona/ }).click();
    await expect(field(page)).toHaveAccessibleName('Data wylotu');
    const original = await field(page).inputValue();
    for (const dismissal of ['cancel', 'escape', 'backdrop']) {
        await field(page).click();
        await expect(ok(page)).toBeDisabled();
        await chooseCalendarDay(page, date(22));
        await expect(ok(page)).toBeEnabled();
        await expect(field(page)).toHaveValue(original);
        if (dismissal === 'cancel') await page.getByRole('button', { name: 'Anuluj', exact: true }).click();
        if (dismissal === 'escape') await page.keyboard.press('Escape');
        if (dismissal === 'backdrop') await page.mouse.click(2, 2);
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(field(page)).toHaveValue(original);
        await expect(field(page)).toBeFocused();
    }
    await field(page).press('Enter');
    await chooseCalendarDay(page, date(22));
    await chooseCalendarDay(page, date(21));
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, date(23));
    await ok(page).click();
    await expect(field(page)).toHaveValue(displayDate(date(23)));
    await page.getByRole('button', { name: 'Zapisz alert' }).click();
    await expect(page.getByText(/trybie demo/)).toBeVisible();
});

test('same-day return takes two clicks and an earlier day restarts the range', async ({ page }) => {
    await page.goto('/alerts/new');
    await field(page).click();
    await chooseCalendarDay(page, date(24));
    await chooseCalendarDay(page, date(22));
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, date(22));
    await expect(ok(page)).toBeEnabled();
    await ok(page).click();
    await expect(field(page)).toHaveValue(`${displayDate(date(22))} – ${displayDate(date(22))}`);
});

test('trip switches remember valid returns and require replacement of an outdated return', async ({ page }) => {
    await page.goto('/alerts/new');
    const original = await field(page).inputValue();
    await page.getByRole('radio', { name: /Jedna strona/ }).click();
    await page.getByRole('radio', { name: /W obie strony/ }).click();
    await expect(field(page)).toHaveValue(original);
    await page.getByRole('radio', { name: /Jedna strona/ }).click();
    await field(page).click();
    await chooseCalendarDay(page, date(30));
    await ok(page).click();
    await page.getByRole('radio', { name: /W obie strony/ }).click();
    await expect(field(page)).toHaveValue(`${displayDate(date(30))} – …`);
    await page.getByRole('button', { name: 'Zapisz alert' }).click();
    await expect(field(page)).toBeFocused();
    await expect(field(page)).toHaveAttribute('aria-invalid', 'true');
    await field(page).click();
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, date(34));
    await ok(page).click();
    await expect(field(page)).toHaveValue(`${displayDate(date(30))} – ${displayDate(date(34))}`);
});

test('today is available, past days are disabled and the calendar supports keyboard focus', async ({ page }) => {
    await page.goto('/alerts/new');
    await page.getByRole('radio', { name: /Jedna strona/ }).click();
    await field(page).press('Enter');
    await chooseCalendarDay(page, date(0));
    await expect(ok(page)).toBeEnabled();
    const previous = page.getByRole('button', { name: 'Poprzedni miesiąc' });
    await expect(previous).toBeDisabled();
    const past = page.locator(`.travel-calendar [data-day="${date(-1)}"]:not([data-outside]) button`);
    if (await past.count()) await expect(past).toBeDisabled();
    const today = page.locator(`.travel-calendar [data-day="${date(0)}"]:not([data-outside]) button`);
    await today.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.locator('.travel-date-selection strong')).toHaveText(displayDate(date(1)));
    for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => Boolean(document.querySelector('dialog')?.contains(document.activeElement)))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(field(page)).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('editing expired dates requires new dates and opens the current month', async ({ page }) => {
    await page.goto('/alerts/demo-waw-bcn/edit');
    await page.clock.install({ time: new Date('2027-01-15T12:00:00Z') });
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(field(page)).toHaveValue('12.09.2026 – 16.09.2026');
    await expect(field(page)).toHaveAttribute('aria-invalid', 'true');
    await field(page).click();
    await expect(page.locator('.rdp-month_caption').first()).toContainText('styczeń 2027');
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, '2027-01-15');
    await chooseCalendarDay(page, '2027-01-16');
    await ok(page).click();
    await expect(field(page)).toHaveValue('15.01.2027 – 16.01.2027');
    await expect(field(page)).toHaveAttribute('aria-invalid', 'false');
});

test('Warsaw midnight invalidates a draft even in another device time zone', async ({ page }) => {
    await page.goto('/alerts/new');
    await page.clock.install({ time: new Date('2027-03-27T22:59:50Z') });
    await page.getByRole('radio', { name: /Jedna strona/ }).click();
    await field(page).click();
    await chooseCalendarDay(page, '2027-03-27');
    await expect(ok(page)).toBeEnabled();
    await page.clock.runFor(11_000);
    await expect(ok(page)).toBeDisabled();
    await chooseCalendarDay(page, '2027-03-28');
    await expect(ok(page)).toBeEnabled();
    await ok(page).click();
    await expect(field(page)).toHaveValue('28.03.2027');
});

test('create and update actions reject past dates even when client validation is bypassed', async ({ page }) => {
    let intercepted = 0;
    await page.route('**/*', async (route) => {
        const request = route.request();
        const body = request.postData();
        if (request.method() === 'POST' && body?.includes('departureDate')) {
            const changed = body.replaceAll(date(5), date(-2)).replaceAll(date(8), date(-1));
            if (changed !== body) intercepted++;
            await route.continue({ postData: changed });
        } else await route.continue();
    });
    for (const path of ['/alerts/new', '/alerts/demo-waw-bcn/edit']) {
        await page.goto(path);
        await field(page).click();
        await chooseCalendarDay(page, date(5));
        await chooseCalendarDay(page, date(8));
        await ok(page).click();
        await page.getByRole('button', { name: /Zapisz alert|Zapisz zmiany/ }).click();
        await expect(page.getByRole('status')).toHaveText('Wybierz datę dzisiejszą lub późniejszą.');
    }
    expect(intercepted).toBe(2);
});

test('calendar loads on demand and fits narrow, mobile and desktop screens', async ({ page }, testInfo) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/alerts/new');
    expect(requests.some((url) => /\/travel-calendar-.*\.js/.test(url))).toBe(false);
    for (const width of [320, 412, 1440]) {
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 800 });
        await field(page).click();
        await chooseCalendarDay(page, date(22));
        await chooseCalendarDay(page, date(26));
        await expect(page.locator('.rdp-month')).toHaveCount(width < 640 ? 1 : 2);
        await expect(ok(page)).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(await page.locator('.travel-date-dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        await page.screenshot({ path: `outputs/calendar-${testInfo.project.name}-${width}.png` });
        await page.getByRole('button', { name: 'Anuluj', exact: true }).click();
    }
    expect(requests.some((url) => /\/travel-calendar-.*\.js/.test(url))).toBe(true);
    await page.setViewportSize({ width: 412, height: 380 });
    await field(page).click();
    await expect(ok(page)).toBeInViewport();
});
