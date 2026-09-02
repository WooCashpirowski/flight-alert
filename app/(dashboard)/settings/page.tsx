import { ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { EnablePushBanner } from '@/src/modules/notifications/components/enable-push-banner';
import { PasswordForm } from '@/src/modules/auth/components/password-form';
import { getWhitelistedUser } from '@/src/modules/auth/guard';
import { appTranslations } from '@/src/translations/pl/app';

export default async function SettingsPage() {
    const user = await getWhitelistedUser();

    return (
        <main className='form-page' id='main-content'>
            <header className='form-header'>
                <Link
                    className='icon-button'
                    href='/'
                    aria-label={appTranslations.common.back}
                >
                    <ArrowLeft size={19} />
                </Link>
                <div>
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
            <EnablePushBanner persistent />
        </main>
    );
}
