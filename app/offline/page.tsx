import { Plane, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { appTranslations } from '@/src/translations/pl/app';
export default function OfflinePage() {
    return (
        <main className='offline-page'>
            <div className='brand-mark'>
                <Plane size={20} />
            </div>
            <WifiOff size={32} />
            <h1>{appTranslations.offline.title}</h1>
            <p>{appTranslations.offline.description}</p>
            <Link href='/'>{appTranslations.offline.retry}</Link>
        </main>
    );
}
