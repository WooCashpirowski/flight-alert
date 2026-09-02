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
import { alertTranslations } from '@/src/translations/pl/alerts';

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
                    aria-label={alertTranslations.details.backToDashboard}
                >
                    <ArrowLeft size={19} />
                </Link>
                <div>
                    <p className='eyebrow'>
                        {alertTranslations.details.eyebrow}
                    </p>
                    <h1>
                        {alert.origin} → {alert.destination}
                    </h1>
                </div>
                <Link
                    className='icon-button header-action'
                    href={`/alerts/${id}/edit`}
                    aria-label={alertTranslations.details.editAria}
                >
                    <Pencil size={17} />
                </Link>
            </header>
            <section className='detail-hero'>
                <PlaneTakeoff size={26} />
                <p>
                    {alertTranslations.details.description}
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
                                ? alertTranslations.details.flexibility(
                                      alert.flexDays,
                                  )
                                : alertTranslations.details.exactDates}
                        </p>
                    </div>
                </section>
                <section className='settings-card'>
                    <Gauge />
                    <div>
                        <h2>
                            {alertTranslations.details.limit(
                                formatPrice(alert.maxPrice),
                            )}
                        </h2>
                        <p>
                            {alertTranslations.details.bestPrice(
                                alert.bestPrice
                                    ? formatPrice(alert.bestPrice)
                                    : alertTranslations.details.searching,
                            )}
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
                        <small>{alertTranslations.details.bestOffer}</small>
                        <strong>
                            {alert.bestProvider ??
                                alertTranslations.details.checkOffer}{' '}
                            ·{' '}
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
