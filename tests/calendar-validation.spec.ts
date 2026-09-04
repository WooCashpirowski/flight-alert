import { expect, test } from '@playwright/test';
import { addCalendarDays, fromCalendarDate, toCalendarDate, todayInWarsaw } from '../src/modules/alerts/dates';
import { CreateAlertSchema, StoredAlertSchema } from '../src/modules/alerts/schemas';

test('date-only arithmetic handles year, month, Warsaw midnight and DST boundaries', () => {
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addCalendarDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(todayInWarsaw(new Date('2026-09-04T21:59:59Z'))).toBe('2026-09-04');
    expect(todayInWarsaw(new Date('2026-09-04T22:00:00Z'))).toBe('2026-09-05');
    expect(todayInWarsaw(new Date('2026-03-29T01:00:00Z'))).toBe('2026-03-29');
    expect(todayInWarsaw(new Date('2026-10-25T01:00:00Z'))).toBe('2026-10-25');
    for (const value of ['2026-03-29', '2026-10-25', '2028-02-29']) {
        expect(fromCalendarDate(toCalendarDate(value)!)).toBe(value);
    }
    expect(toCalendarDate('2026-02-30')).toBeUndefined();
});

test('save validation rejects past dates without changing stored-alert validation', () => {
    const today = todayInWarsaw();
    const input = {
        origin: 'WAW', destination: 'BCN', isRoundTrip: true,
        departureDate: today, returnDate: today, flexDays: 0, maxPrice: 600, active: true,
    };
    expect(CreateAlertSchema.safeParse(input).success).toBe(true);
    expect(CreateAlertSchema.safeParse({ ...input, departureDate: addCalendarDays(today, 1) }).success).toBe(false);
    const expired = { ...input, departureDate: addCalendarDays(today, -2), returnDate: addCalendarDays(today, -1) };
    expect(StoredAlertSchema.safeParse(expired).success).toBe(true);
    expect(CreateAlertSchema.safeParse(expired).success).toBe(false);
    expect(CreateAlertSchema.safeParse({ ...input, isRoundTrip: false, returnDate: '' }).success).toBe(true);
});
