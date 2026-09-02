'use client';

import { BellRing, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

function vapidKey(value: string) {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(new ArrayBuffer(raw.length));
    for (let index = 0; index < raw.length; index += 1)
        output[index] = raw.charCodeAt(index);
    return output;
}

export function EnablePushBanner() {
    const [status, setStatus] = useState<
        'checking' | 'idle' | 'loading' | 'enabled' | 'error'
    >('checking');
    const [message, setMessage] = useState(
        'Włącz powiadomienia i dowiedz się jako pierwszy.',
    );

    useEffect(() => {
        let active = true;
        async function checkSubscription() {
            try {
                if (
                    !('serviceWorker' in navigator) ||
                    !('PushManager' in window)
                ) {
                    if (active) setStatus('idle');
                    return;
                }
                const registration = await navigator.serviceWorker.ready;
                const subscription =
                    await registration.pushManager.getSubscription();
                if (!subscription) {
                    if (active) setStatus('idle');
                    return;
                }
                const response = await fetch('/api/push/subscription', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(subscription.toJSON()),
                });
                if (active) setStatus(response.ok ? 'enabled' : 'idle');
            } catch {
                if (active) setStatus('idle');
            }
        }
        void checkSubscription();
        return () => {
            active = false;
        };
    }, []);

    async function enable() {
        setStatus('loading');
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window))
                throw new Error('Ta przeglądarka nie obsługuje Web Push.');
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicKey)
                throw new Error(
                    'Powiadomienia będą dostępne po konfiguracji VAPID.',
                );
            const permission = await Notification.requestPermission();
            if (permission !== 'granted')
                throw new Error(
                    'Zezwolenie na powiadomienia nie zostało udzielone.',
                );
            const registration = await navigator.serviceWorker.ready;
            const existing = await registration.pushManager.getSubscription();
            const subscription =
                existing ??
                (await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: vapidKey(publicKey),
                }));
            const response = await fetch('/api/push/subscription', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
            });
            if (!response.ok)
                throw new Error('Nie udało się zapisać urządzenia.');
            setStatus('enabled');
        } catch (error) {
            setStatus('error');
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Nie udało się włączyć powiadomień.',
            );
        }
    }

    if (status === 'checking' || status === 'enabled') return null;

    return (
        <aside className='push-banner' aria-live='polite'>
            <span className='bell'>
                <BellRing size={18} />
            </span>
            <div>
                <strong>Nie przegap spadku ceny</strong>
                <p>{message}</p>
            </div>
            <button
                type='button'
                disabled={status === 'loading'}
                onClick={enable}
            >
                {status === 'loading' ? (
                    <LoaderCircle className='spin' size={15} />
                ) : (
                    'Włącz'
                )}
            </button>
        </aside>
    );
}
