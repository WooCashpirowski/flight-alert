'use client';

import { useState, useTransition } from 'react';
import { Filter, Gauge, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toggleAlert } from '@/src/modules/alerts/actions';
import type { DashboardAlert } from '@/src/modules/alerts/queries';
import { formatPrice } from '@/src/shared/lib/utils';

type AlertFilter = 'all' | 'active' | 'paused';
const filterLabels: Record<AlertFilter, string> = {
    all: 'Wszystkie',
    active: 'Aktywne',
    paused: 'Wstrzymane',
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
                    <p className='eyebrow'>TWOJE TRASY</p>
                    <h2>Alerty cenowe</h2>
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
                                            ? `Wstrzymaj alert ${alert.origin} ${alert.destination}`
                                            : `Wznów alert ${alert.origin} ${alert.destination}`
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
                                    {alert.active ? 'Aktywny' : 'Wstrzymany'}
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
                                    : ' · w jedną stronę'}
                                {alert.flexDays
                                    ? ` · ±${alert.flexDays} dni`
                                    : ''}
                            </p>
                            <div className='price-row'>
                                <div>
                                    <small>TWÓJ LIMIT</small>
                                    <strong>
                                        {formatPrice(alert.maxPrice)}
                                    </strong>
                                </div>
                                <div className='price-found'>
                                    <small>NAJLEPSZA CENA</small>
                                    <strong>
                                        {alert.bestPrice
                                            ? formatPrice(alert.bestPrice)
                                            : '—'}
                                    </strong>
                                </div>
                                <Link
                                    href={`/alerts/${alert.id}`}
                                    aria-label={`Szczegóły ${alert.origin} ${alert.destination}`}
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
                            ? 'Brak alertów w tej kategorii'
                            : 'Dodaj pierwszą trasę'}
                    </h3>
                    <p>
                        {items.length
                            ? 'Wybierz inny filtr lub zmień stan alertu.'
                            : 'Zaczniemy sprawdzać ceny od najbliższego skanu.'}
                    </p>
                    <Link href='/alerts/new'>Utwórz alert</Link>
                </div>
            )}
        </section>
    );
}
