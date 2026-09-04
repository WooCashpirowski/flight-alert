'use client';

import { DayPicker } from '@daypicker/react';
import { pl } from '@daypicker/react/locale/pl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { fromCalendarDate, toCalendarDate, todayInWarsaw, type TravelDates } from '@/src/modules/alerts/dates';
import { alertTranslations } from '@/src/translations/pl/alerts';

export type TravelCalendarProps = {
    roundTrip: boolean;
    value: TravelDates;
    today: string;
    onChange: (value: TravelDates) => void;
};

function subscribeToWidth(onChange: () => void) {
    const media = window.matchMedia('(min-width: 40rem)');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
}

export function TravelCalendar({ roundTrip, value, today, onChange }: TravelCalendarProps) {
    const wide = useSyncExternalStore(subscribeToWidth,
        () => window.matchMedia('(min-width: 40rem)').matches, () => false);
    const [month, setMonth] = useState(() => toCalendarDate(
        value.departureDate >= today ? value.departureDate : today,
    )!);
    const minimum = toCalendarDate(today)!;
    const visibleMonth = fromCalendarDate(month).slice(0, 7) < today.slice(0, 7) ? minimum : month;
    const copy = alertTranslations.calendar;

    function select(day: Date) {
        const selected = fromCalendarDate(day);
        if (selected < todayInWarsaw()) return;
        if (!roundTrip) {
            onChange({ departureDate: selected, returnDate: '' });
        } else if (!value.departureDate || value.returnDate || value.departureDate < todayInWarsaw() || selected < value.departureDate) {
            onChange({ departureDate: selected, returnDate: '' });
        } else {
            onChange({ ...value, returnDate: selected });
        }
    }

    const common = {
        className: 'travel-calendar',
        locale: pl,
        weekStartsOn: 1 as const,
        numberOfMonths: wide ? 2 : 1,
        month: visibleMonth,
        onMonthChange: setMonth,
        startMonth: minimum,
        today: minimum,
        disabled: { before: minimum },
        fixedWeeks: true,
        showOutsideDays: false,
        autoFocus: true,
        role: 'application' as const,
        'aria-label': copy.month(visibleMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })),
        labels: {
            labelPrevious: () => copy.previousMonth,
            labelNext: () => copy.nextMonth,
            labelDayButton: (date: Date, modifiers: Record<string, boolean>) => [
                date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                modifiers.today && copy.today,
                modifiers.selected && copy.selected,
            ].filter(Boolean).join(', '),
        },
        components: {
            Chevron: ({ orientation }: { orientation?: string }) => orientation === 'left'
                ? <ChevronLeft size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />,
        },
    };

    return roundTrip ? (
        <DayPicker {...common} mode='range' required resetOnSelect
            selected={value.departureDate ? { from: toCalendarDate(value.departureDate), to: toCalendarDate(value.returnDate) } : undefined}
            onSelect={(_, day) => select(day)} />
    ) : (
        <DayPicker {...common} mode='single' required
            selected={toCalendarDate(value.departureDate)} onSelect={select} />
    );
}
