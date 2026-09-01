'use client';

import { useState, useTransition } from 'react';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { updatePassword } from '@/src/modules/auth/actions';

export function PasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [message, setMessage] = useState<string>();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    return (
        <form
            className='password-form'
            onSubmit={(event) => {
                event.preventDefault();
                startTransition(async () => {
                    const result = await updatePassword(password, confirmation);
                    setMessage(result.message);
                    setIsSuccess(result.ok);
                    if (result.ok) {
                        setPassword('');
                        setConfirmation('');
                    }
                });
            }}
        >
            <label htmlFor='new-password'>
                Nowe hasło
                <input
                    id='new-password'
                    type='password'
                    autoComplete='new-password'
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
            </label>
            <label htmlFor='new-password-confirmation'>
                Powtórz hasło
                <input
                    id='new-password-confirmation'
                    type='password'
                    autoComplete='new-password'
                    minLength={8}
                    maxLength={72}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                />
            </label>
            <button type='submit' disabled={isPending}>
                {isPending ? (
                    <LoaderCircle className='spin' size={16} />
                ) : (
                    <KeyRound size={16} />
                )}{' '}
                Zapisz hasło
            </button>
            {message && (
                <p
                    className={`form-message ${isSuccess ? 'success' : 'error'}`}
                    role='status'
                >
                    {message}
                </p>
            )}
        </form>
    );
}
