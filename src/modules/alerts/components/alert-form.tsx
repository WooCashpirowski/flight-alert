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
import {
    CreateAlertSchema,
    type CreateAlertFormInput,
    type CreateAlertInput,
} from '@/src/modules/alerts/schemas';
import { AirportCombobox } from '@/src/modules/alerts/components/airport-combobox';
import { alertTranslations } from '@/src/translations/pl/alerts';
import { appTranslations } from '@/src/translations/pl/app';
import { i18nConfig } from '@/src/shared/i18n/config';

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
    return alertTranslations.validation.checkFields;
}

export function AlertForm({ alert }: { alert?: EditableAlert }) {
    const router = useRouter();
    const [message, setMessage] = useState<string>();
    const [messageKind, setMessageKind] = useState<'success' | 'error'>(
        'error',
    );
    const [routeFieldsVersion, setRouteFieldsVersion] = useState(0);
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
        setRouteFieldsVersion((version) => version + 1);
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
        <main className='form-page' id='main-content'>
            <header className='form-header'>
                <Link
                    href={alert ? `/alerts/${alert.id}` : '/'}
                    className='icon-button'
                    aria-label={appTranslations.common.back}
                >
                    <ArrowLeft size={19} />
                </Link>
                <div>
                    <h1>
                        {alert
                            ? alertTranslations.form.editTitle
                            : alertTranslations.form.createTitle}
                    </h1>
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
                            <h2>{alertTranslations.form.routeTitle}</h2>
                            <p>{alertTranslations.form.routeDescription}</p>
                        </div>
                    </div>
                    <div className='field-grid'>
                        <Controller
                            name='origin'
                            control={control}
                            render={({ field }) => (
                                <AirportCombobox
                                    key={`origin-${routeFieldsVersion}`}
                                    id='origin-airport'
                                    label={alertTranslations.form.origin}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    error={errors.origin?.message}
                                    icon={<Plane size={16} />}
                                />
                            )}
                        />
                        <button
                            className='swap-button'
                            type='button'
                            aria-label={alertTranslations.form.swapAirports}
                            onClick={swapAirports}
                        >
                            ⇄
                        </button>
                        <Controller
                            name='destination'
                            control={control}
                            render={({ field }) => (
                                <AirportCombobox
                                    key={`destination-${routeFieldsVersion}`}
                                    id='destination-airport'
                                    label={alertTranslations.form.destination}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    error={errors.destination?.message}
                                    icon={<Search size={16} />}
                                    allowAny
                                />
                            )}
                        />
                    </div>
                </section>
                <section className='form-section'>
                    <div className='form-section-title'>
                        <Plane size={18} />
                        <div>
                            <h2>{alertTranslations.form.tripTypeTitle}</h2>
                            <p>{alertTranslations.form.tripTypeDescription}</p>
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
                                        {alertTranslations.form.roundTrip}{' '}
                                        <small>
                                            {
                                                alertTranslations.form
                                                    .roundTripAbbreviation
                                            }
                                        </small>
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
                                        {alertTranslations.form.oneWay}{' '}
                                        <small>
                                            {
                                                alertTranslations.form
                                                    .oneWayAbbreviation
                                            }
                                        </small>
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
                            <h2>{alertTranslations.form.datesTitle}</h2>
                            <p>{alertTranslations.form.datesDescription}</p>
                        </div>
                    </div>
                    <div className='two-columns'>
                        <label>
                            {alertTranslations.form.departureDate}
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
                                {alertTranslations.form.returnDate}
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
                        {alertTranslations.form.dateFlexibility}
                        <select
                            {...register('flexDays', { valueAsNumber: true })}
                        >
                            <option value={0}>
                                {alertTranslations.form.exactDates}
                            </option>
                            {[1, 2, 3].map((days) => (
                                <option key={days} value={days}>
                                    {alertTranslations.form.flexDays(days)}
                                </option>
                            ))}
                        </select>
                    </label>
                </section>
                <section className='form-section'>
                    <div className='form-section-title'>
                        <CircleDollarSign size={18} />
                        <div>
                            <h2>{alertTranslations.form.priceLimitTitle}</h2>
                            <p>
                                {alertTranslations.form.priceLimitDescription}
                            </p>
                        </div>
                    </div>
                    <label>
                        {alertTranslations.form.maxPrice}
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
                            <span>{i18nConfig.currency}</span>
                        </div>
                        {errors.maxPrice && (
                            <span className='field-error'>
                                {errors.maxPrice.message}
                            </span>
                        )}
                    </label>
                    <label className='toggle-row'>
                        <span>
                            <strong>{alertTranslations.form.active}</strong>
                            <small>{alertTranslations.form.dailyScan}</small>
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
                    {alert
                        ? alertTranslations.form.saveChanges
                        : alertTranslations.form.saveAlert}
                </button>
            </form>
        </main>
    );
}
