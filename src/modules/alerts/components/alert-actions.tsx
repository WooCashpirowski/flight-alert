'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { LoaderCircle, Pause, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteAlert, toggleAlert } from '@/src/modules/alerts/actions';
import { alertTranslations } from '@/src/translations/pl/alerts';

export function AlertActions({ id, active }: { id: string; active: boolean }) {
    const router = useRouter();
    const [message, setMessage] = useState<string>();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [isPending, startTransition] = useTransition();
    const deleteButtonRef = useRef<HTMLButtonElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!confirmingDelete) return;
        confirmButtonRef.current?.focus();

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setConfirmingDelete(false);
            deleteButtonRef.current?.focus();
        }

        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [confirmingDelete]);

    function changeState() {
        setMessage(undefined);
        startTransition(async () => {
            const result = await toggleAlert(id, !active);
            setMessage(result.message);
            if (result.ok) router.refresh();
        });
    }

    function remove() {
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
                ref={deleteButtonRef}
                type='button'
                className='danger-action'
                disabled={isPending}
                onClick={() => setConfirmingDelete(true)}
            >
                <Trash2 size={16} /> {alertTranslations.controls.delete}
            </button>
            {confirmingDelete && (
                <section
                    className='delete-confirmation'
                    role='alertdialog'
                    aria-labelledby='delete-alert-title'
                    aria-describedby='delete-alert-description'
                >
                    <div>
                        <strong id='delete-alert-title'>
                            {alertTranslations.controls.deleteDialogTitle}
                        </strong>
                        <p id='delete-alert-description'>
                            {alertTranslations.controls.deleteConfirmation}
                        </p>
                    </div>
                    <div className='delete-confirmation-actions'>
                        <button
                            type='button'
                            className='secondary-action'
                            disabled={isPending}
                            onClick={() => setConfirmingDelete(false)}
                        >
                            {alertTranslations.controls.cancel}
                        </button>
                        <button
                            ref={confirmButtonRef}
                            type='button'
                            className='danger-action'
                            disabled={isPending}
                            onClick={remove}
                        >
                            {isPending ? (
                                <LoaderCircle className='spin' size={16} />
                            ) : (
                                <Trash2 size={16} />
                            )}
                            {alertTranslations.controls.confirmDelete}
                        </button>
                    </div>
                </section>
            )}
            {message && (
                <p className='form-message' role='status'>
                    {message}
                </p>
            )}
        </div>
    );
}
