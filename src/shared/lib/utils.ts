import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { i18nConfig } from '@/src/shared/i18n/config';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(value: number, currency = i18nConfig.currency) {
    return new Intl.NumberFormat(i18nConfig.locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}
