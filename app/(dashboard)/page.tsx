/* eslint-disable @next/next/no-img-element */
import { Home, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData } from '@/src/modules/alerts/queries';
import { AlertsSection } from '@/src/modules/alerts/components/alerts-section';
import { ProfileMenu } from '@/src/modules/auth/components/profile-menu';
import { EnablePushBanner } from '@/src/modules/notifications/components/enable-push-banner';

function scanSchedule(now = new Date()) {
    const next = new Date(now);
    next.setUTCHours(7, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const formatter = new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Warsaw',
    });
    const localTime = new Intl.DateTimeFormat('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Warsaw',
    }).format(next);
    return { nextLabel: formatter.format(next), localTime };
}

export default async function DashboardPage() {
    const { alerts, name, email, demo } = await getDashboardData();
    const now = new Date();
    const date = new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
        .format(now)
        .toUpperCase();
    const schedule = scanSchedule(now);

    return (
        <main className='app-shell'>
            <div className='ambient ambient-one' />
            <div className='ambient ambient-two' />
            <section
                className='dashboard'
                aria-label='Panel alertów lotniczych'
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
                        <span>Flight Alert</span>
                    </Link>
                    <ProfileMenu email={email} />
                </header>
                <div className='hero'>
                    <div>
                        <p className='eyebrow'>{date}</p>
                        <h1>Dzień dobry, {name}</h1>
                        <p className='hero-copy'>
                            Pilnujemy cen, Ty planujesz podróż.
                            {demo && ' Teraz oglądasz bezpieczny tryb demo.'}
                        </p>
                    </div>
                    <Link className='primary-action' href='/alerts/new'>
                        <Plus size={18} /> Nowy alert
                    </Link>
                </div>
                <section className='scan-card'>
                    <div className='radar'>
                        <span />
                    </div>
                    <div className='scan-copy'>
                        <span className='status'>
                            <i /> SKANOWANIE AKTYWNE
                        </span>
                        <strong>
                            Kolejne planowane sprawdzenie: {schedule.nextLabel}
                        </strong>
                        <small>
                            Codziennie około {schedule.localTime} czasu
                            polskiego (07:00 UTC)
                        </small>
                    </div>
                    <span className='scan-count'>
                        <b>{alerts.filter((alert) => alert.active).length}</b>{' '}
                        trasy
                    </span>
                </section>
                <AlertsSection
                    key={alerts
                        .map((alert) => `${alert.id}:${alert.active}`)
                        .join('|')}
                    alerts={alerts}
                />
                <EnablePushBanner />
            </section>
            <nav className='bottom-nav'>
                <Link className='selected' href='/'>
                    <Home />
                    Panel
                </Link>
                <Link href='/alerts/new'>
                    <Plus />
                    Nowy alert
                </Link>
                <Link href='/settings'>
                    <Settings />
                    Ustawienia
                </Link>
            </nav>
        </main>
    );
}
