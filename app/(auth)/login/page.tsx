/* eslint-disable @next/next/no-img-element */
import { ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/src/modules/auth/components/login-form';

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
                    <span>Flight Alert</span>
                </div>
                <p className='eyebrow'>PRYWATNY DOSTĘP</p>
                <h1>
                    Twoje okazje
                    <br />
                    czekają.
                </h1>
                <p className='auth-copy'>
                    Zaloguj się hasłem lub utwórz konto, korzystając z adresu
                    zatwierdzonego przez administratora.
                </p>
                <LoginForm nextPath={nextPath} />
                <p className='security-note'>
                    <ShieldCheck aria-hidden='true' size={15} /> Dostęp tylko
                    dla osób z listy administratora
                </p>
            </section>
        </main>
    );
}
