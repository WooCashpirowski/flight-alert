'use client';

import { useState, useTransition } from 'react';
import { ArrowUpRight, Gauge, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toggleAlert } from '@/src/modules/alerts/actions';
import type { DashboardAlert } from '@/src/modules/alerts/queries';
import { formatPrice } from '@/src/shared/lib/utils';
import { alertTranslations } from '@/src/translations/pl/alerts';

type AlertFilter = 'all' | 'active' | 'paused';
const filterLabels: Record<AlertFilter, string> = {
    all: alertTranslations.list.filters.all,
    active: alertTranslations.list.filters.active,
    paused: alertTranslations.list.filters.paused,
};

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

function formatDateRange(departureDate: string, returnDate?: string | null) {
    const departure = dateFormatter.format(new Date(`${departureDate}T12:00:00`));
    if (!returnDate) return departure;
    const arrival = dateFormatter.format(new Date(`${returnDate}T12:00:00`));
    return `${departure} – ${arrival}`;
}

export function AlertsSection({ alerts }: { alerts: DashboardAlert[] }) {
    const router = useRouter();
    const [items, setItems] = useState(alerts);
    const [filter, setFilter] = useState<AlertFilter>('all');
    const [message, setMessage] = useState<string>();
    const [pendingId, setPendingId] = useState<string>();
    const [isPending, startTransition] = useTransition();

    const visible = items.filter(
        (alert) =>
            filter === 'all' ||
            (filter === 'active' ? alert.active : !alert.active),
    );

    function changeState(alert: DashboardAlert) {
        setMessage(undefined);
        setPendingId(alert.id);
        startTransition(async () => {
            const result = await toggleAlert(alert.id, !alert.active);
            setMessage(result.message);
            if (result.ok) {
                setItems((current) =>
                    current.map((item) =>
                        item.id === alert.id
                            ? { ...item, active: !alert.active }
                            : item,
                    ),
                );
                router.refresh();
            }
            setPendingId(undefined);
        });
    }

    return (
        <section className='section alerts-section'>
            <div className='section-heading'>
                <h2>{alertTranslations.list.title}</h2>
                <div
                    className='filter-group'
                    role='group'
                    aria-label={alertTranslations.list.eyebrow}
                >
                    {(Object.keys(filterLabels) as AlertFilter[]).map(
                        (value) => (
                            <button
                                key={value}
                                type='button'
                                aria-pressed={filter === value}
                                onClick={() => setFilter(value)}
                            >
                                {filterLabels[value]}
                            </button>
                        ),
                    )}
                </div>
            </div>
            {message && (
                <p className='section-message' role='status'>
                    {message}
                </p>
            )}
            {visible.length ? (
                <div className='alert-grid'>
                    {visible.map((alert) => (
                        <article
                            className={`alert-card ${alert.active ? '' : 'is-paused'}`}
                            key={alert.id}
                            data-alert-card
                        >
                            <div className='alert-topline'>
                                <p className='route-date'>
                                    {formatDateRange(
                                        alert.departureDate,
                                        alert.returnDate,
                                    )}
                                    {alert.flexDays
                                        ? alertTranslations.list.flexSuffix(
                                              alert.flexDays,
                                          )
                                        : ''}
                                </p>
                                <button
                                    className='active-pill status-button'
                                    type='button'
                                    disabled={
                                        isPending && pendingId === alert.id
                                    }
                                    aria-label={
                                        alert.active
                                            ? alertTranslations.list.pauseAria(
                                                  alert.origin,
                                                  alert.destination,
                                              )
                                            : alertTranslations.list.resumeAria(
                                                  alert.origin,
                                                  alert.destination,
                                              )
                                    }
                                    onClick={() => changeState(alert)}
                                >
                                    {isPending && pendingId === alert.id ? (
                                        <LoaderCircle
                                            className='spin'
                                            size={10}
                                        />
                                    ) : (
                                        <i />
                                    )}{' '}
                                    {alert.active
                                        ? alertTranslations.list.active
                                        : alertTranslations.list.paused}
                                </button>
                            </div>
                            <h3 className='route-heading'>
                                <span>{alert.origin}</span>
                                <i aria-hidden='true'>→</i>
                                <span>{alert.destination}</span>
                            </h3>
                            {!alert.returnDate && (
                                <p className='trip-note'>
                                    {alertTranslations.list.oneWaySuffix}
                                </p>
                            )}
                            <div className='price-row'>
                                <div>
                                    <small>{alertTranslations.list.limit}</small>
                                    <strong>
                                        {formatPrice(alert.maxPrice)}
                                    </strong>
                                </div>
                                <div className='price-found'>
                                    <small>
                                        {alertTranslations.list.bestPrice}
                                    </small>
                                    <strong>
                                        {alert.bestPrice
                                            ? formatPrice(alert.bestPrice)
                                            : '—'}
                                    </strong>
                                </div>
                                <Link
                                    className='details-link'
                                    href={`/alerts/${alert.id}`}
                                    aria-label={alertTranslations.list.detailsAria(
                                        alert.origin,
                                        alert.destination,
                                    )}
                                >
                                    <ArrowUpRight size={18} />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className='empty-state'>
                    <Gauge size={26} />
                    <h3>
                        {items.length
                            ? alertTranslations.list.noFilteredAlerts
                            : alertTranslations.list.noAlerts}
                    </h3>
                    <p>
                        {items.length
                            ? alertTranslations.list
                                  .noFilteredAlertsDescription
                            : alertTranslations.list.noAlertsDescription}
                    </p>
                    <Link href='/alerts/new'>
                        {alertTranslations.list.create}
                    </Link>
                </div>
            )}
        </section>
    );
}
