import { ArrowLeft, BellRing, KeyRound, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { EnablePushBanner } from '@/src/modules/notifications/components/enable-push-banner';
import { PasswordForm } from '@/src/modules/auth/components/password-form';
import { getWhitelistedUser } from '@/src/modules/auth/guard';
import { appTranslations } from '@/src/translations/pl/app';

export default async function SettingsPage() {
    const user = await getWhitelistedUser();

    return (
        <main className='form-page'>
            <header className='form-header'>
                <Link className='icon-button' href='/'>
                    <ArrowLeft size={19} />
                </Link>
                <div>
                    <p className='eyebrow'>{appTranslations.settings.eyebrow}</p>
                    <h1>{appTranslations.settings.title}</h1>
                </div>
            </header>
            {user && (
                <section className='settings-card account-settings'>
                    <KeyRound size={22} />
                    <div>
                        <h2>{appTranslations.settings.accountTitle}</h2>
                        <p>{user.email}</p>
                        <p>
                            {appTranslations.settings.accountDescription}
                        </p>
                        <PasswordForm />
                    </div>
                </section>
            )}
            <section className='settings-card'>
                <Smartphone size={22} />
                <div>
                    <h2>{appTranslations.settings.appTitle}</h2>
                    <p>{appTranslations.settings.appDescription}</p>
                </div>
            </section>
            <section className='settings-card'>
                <BellRing size={22} />
                <div>
                    <h2>{appTranslations.settings.notificationsTitle}</h2>
                    <p>{appTranslations.settings.notificationsDescription}</p>
                </div>
            </section>
            <EnablePushBanner />
        </main>
    );
}
