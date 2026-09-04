'use client';

import { CalendarDays, LoaderCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentType } from 'react';
import { displayDate, todayInWarsaw, validTravelDates, type TravelDates } from '@/src/modules/alerts/dates';
import { useToday } from '@/src/modules/alerts/components/use-today';
import type { TravelCalendarProps } from '@/src/modules/alerts/components/travel-calendar';
import { alertTranslations } from '@/src/translations/pl/alerts';

type Props = {
    roundTrip: boolean;
    value: TravelDates;
    onConfirm: (value: TravelDates) => void;
    onBlur: () => void;
    inputRef?: (node: HTMLInputElement | null) => void;
    error?: string;
    disabled?: boolean;
};

function dateSummary(value: TravelDates, roundTrip: boolean) {
    if (!value.departureDate) return '';
    const departure = displayDate(value.departureDate);
    return roundTrip ? `${departure} – ${displayDate(value.returnDate) || '…'}` : departure;
}

export function TravelDatePicker({ roundTrip, value, onConfirm, onBlur, inputRef, error, disabled }: Props) {
    const id = useId();
    const trigger = useRef<HTMLInputElement>(null);
    const [initial, setInitial] = useState<TravelDates | null>(null);
    const today = useToday();
    const label = roundTrip ? alertTranslations.form.travelDates : alertTranslations.form.departureDate;
    const past = value.departureDate && value.departureDate < today;
    const fieldError = past ? alertTranslations.validation.pastDate : error;

    function open() {
        if (disabled || initial) return;
        trigger.current?.focus();
        setInitial({ departureDate: value.departureDate, returnDate: roundTrip ? value.returnDate : '' });
    }

    function dismiss() {
        setInitial(null);
        trigger.current?.focus();
    }

    return (
        <div className='travel-date-field'>
            <label htmlFor={id}>{label}</label>
            <div className='field-control travel-date-control' onClick={open}>
                <CalendarDays size={18} aria-hidden />
                <input id={id} type='text' role='combobox' readOnly inputMode='none' aria-autocomplete='none'
                    ref={(node) => {
                        trigger.current = node;
                        inputRef?.(node);
                    }}
                    value={dateSummary(value, roundTrip)}
                    placeholder={roundTrip ? alertTranslations.calendar.chooseRange : alertTranslations.calendar.chooseDeparture}
                    disabled={disabled} aria-haspopup='dialog' aria-expanded={Boolean(initial)}
                    aria-controls={initial ? `${id}-dialog` : undefined}
                    aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${id}-error` : undefined}
                    onBlur={onBlur}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                            event.preventDefault();
                            open();
                        }
                    }} />
            </div>
            {fieldError && <span className='field-error' id={`${id}-error`}>{fieldError}</span>}
            {initial && <DateDialog id={`${id}-dialog`} label={label} initial={initial} roundTrip={roundTrip}
                onConfirm={onConfirm} onDismiss={dismiss} />}
        </div>
    );
}

function DateDialog({ id, label, initial, roundTrip, onConfirm, onDismiss }: {
    id: string;
    label: string;
    initial: TravelDates;
    roundTrip: boolean;
    onConfirm: Props['onConfirm'];
    onDismiss: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const backdropPressed = useRef(false);
    const [draft, setDraft] = useState(initial);
    const [Calendar, setCalendar] = useState<ComponentType<TravelCalendarProps> | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const today = useToday();
    const copy = alertTranslations.calendar;
    const changed = draft.departureDate !== initial.departureDate || (roundTrip && draft.returnDate !== initial.returnDate);
    const complete = validTravelDates(draft, roundTrip, today);
    const instruction = complete && changed ? copy.confirmSelection
        : roundTrip && !draft.returnDate && draft.departureDate >= today ? copy.chooseReturn
        : roundTrip ? copy.chooseRange : copy.chooseDeparture;

    useEffect(() => {
        const element = dialog.current!;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        element.showModal();
        return () => {
            element.close();
            document.body.style.overflow = overflow;
        };
    }, []);

    useEffect(() => {
        let active = true;
        import('./travel-calendar').then((module) => {
            if (active) setCalendar(() => module.TravelCalendar);
        }).catch(() => {
            if (active) setLoadFailed(true);
        });
        return () => { active = false; };
    }, [attempt]);

    function close() {
        dialog.current?.close();
        onDismiss();
    }

    return (
        <dialog ref={dialog} id={id} className='travel-date-dialog' aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-instruction`}
            onKeyDown={(event) => {
                if (event.key !== 'Tab') return;
                const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
                    'button:not(:disabled):not([aria-disabled="true"]), [href], input:not(:disabled), [tabindex]',
                )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }}
            onCancel={(event) => { event.preventDefault(); close(); }}
            onPointerDown={(event) => { backdropPressed.current = event.target === event.currentTarget; }}
            onClick={(event) => {
                if (backdropPressed.current && event.target === event.currentTarget) close();
                backdropPressed.current = false;
            }}>
            <div className='travel-date-panel'>
                <header className='travel-date-heading'>
                    <CalendarDays size={20} aria-hidden />
                    <h2 id={`${id}-title`}>{label}</h2>
                </header>
                <div className='travel-date-selection' aria-live='polite' aria-atomic='true'>
                    <strong>{dateSummary(draft, roundTrip) || '—'}</strong>
                    <p id={`${id}-instruction`}>{instruction}</p>
                </div>
                <div className='travel-date-months'>
                    {Calendar ? <Calendar roundTrip={roundTrip} value={draft} today={today} onChange={setDraft} />
                        : <div className='travel-calendar-loading' role='status'>
                            {loadFailed ? <>
                                <p>{copy.loadFailed}</p>
                                <button type='button' className='secondary-action' onClick={() => {
                                    setLoadFailed(false);
                                    setAttempt((value) => value + 1);
                                }}>{copy.retry}</button>
                            </> : <><LoaderCircle size={22} className='spin' aria-hidden />{copy.loading}</>}
                        </div>}
                </div>
                <footer className='travel-date-actions'>
                    <button type='button' className='secondary-action' onClick={close}>{copy.cancel}</button>
                    <button type='button' className='primary-action' disabled={!Calendar || !complete || !changed}
                        onClick={() => {
                            if (!changed || !validTravelDates(draft, roundTrip, todayInWarsaw())) return;
                            onConfirm(draft);
                            close();
                        }}>{copy.confirm}</button>
                </footer>
            </div>
        </dialog>
    );
}
