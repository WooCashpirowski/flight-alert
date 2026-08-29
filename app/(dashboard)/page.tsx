/* eslint-disable @next/next/no-img-element */
import { Filter, Gauge, Home, Plus, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData } from '@/src/modules/alerts/queries';
import { EnablePushBanner } from '@/src/modules/notifications/components/enable-push-banner';
import { formatPrice } from '@/src/shared/lib/utils';

export default async function DashboardPage() {
    const { alerts, name, demo } = await getDashboardData();
    const date = new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
        .format(new Date())
        .toUpperCase();
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
                    <button
                        className='avatar'
                        type='button'
                        aria-label='Otwórz profil'
                    >
                        <UserRound size={16} />
                    </button>
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
                        <strong>Kolejne sprawdzenie jutro o 08:00</strong>
                        <small>Harmonogram: codziennie o 07:00 UTC</small>
                    </div>
                    <span className='scan-count'>
                        <b>{alerts.filter((alert) => alert.active).length}</b>{' '}
                        trasy
                    </span>
                </section>
                <section className='section'>
                    <div className='section-heading'>
                        <div>
                            <p className='eyebrow'>TWOJE TRASY</p>
                            <h2>Aktywne alerty</h2>
                        </div>
                        <button className='filter-button' type='button'>
                            <Filter size={13} /> Filtry
                        </button>
                    </div>
                    {alerts.length ? (
                        <div className='alert-grid'>
                            {alerts.map((alert, index) => (
                                <article
                                    className={`alert-card ${index % 2 ? 'violet' : 'mint'}`}
                                    key={alert.id}
                                >
                                    <div className='alert-topline'>
                                        <span className='route-pill'>
                                            {alert.origin} → {alert.destination}
                                        </span>
                                        <span className='active-pill'>
                                            <i />{' '}
                                            {alert.active
                                                ? 'Aktywny'
                                                : 'Wstrzymany'}
                                        </span>
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
                                                    ? formatPrice(
                                                          alert.bestPrice,
                                                      )
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
                            <h3>Dodaj pierwszą trasę</h3>
                            <p>
                                Zaczniemy sprawdzać ceny od najbliższego skanu.
                            </p>
                            <Link href='/alerts/new'>Utwórz alert</Link>
                        </div>
                    )}
                </section>
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
