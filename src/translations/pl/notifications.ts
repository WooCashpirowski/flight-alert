export const notificationTranslations = {
    banner: {
        initialMessage: 'Włącz powiadomienia i dowiedz się jako pierwszy.',
        unsupportedBrowser: 'Ta przeglądarka nie obsługuje Web Push.',
        missingVapid: 'Powiadomienia będą dostępne po konfiguracji VAPID.',
        permissionDenied: 'Zezwolenie na powiadomienia nie zostało udzielone.',
        deviceSaveFailed: 'Nie udało się zapisać urządzenia.',
        enableFailed: 'Nie udało się włączyć powiadomień.',
        title: 'Nie przegap spadku ceny',
        enable: 'Włącz',
    },
    api: {
        subscriptionSaveFailed: 'Nie udało się zapisać powiadomień.',
    },
    push: {
        missingVapid: 'Brak konfiguracji VAPID.',
        singleDealTitle: 'Nowa okazja lotnicza ✈',
        multipleDealsTitle: (count: number) =>
            `${count} nowych okazji lotniczych ✈`,
        cheapest: (
            origin: string,
            destination: string,
            price: number,
            currency: string,
        ) =>
            `Najtaniej: ${origin} → ${destination} za ${Math.round(price)} ${currency}`,
    },
} as const;
