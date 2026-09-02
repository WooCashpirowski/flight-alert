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

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

function formatDate(value: string) {
    return dateFormatter.format(new Date(`${value}T12:00:00`));
}

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
        <main className='form-page' id='main-content'>
            <header className='form-header'>
                <Link
                    className='icon-button'
                    href='/'
                    aria-label={alertTranslations.details.backToDashboard}
                >
                    <ArrowLeft size={19} />
                </Link>
                <div>
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
            {offerUrl && (
                <a
                    className='offer-action offer-featured'
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
            <p className='detail-intro'>
                <PlaneTakeoff size={21} aria-hidden='true' />
                <span>{alertTranslations.details.description}</span>
            </p>
            <dl className='detail-facts'>
                <div>
                    <CalendarDays aria-hidden='true' />
                    <dt>{alertTranslations.details.datesLabel}</dt>
                    <dd>
                        {formatDate(alert.departureDate)}
                        {alert.returnDate && ` – ${formatDate(alert.returnDate)}`}
                    </dd>
                    <small>
                        {alert.flexDays
                            ? alertTranslations.details.flexibility(
                                  alert.flexDays,
                              )
                            : alertTranslations.details.exactDates}
                    </small>
                </div>
                <div>
                    <Gauge aria-hidden='true' />
                    <dt>{alertTranslations.details.priceLabel}</dt>
                    <dd>
                        {alert.bestPrice
                            ? formatPrice(alert.bestPrice)
                            : alertTranslations.details.searching}
                    </dd>
                    <small>
                        {alertTranslations.details.limit(
                            formatPrice(alert.maxPrice),
                        )}
                    </small>
                </div>
            </dl>
            <AlertActions id={alert.id} active={alert.active} />
        </main>
    );
}
