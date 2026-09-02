import { Compass, Plane } from 'lucide-react';
import Link from 'next/link';
import { appTranslations } from '@/src/translations/pl/app';

export default function NotFoundPage() {
    return (
        <main className='offline-page' id='main-content'>
            <div className='brand-mark'>
                <Plane size={20} aria-hidden='true' />
            </div>
            <Compass size={34} aria-hidden='true' />
            <h1>{appTranslations.notFound.title}</h1>
            <p>{appTranslations.notFound.description}</p>
            <Link href='/'>{appTranslations.notFound.action}</Link>
        </main>
    );
}
