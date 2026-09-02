import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistration } from '@/src/modules/pwa/components/service-worker-registration';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : new URL('http://localhost:3000');
export const metadata: Metadata = {
    metadataBase: siteUrl,
    title: {
        default: 'Flight Alert — tanie loty bez ciągłego szukania',
        template: '%s · Flight Alert',
    },
    description:
        'Prywatne alerty cenowe lotów z jednym zwięzłym powiadomieniem dziennie.',
    applicationName: 'Flight Alert',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Flight Alert',
    },
    icons: {
        icon: [
            { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: [
            {
                url: '/icons/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    },
    openGraph: {
        title: 'Flight Alert',
        description: 'Tanie loty bez ciągłego szukania',
        type: 'website',
        locale: 'pl_PL',
        images: [
            {
                url: '/og.png',
                width: 1200,
                height: 630,
                alt: 'Flight Alert — tanie loty bez ciągłego szukania',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Flight Alert',
        description: 'Tanie loty bez ciągłego szukania',
        images: ['/og.png'],
    },
};
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
    themeColor: '#07100d',
    colorScheme: 'dark',
};
export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang='pl' data-scroll-behavior='smooth'>
            <body>
                {children}
                <ServiceWorkerRegistration />
            </body>
        </html>
    );
}
