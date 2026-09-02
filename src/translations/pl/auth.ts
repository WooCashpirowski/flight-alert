export const authTranslations = {
    validation: {
        email: 'Podaj poprawny adres e-mail',
        invalidEmail: 'Niepoprawny e-mail',
        passwordMin: 'Hasło musi mieć co najmniej 8 znaków',
        passwordMax: 'Hasło może mieć maksymalnie 72 znaki',
        invalidPassword: 'Niepoprawne hasło',
        passwordsMismatch: 'Hasła nie są takie same.',
    },
    actions: {
        loginUnavailable:
            'Logowanie jest niedostępne w trybie demonstracyjnym.',
        accessDenied: 'Brak dostępu. Skontaktuj się z administratorem.',
        signedIn: 'Zalogowano pomyślnie.',
        invalidCredentials: 'Nieprawidłowy e-mail lub hasło.',
        registrationUnavailable:
            'Rejestracja jest niedostępna w trybie demonstracyjnym.',
        emailNotAllowed: 'Ten adres nie znajduje się na liście dostępu.',
        accountCreated: 'Konto zostało utworzone.',
        confirmEmail:
            'Sprawdź skrzynkę i potwierdź adres e-mail. Potem zalogujesz się hasłem.',
        smtpUnavailable:
            'Nie można wysłać potwierdzenia na ten adres. Administrator musi skonfigurować wysyłkę SMTP.',
        rateLimited:
            'Wysłano zbyt wiele wiadomości. Odczekaj chwilę i spróbuj ponownie.',
        registrationFailed:
            'Nie udało się utworzyć konta. Jeśli korzystałeś wcześniej z magic linku, ustaw hasło w Ustawieniach w aktywnej sesji.',
        passwordChangeUnavailable:
            'Zmiana hasła jest niedostępna w trybie demonstracyjnym.',
        sessionExpired: 'Sesja wygasła. Zaloguj się ponownie.',
        passwordSaved:
            'Hasło zostało zapisane. Możesz używać go na wszystkich urządzeniach.',
        passwordSaveFailed: 'Nie udało się zapisać hasła. Spróbuj ponownie.',
    },
    page: {
        eyebrow: 'PRYWATNY DOSTĘP',
        titleFirstLine: 'Twoje okazje',
        titleSecondLine: 'czekają.',
        description:
            'Zaloguj się hasłem lub utwórz konto, korzystając z adresu zatwierdzonego przez administratora.',
        securityNote: 'Dostęp tylko dla osób z listy administratora',
    },
    form: {
        accessMethod: 'Wybierz sposób dostępu',
        loginTab: 'Logowanie',
        registerTab: 'Rejestracja',
        email: 'Adres e-mail',
        emailPlaceholder: 'ty@example.com',
        password: 'Hasło',
        passwordPlaceholder: 'Minimum 8 znaków',
        confirmation: 'Powtórz hasło',
        confirmationPlaceholder: 'Wpisz hasło ponownie',
        loginSubmit: 'Zaloguj się',
        registerSubmit: 'Utwórz konto',
        newPassword: 'Nowe hasło',
        savePassword: 'Zapisz hasło',
    },
    profile: {
        open: 'Otwórz profil',
        signedInAs: 'Zalogowano jako',
        demo: 'Tryb demo',
        settings: 'Ustawienia',
        signOut: 'Wyloguj się',
    },
} as const;
