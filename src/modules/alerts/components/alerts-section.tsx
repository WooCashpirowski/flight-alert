'use client';

import { useState, useTransition } from 'react';
import { Filter, Gauge, LoaderCircle } from 'lucide-react';
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

export function AlertsSection({ alerts }: { alerts: DashboardAlert[] }) {
    const router = useRouter();
    const [items, setItems] = useState(alerts);
    const [filter, setFilter] = useState<AlertFilter>('all');
    const [filtersOpen, setFiltersOpen] = useState(false);
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
        <section className='section'>
            <div className='section-heading'>
                <div>
                    <p className='eyebrow'>{alertTranslations.list.eyebrow}</p>
                    <h2>{alertTranslations.list.title}</h2>
                </div>
                <div className='filters'>
                    <button
                        className='filter-button'
                        type='button'
                        aria-expanded={filtersOpen}
                        aria-controls='alert-filters'
                        onClick={() => setFiltersOpen((value) => !value)}
                    >
                        <Filter size={13} /> {filterLabels[filter]}
                    </button>
                    {filtersOpen && (
                        <div className='filter-popover' id='alert-filters'>
                            {(Object.keys(filterLabels) as AlertFilter[]).map(
                                (value) => (
                                    <button
                                        key={value}
                                        type='button'
                                        aria-pressed={filter === value}
                                        onClick={() => {
                                            setFilter(value);
                                            setFiltersOpen(false);
                                        }}
                                    >
                                        {filterLabels[value]}
                                    </button>
                                ),
                            )}
                        </div>
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
                    {visible.map((alert, index) => (
                        <article
                            className={`alert-card ${index % 2 ? 'violet' : 'mint'}`}
                            key={alert.id}
                        >
                            <div className='alert-topline'>
                                <span className='route-pill'>
                                    {alert.origin} → {alert.destination}
                                </span>
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
                            <div className='route-line'>
                                <span />
                                <i>✦</i>
                                <span />
                            </div>
                            <h3>
                                {alert.origin} · {alert.destination}
                            </h3>
                            <p>
                                {alert.departureDate}
                                {alert.returnDate
                                    ? ` – ${alert.returnDate}`
                                    : alertTranslations.list.oneWaySuffix}
                                {alert.flexDays
                                    ? alertTranslations.list.flexSuffix(
                                          alert.flexDays,
                                      )
                                    : ''}
                            </p>
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
                                    href={`/alerts/${alert.id}`}
                                    aria-label={alertTranslations.list.detailsAria(
                                        alert.origin,
                                        alert.destination,
                                    )}
                                >
                                    →
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
