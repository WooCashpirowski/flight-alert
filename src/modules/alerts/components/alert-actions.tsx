'use client';

import { useState, useTransition } from 'react';
import { LoaderCircle, Pause, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteAlert, toggleAlert } from '@/src/modules/alerts/actions';
import { alertTranslations } from '@/src/translations/pl/alerts';

export function AlertActions({ id, active }: { id: string; active: boolean }) {
    const router = useRouter();
    const [message, setMessage] = useState<string>();
    const [isPending, startTransition] = useTransition();

    function changeState() {
        setMessage(undefined);
        startTransition(async () => {
            const result = await toggleAlert(id, !active);
            setMessage(result.message);
            if (result.ok) router.refresh();
        });
    }

    function remove() {
        if (!window.confirm(alertTranslations.controls.deleteConfirmation))
            return;
        setMessage(undefined);
        startTransition(async () => {
            const result = await deleteAlert(id);
            setMessage(result.message);
            if (result.ok) {
                router.replace('/');
            }
        });
    }

    return (
        <div className='alert-actions'>
            <button
                type='button'
                className='secondary-action'
                disabled={isPending}
                onClick={changeState}
            >
                {isPending ? (
                    <LoaderCircle className='spin' size={16} />
                ) : active ? (
                    <Pause size={16} />
                ) : (
                    <Play size={16} />
                )}
                {active
                    ? alertTranslations.controls.pause
                    : alertTranslations.controls.resume}
            </button>
            <button
                type='button'
                className='danger-action'
                disabled={isPending}
                onClick={remove}
            >
                <Trash2 size={16} /> {alertTranslations.controls.delete}
            </button>
            {message && (
                <p className='form-message' role='status'>
                    {message}
                </p>
            )}
        </div>
    );
}
