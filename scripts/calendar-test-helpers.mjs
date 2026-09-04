/** Navigate the real calendar UI; shared by Playwright and the live smoke test. */
export async function chooseCalendarDay(page, date) {
    const calendar = page.locator('.travel-calendar');
    await calendar.waitFor({ state: 'visible' });
    const day = calendar.locator(`[data-day="${date}"]:not([data-outside]) button`);
    for (let attempt = 0; attempt < 36; attempt++) {
        if (await day.isVisible()) {
            await day.click();
            return;
        }
        const first = await calendar.locator('[data-day]:not([data-outside])').first().getAttribute('data-day');
        await calendar.getByRole('button', {
            name: date < first ? 'Poprzedni miesiąc' : 'Następny miesiąc',
        }).click();
    }
    throw new Error(`Could not navigate to calendar date ${date}`);
}
