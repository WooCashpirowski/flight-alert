import {
    ArrowLeft,
    CalendarDays,
    ExternalLink,
    Gauge,
    Pencil,
    PlaneTakeoff,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertActions } from '@/src/modules/alerts/components/alert-actions';
import { getDashboardData } from '@/src/modules/alerts/queries';
import { formatPrice } from '@/src/shared/lib/utils';

export default async function AlertDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { alerts } = await getDashboardData();
    const alert = alerts.find((item) => item.id === id);
    if (!alert) notFound();
    const offerUrl =
        alert.bestOfferUrl && /^https?:\/\//i.test(alert.bestOfferUrl)
            ? alert.bestOfferUrl
            : null;

    return (
        <main className='form-page'>
            <header className='form-header'>
                <Link
                    className='icon-button'
                    href='/'
                    aria-label='Wróć do panelu'
                >
                    <ArrowLeft size={19} />
                </Link>
                <div>
                    <p className='eyebrow'>SZCZEGÓŁY ALERTU</p>
                    <h1>
                        {alert.origin} → {alert.destination}
                    </h1>
                </div>
                <Link
                    className='icon-button header-action'
                    href={`/alerts/${id}/edit`}
                    aria-label='Edytuj alert'
                >
                    <Pencil size={17} />
                </Link>
            </header>
            <section className='detail-hero'>
                <PlaneTakeoff size={26} />
                <p>
                    Monitorujemy tę trasę raz dziennie i połączymy wszystkie
                    znalezione okazje w jedno powiadomienie.
                </p>
            </section>
            <div className='detail-grid'>
                <section className='settings-card'>
                    <CalendarDays />
                    <div>
                        <h2>
                            {alert.departureDate}
                            {alert.returnDate && ` – ${alert.returnDate}`}
                        </h2>
                        <p>
                            {alert.flexDays
                                ? `Elastyczność ±${alert.flexDays} dni`
                                : 'Dokładne daty'}
                        </p>
                    </div>
                </section>
                <section className='settings-card'>
                    <Gauge />
                    <div>
                        <h2>Limit {formatPrice(alert.maxPrice)}</h2>
                        <p>
                            Najlepsza cena:{' '}
                            {alert.bestPrice
                                ? formatPrice(alert.bestPrice)
                                : 'jeszcze szukamy'}
                        </p>
                    </div>
                </section>
            </div>
            {offerUrl && (
                <a
                    className='offer-action'
                    href={offerUrl}
                    target='_blank'
                    rel='noreferrer'
                >
                    <span>
                        <small>NAJLEPSZA ZNALEZIONA OFERTA</small>
                        <strong>
                            {alert.bestProvider ?? 'Sprawdź ofertę'} ·{' '}
                            {alert.bestPrice
                                ? formatPrice(alert.bestPrice)
                                : ''}
                        </strong>
                    </span>
                    <ExternalLink size={18} />
                </a>
            )}
            <AlertActions id={alert.id} active={alert.active} />
        </main>
    );
}
