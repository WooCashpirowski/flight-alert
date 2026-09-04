import { i18nConfig } from '@/src/shared/i18n/config';

const todayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: i18nConfig.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

/** Calendar dates are strings, never UTC instants. */
export function todayInWarsaw(now = new Date()): string {
    const parts = todayFormatter.formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((value) => value.type === type)!.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

export function addCalendarDays(value: string, days: number): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function toCalendarDate(value?: string): Date | undefined {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    return fromCalendarDate(date) === value ? date : undefined;
}

export function fromCalendarDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function displayDate(value: string): string {
    return value ? value.split('-').reverse().join('.') : '';
}

export type TravelDates = { departureDate: string; returnDate: string };

export function validTravelDates(dates: TravelDates, roundTrip: boolean, today: string): boolean {
    return Boolean(
        toCalendarDate(dates.departureDate) && dates.departureDate >= today &&
        (!roundTrip || (toCalendarDate(dates.returnDate) && dates.returnDate >= dates.departureDate)),
    );
}
