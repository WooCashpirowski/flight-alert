/* eslint-disable @next/next/no-img-element */
import { Home, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData } from '@/src/modules/alerts/queries';
import { AlertsSection } from '@/src/modules/alerts/components/alerts-section';
import { DashboardMotion } from '@/src/modules/alerts/components/dashboard-motion';
import { getAirportByCode } from '@/src/modules/alerts/lib/airport-search';
import { ProfileMenu } from '@/src/modules/auth/components/profile-menu';
import { EnablePushBanner } from '@/src/modules/notifications/components/enable-push-banner';
import { i18nConfig } from '@/src/shared/i18n/config';
import { appTranslations } from '@/src/translations/pl/app';
import { alertTranslations } from '@/src/translations/pl/alerts';

function scanSchedule(now = new Date()) {
    const next = new Date(now);
    next.setUTCHours(7, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const formatter = new Intl.DateTimeFormat(i18nConfig.locale, {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: i18nConfig.timeZone,
    });
    const localTime = new Intl.DateTimeFormat(i18nConfig.locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: i18nConfig.timeZone,
    }).format(next);
    return { nextLabel: formatter.format(next), localTime };
}

export default async function DashboardPage() {
    const { alerts, name, email, demo } = await getDashboardData();
    const airportCodes = new Set(
        alerts.flatMap((alert) => [alert.origin, alert.destination]),
    );
    const airportLabels = Object.fromEntries(
        [...airportCodes].map((code) => {
            const airport = getAirportByCode(code);
            const label =
                code === 'ANY'
                    ? alertTranslations.form.anywhere
                    : airport
                      ? `${airport.city}, ${airport.name.replace(/^Lotnisko\s+/i, '')}`
                      : alertTranslations.form.externalAirportCode;
            return [code, label];
        }),
    );
    const now = new Date();
    const date = new Intl.DateTimeFormat(i18nConfig.locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(now);
    const schedule = scanSchedule(now);
    const activeAlertsCount = alerts.filter((alert) => alert.active).length;

    return (
        <main className='app-shell' id='main-content'>
            <div className='ambient ambient-one' />
            <div className='ambient ambient-two' />
            <DashboardMotion />
            <div
                className='dashboard'
                aria-label={appTranslations.dashboard.ariaLabel}
            >
                <header className='topbar'>
                    <Link className='brand' href='/'>
                        <span className='brand-app-icon'>
                            <img
                                src='/icons/icon-192.png'
                                alt=''
                                width='32'
                                height='32'
                            />
                        </span>
                        <span>{appTranslations.common.name}</span>
                    </Link>
                    <nav
                        className='desktop-nav'
                        aria-label={appTranslations.dashboard.ariaLabel}
                    >
                        <Link className='selected' href='/'>
                            {appTranslations.dashboard.navigation.dashboard}
                        </Link>
                        <Link href='/alerts/new'>
                            {appTranslations.dashboard.navigation.newAlert}
                        </Link>
                        <Link href='/settings'>
                            {appTranslations.dashboard.navigation.settings}
                        </Link>
                    </nav>
                    <ProfileMenu email={email} />
                </header>
                <div className='dashboard-composition'>
                    <aside className='dashboard-intro' data-dashboard-intro>
                        <p className='date-line'>{date}</p>
                        <h1>{appTranslations.dashboard.greeting(name)}</h1>
                        <p className='hero-copy'>
                            {appTranslations.dashboard.hero}
                            {demo && appTranslations.dashboard.demoSuffix}
                        </p>
                        <Link
                            className='primary-action intro-action'
                            href='/alerts/new'
                        >
                            <Plus size={18} />
                            {appTranslations.dashboard.newAlert}
                        </Link>
                        <section className='scan-card'>
                            <div className='radar' aria-hidden='true'>
                                <span />
                            </div>
                            <div className='scan-copy'>
                                <span className='status'>
                                    <i />
                                    {appTranslations.dashboard.scanActive}
                                </span>
                                <strong>
                                    {appTranslations.dashboard.nextScan(
                                        schedule.nextLabel,
                                    )}
                                </strong>
                                <small>
                                    {appTranslations.dashboard.dailyScan(
                                        schedule.localTime,
                                    )}
                                </small>
                            </div>
                            <span className='scan-count'>
                                <b>{activeAlertsCount}</b>
                                {appTranslations.dashboard.routeNoun(
                                    activeAlertsCount,
                                )}
                            </span>
                        </section>
                    </aside>
                    <section
                        className='dashboard-feed'
                        data-dashboard-feed
                        aria-label={appTranslations.dashboard.navigation.dashboard}
                    >
                        <AlertsSection
                            key={alerts
                                .map((alert) => `${alert.id}:${alert.active}`)
                                .join('|')}
                            alerts={alerts}
                            airportLabels={airportLabels}
                        />
                        <EnablePushBanner />
                    </section>
                </div>
            </div>
            <nav
                className='bottom-nav'
                aria-label={appTranslations.dashboard.ariaLabel}
            >
                <Link className='selected' href='/'>
                    <Home />
                    {appTranslations.dashboard.navigation.dashboard}
                </Link>
                <Link className='nav-create' href='/alerts/new'>
                    <span aria-hidden='true'>
                        <Plus />
                    </span>
                    {appTranslations.dashboard.navigation.newAlert}
                </Link>
                <Link href='/settings'>
                    <Settings />
                    {appTranslations.dashboard.navigation.settings}
                </Link>
            </nav>
        </main>
    );
}
