import { ArrowLeft, BellRing, KeyRound, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { EnablePushBanner } from '@/src/modules/notifications/components/enable-push-banner';
import { PasswordForm } from '@/src/modules/auth/components/password-form';
import { getWhitelistedUser } from '@/src/modules/auth/guard';

export default async function SettingsPage() {
    const user = await getWhitelistedUser();

    return (
        <main className='form-page'>
            <header className='form-header'>
                <Link className='icon-button' href='/'>
                    <ArrowLeft size={19} />
                </Link>
                <div>
                    <p className='eyebrow'>FLIGHT ALERT</p>
                    <h1>Ustawienia</h1>
                </div>
            </header>
            {user && (
                <section className='settings-card account-settings'>
                    <KeyRound size={22} />
                    <div>
                        <h2>Logowanie i konto</h2>
                        <p>{user.email}</p>
                        <p>
                            Ustaw hasło także wtedy, gdy konto zostało wcześniej
                            utworzone przez magic link.
                        </p>
                        <PasswordForm />
                    </div>
                </section>
            )}
            <section className='settings-card'>
                <Smartphone size={22} />
                <div>
                    <h2>Aplikacja</h2>
                    <p>Dodaj Flight Alert do ekranu głównego.</p>
                </div>
            </section>
            <section className='settings-card'>
                <BellRing size={22} />
                <div>
                    <h2>Powiadomienia</h2>
                    <p>Maksymalnie jeden zbiorczy komunikat dziennie.</p>
                </div>
            </section>
            <EnablePushBanner />
        </main>
    );
}
