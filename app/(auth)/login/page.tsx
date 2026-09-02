/* eslint-disable @next/next/no-img-element */
import { ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/src/modules/auth/components/login-form';
import { appTranslations } from '@/src/translations/pl/app';
import { authTranslations } from '@/src/translations/pl/auth';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const { next } = await searchParams;
    const nextPath =
        next?.startsWith('/') && !next.startsWith('//') ? next : '/';
    return (
        <main className='auth-page'>
            <section className='auth-card'>
                <div className='brand auth-brand'>
                    <span className='brand-app-icon'>
                        <img
                            src='/icons/icon-192.png'
                            alt=''
                            width='32'
                            height='32'
                        />
                    </span>
                    <span>{appTranslations.common.name}</span>
                </div>
                <p className='eyebrow'>{authTranslations.page.eyebrow}</p>
                <h1>
                    {authTranslations.page.titleFirstLine}
                    <br />
                    {authTranslations.page.titleSecondLine}
                </h1>
                <p className='auth-copy'>
                    {authTranslations.page.description}
                </p>
                <LoginForm nextPath={nextPath} />
                <p className='security-note'>
                    <ShieldCheck aria-hidden='true' size={15} />{' '}
                    {authTranslations.page.securityNote}
                </p>
            </section>
        </main>
    );
}
