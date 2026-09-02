'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowLeft,
    CalendarDays,
    Check,
    CircleDollarSign,
    LoaderCircle,
    MapPin,
    Plane,
    Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Controller,
    useForm,
    useWatch,
    type FieldErrors,
} from 'react-hook-form';
import { createAlert, updateAlert } from '@/src/modules/alerts/actions';
import { airports } from '@/src/modules/alerts/airports';
import {
    CreateAlertSchema,
    type CreateAlertFormInput,
    type CreateAlertInput,
} from '@/src/modules/alerts/schemas';

export type EditableAlert = CreateAlertInput & { id: string };

function dateAfter(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function firstErrorMessage(errors: FieldErrors<CreateAlertFormInput>) {
    for (const error of Object.values(errors)) {
        if (
            error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof error.message === 'string'
        )
            return error.message;
    }
    return 'Sprawdź zaznaczone pola.';
}

export function AlertForm({ alert }: { alert?: EditableAlert }) {
    const router = useRouter();
    const [message, setMessage] = useState<string>();
    const [messageKind, setMessageKind] = useState<'success' | 'error'>(
        'error',
    );
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        getValues,
        setValue,
    } = useForm<CreateAlertFormInput, unknown, CreateAlertInput>({
        resolver: zodResolver(CreateAlertSchema),
        defaultValues: alert ?? {
            origin: 'WAW',
            destination: 'BCN',
            isRoundTrip: true,
            departureDate: dateAfter(21),
            returnDate: dateAfter(25),
            flexDays: 0,
            maxPrice: 600,
            active: true,
        },
    });
    const roundTrip = useWatch({ control, name: 'isRoundTrip' });

    useEffect(() => {
        router.prefetch('/');
        if (alert) router.prefetch(`/alerts/${alert.id}`);
    }, [alert, router]);

    function swapAirports() {
        const origin = getValues('origin');
        const destination = getValues('destination');
        setValue('origin', destination, {
            shouldDirty: true,
            shouldValidate: true,
        });
        setValue('destination', origin, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    async function submit(values: CreateAlertInput) {
        setMessage(undefined);
        const result = alert
            ? await updateAlert(alert.id, values)
            : await createAlert(values);
        setMessage(result.message);
        setMessageKind(result.ok ? 'success' : 'error');
        if (result.ok && result.id !== 'demo') {
            const destination = alert ? `/alerts/${alert.id}` : '/';
      router.replace(destination);
    }
    }

    function invalid(invalidErrors: FieldErrors<CreateAlertFormInput>) {
        setMessage(firstErrorMessage(invalidErrors));
        setMessageKind('error');
    }

    return (
        <main className='form-page'>
            <header className='form-header'>
                <Link
                    href={alert ? `/alerts/${alert.id}` : '/'}
                    className='icon-button'
                    aria-label='Wróć'
                >
                    <ArrowLeft size={19} />
                </Link>
                <div>
                    <p className='eyebrow'>
                        {alert ? 'EDYCJA ALERTU' : 'NOWE WYSZUKIWANIE'}
                    </p>
                    <h1>{alert ? 'Edytuj alert' : 'Dodaj alert'}</h1>
                </div>
            </header>
            <form
                className='alert-form'
                onSubmit={handleSubmit(submit, invalid)}
                noValidate
            >
                <section className='form-section'>
                    <div className='form-section-title'>
                        <MapPin size={18} />
                        <div>
                            <h2>Trasa</h2>
                            <p>Skąd i dokąd chcesz polecieć?</p>
                        </div>
                    </div>
                    <div className='field-grid'>
                        <label>
                            Wylot
                            <div className='field-control'>
                                <Plane size={16} />
                                <input
                                    {...register('origin')}
                                    list='airports'
                                    maxLength={3}
                                    autoCapitalize='characters'
                                    aria-invalid={Boolean(errors.origin)}
                                />
                            </div>
                            {errors.origin && (
                                <span className='field-error'>
                                    {errors.origin.message}
                                </span>
                            )}
                        </label>
                        <button
                            className='swap-button'
                            type='button'
                            aria-label='Zamień lotniska'
                            onClick={swapAirports}
                        >
                            ⇄
                        </button>
                        <label>
                            Przylot
                            <div className='field-control'>
                                <Search size={16} />
                                <input
                                    {...register('destination')}
                                    list='airports'
                                    maxLength={3}
                                    autoCapitalize='characters'
                                    aria-invalid={Boolean(errors.destination)}
                                />
                            </div>
                            {errors.destination && (
                                <span className='field-error'>
                                    {errors.destination.message}
                                </span>
                            )}
                        </label>
                    </div>
                    <datalist id='airports'>
                        {airports.map((airport) => (
                            <option key={airport.code} value={airport.code}>
                                {airport.city} — {airport.name}
                            </option>
                        ))}
                    </datalist>
                </section>
                <section className='form-section'>
                    <div className='form-section-title'>
                        <Plane size={18} />
                        <div>
                            <h2>Typ podróży</h2>
                            <p>Jedna czy dwie strony?</p>
                        </div>
                    </div>
                    <Controller
                        name='isRoundTrip'
                        control={control}
                        render={({ field }) => (
                            <div className='segmented'>
                                <label>
                                    <input
                                        type='radio'
                                        name={field.name}
                                        checked={field.value === true}
                                        onChange={() => field.onChange(true)}
                                    />
                                    <span>
                                        W obie strony <small>RT</small>
                                    </span>
                                </label>
                                <label>
                                    <input
                                        type='radio'
                                        name={field.name}
                                        checked={field.value === false}
                                        onChange={() => field.onChange(false)}
                                    />
                                    <span>
                                        Jedna strona <small>OW</small>
                                    </span>
                                </label>
                            </div>
                        )}
                    />
                    {errors.isRoundTrip && (
                        <span className='field-error'>
                            {errors.isRoundTrip.message}
                        </span>
                    )}
                </section>
                <section className='form-section'>
                    <div className='form-section-title'>
                        <CalendarDays size={18} />
                        <div>
                            <h2>Daty</h2>
                            <p>Podaj termin i elastyczność.</p>
                        </div>
                    </div>
                    <div className='two-columns'>
                        <label>
                            Data wylotu
                            <div className='field-control'>
                                <input
                                    type='date'
                                    {...register('departureDate')}
                                    aria-invalid={Boolean(errors.departureDate)}
                                />
                            </div>
                            {errors.departureDate && (
                                <span className='field-error'>
                                    {errors.departureDate.message}
                                </span>
                            )}
                        </label>
                        {roundTrip && (
                            <label>
                                Data powrotu
                                <div className='field-control'>
                                    <input
                                        type='date'
                                        {...register('returnDate')}
                                        aria-invalid={Boolean(
                                            errors.returnDate,
                                        )}
                                    />
                                </div>
                                {errors.returnDate && (
                                    <span className='field-error'>
                                        {errors.returnDate.message}
                                    </span>
                                )}
                            </label>
                        )}
                    </div>
                    <label className='top-gap'>
                        Elastyczność dat
                        <select
                            {...register('flexDays', { valueAsNumber: true })}
                        >
                            <option value={0}>Dokładne daty</option>
                            <option value={1}>±1 dzień</option>
                            <option value={2}>±2 dni</option>
                            <option value={3}>±3 dni</option>
                        </select>
                    </label>
                </section>
                <section className='form-section'>
                    <div className='form-section-title'>
                        <CircleDollarSign size={18} />
                        <div>
                            <h2>Limit ceny</h2>
                            <p>Powiadomimy Cię poniżej tej kwoty.</p>
                        </div>
                    </div>
                    <label>
                        Maksymalna cena
                        <div className='price-input'>
                            <input
                                type='number'
                                inputMode='numeric'
                                step='1'
                                {...register('maxPrice', {
                                    valueAsNumber: true,
                                })}
                                aria-invalid={Boolean(errors.maxPrice)}
                            />
                            <span>PLN</span>
                        </div>
                        {errors.maxPrice && (
                            <span className='field-error'>
                                {errors.maxPrice.message}
                            </span>
                        )}
                    </label>
                    <label className='toggle-row'>
                        <span>
                            <strong>Alert aktywny</strong>
                            <small>Skanowanie raz dziennie</small>
                        </span>
                        <input
                            type='checkbox'
                            role='switch'
                            {...register('active')}
                        />
                    </label>
                </section>
                {message && (
                    <p className={`form-message ${messageKind}`} role='status'>
                        {message}
                    </p>
                )}
                <button
                    className='primary-action submit-alert'
                    disabled={isSubmitting}
                    type='submit'
                >
                    {isSubmitting ? (
                        <LoaderCircle className='spin' size={18} />
                    ) : (
                        <Check size={18} />
                    )}{' '}
                    {alert ? 'Zapisz zmiany' : 'Zapisz alert'}
                </button>
            </form>
        </main>
    );
}
