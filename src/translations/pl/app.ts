export const appTranslations = {
    common: {
        name: 'Flight Alert',
        back: 'Wróć',
    },
    metadata: {
        defaultTitle: 'Flight Alert — tanie loty bez ciągłego szukania',
        titleTemplate: '%s · Flight Alert',
        description:
            'Prywatne alerty cenowe lotów z jednym zwięzłym powiadomieniem dziennie.',
        tagline: 'Tanie loty bez ciągłego szukania',
        imageAlt: 'Flight Alert — tanie loty bez ciągłego szukania',
        manifestDescription: 'Prywatne alerty cenowe lotów',
    },
    offline: {
        title: 'Jesteś offline',
        description:
            'Twoje alerty nadal działają w chmurze. Wróć, gdy odzyskasz połączenie.',
        retry: 'Spróbuj ponownie',
    },
    notFound: {
        title: 'Nie ma tu tej strony',
        description:
            'Adres mógł się zmienić albo alert został usunięty. Wróć do panelu i wybierz istniejącą trasę.',
        action: 'Wróć do panelu',
    },
    dashboard: {
        ariaLabel: 'Panel alertów lotniczych',
        greeting: (name: string) => `Dzień dobry, ${name}`,
        hero: 'Pilnujemy cen, Ty planujesz podróż.',
        demoSuffix: ' Teraz oglądasz bezpieczny tryb demo.',
        newAlert: 'Nowy alert',
        scanActive: 'SKANOWANIE AKTYWNE',
        nextScan: (date: string) => `Kolejne planowane sprawdzenie: ${date}`,
        dailyScan: (time: string) =>
            `Codziennie około ${time} czasu polskiego (07:00 UTC)`,
        routeNoun: (count: number) => {
            const lastTwo = count % 100;
            const last = count % 10;
            const noun =
                count === 1
                    ? 'trasa'
                    : last >= 2 &&
                        last <= 4 &&
                        !(lastTwo >= 12 && lastTwo <= 14)
                      ? 'trasy'
                      : 'tras';
            return noun;
        },
        navigation: {
            dashboard: 'Panel',
            newAlert: 'Nowy alert',
            settings: 'Ustawienia',
        },
    },
    loading: {
        page: 'Ładowanie strony',
    },
    settings: {
        eyebrow: 'FLIGHT ALERT',
        title: 'Ustawienia',
        accountTitle: 'Logowanie i konto',
        accountDescription:
            'Ustaw hasło także wtedy, gdy konto zostało wcześniej utworzone przez magic link.',
        appTitle: 'Aplikacja',
        appDescription: 'Dodaj Flight Alert do ekranu głównego.',
        notificationsTitle: 'Powiadomienia',
        notificationsDescription:
            'Maksymalnie jeden zbiorczy komunikat dziennie.',
    },
} as const;
