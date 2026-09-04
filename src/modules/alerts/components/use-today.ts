'use client';

import { useSyncExternalStore } from 'react';
import { todayInWarsaw } from '@/src/modules/alerts/dates';

function subscribe(onChange: () => void) {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
        timer = setTimeout(() => {
            onChange();
            schedule();
        }, 60_000 - Date.now() % 60_000);
    };
    schedule();
    window.addEventListener('focus', onChange);
    window.addEventListener('pageshow', onChange);
    document.addEventListener('visibilitychange', onChange);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('focus', onChange);
        window.removeEventListener('pageshow', onChange);
        document.removeEventListener('visibilitychange', onChange);
    };
}

export function useToday() {
    return useSyncExternalStore(subscribe, todayInWarsaw, todayInWarsaw);
}
