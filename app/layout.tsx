import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistration } from '@/src/modules/pwa/components/service-worker-registration';
import { i18nConfig } from '@/src/shared/i18n/config';
import { appTranslations } from '@/src/translations/pl/app';
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
        default: appTranslations.metadata.defaultTitle,
        template: appTranslations.metadata.titleTemplate,
    },
    description: appTranslations.metadata.description,
    applicationName: appTranslations.common.name,
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: appTranslations.common.name,
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
        title: appTranslations.common.name,
        description: appTranslations.metadata.tagline,
        type: 'website',
        locale: i18nConfig.openGraphLocale,
        images: [
            {
                url: '/og.png',
                width: 1200,
                height: 630,
                alt: appTranslations.metadata.imageAlt,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: appTranslations.common.name,
        description: appTranslations.metadata.tagline,
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
        <html lang={i18nConfig.htmlLang} data-scroll-behavior='smooth'>
            <body>
                {children}
                <ServiceWorkerRegistration />
            </body>
        </html>
    );
}
