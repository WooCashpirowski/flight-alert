'use client';

import { useState, useTransition } from 'react';
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import {
    registerWithPassword,
    signInWithPassword,
} from '@/src/modules/auth/actions';
import { authTranslations } from '@/src/translations/pl/auth';

type Mode = 'login' | 'register';

export function LoginForm({ nextPath = '/' }: { nextPath?: string }) {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [message, setMessage] = useState<string>();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    function changeMode(nextMode: Mode) {
        setMode(nextMode);
        setMessage(undefined);
        setIsSuccess(false);
        setPassword('');
        setConfirmation('');
    }

    return (
        <>
            <div
                className='auth-tabs'
                role='tablist'
                aria-label={authTranslations.form.accessMethod}
            >
                <button
                    type='button'
                    role='tab'
                    aria-selected={mode === 'login'}
                    onClick={() => changeMode('login')}
                >
                    {authTranslations.form.loginTab}
                </button>
                <button
                    type='button'
                    role='tab'
                    aria-selected={mode === 'register'}
                    onClick={() => changeMode('register')}
                >
                    {authTranslations.form.registerTab}
                </button>
            </div>
            <form
                className='auth-form'
                onSubmit={(event) => {
                    event.preventDefault();
                    setMessage(undefined);
                    setIsSuccess(false);
                    if (mode === 'register' && password !== confirmation) {
                        setMessage(
                            authTranslations.validation.passwordsMismatch,
                        );
                        return;
                    }
                    startTransition(async () => {
                        const result =
                            mode === 'login'
                                ? await signInWithPassword(email, password)
                                : await registerWithPassword(email, password);
                        setMessage(result.message);
                        setIsSuccess(result.ok);
                        if (result.authenticated) {
                            const safeNextPath =
                                nextPath.startsWith('/') &&
                                !nextPath.startsWith('//')
                                    ? nextPath
                                    : '/';
                            window.location.assign(safeNextPath);
                        }
                    });
                }}
            >
                <label htmlFor='email'>{authTranslations.form.email}</label>
                <div className='input-with-icon'>
                    <Mail aria-hidden='true' size={18} />
                    <input
                        id='email'
                        type='email'
                        autoComplete='email'
                        placeholder={authTranslations.form.emailPlaceholder}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>
                <label htmlFor='password'>{authTranslations.form.password}</label>
                <div className='input-with-icon'>
                    <LockKeyhole aria-hidden='true' size={18} />
                    <input
                        id='password'
                        type='password'
                        autoComplete={
                            mode === 'login'
                                ? 'current-password'
                                : 'new-password'
                        }
                        minLength={8}
                        maxLength={72}
                        placeholder={authTranslations.form.passwordPlaceholder}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>
                {mode === 'register' && (
                    <>
                        <label htmlFor='confirmation'>
                            {authTranslations.form.confirmation}
                        </label>
                        <div className='input-with-icon'>
                            <LockKeyhole aria-hidden='true' size={18} />
                            <input
                                id='confirmation'
                                type='password'
                                autoComplete='new-password'
                                minLength={8}
                                maxLength={72}
                                placeholder={
                                    authTranslations.form
                                        .confirmationPlaceholder
                                }
                                value={confirmation}
                                onChange={(event) =>
                                    setConfirmation(event.target.value)
                                }
                                required
                            />
                        </div>
                    </>
                )}
                <button
                    className='primary-action wide'
                    disabled={isPending}
                    type='submit'
                >
                    {isPending ? (
                        <LoaderCircle
                            className='spin'
                            aria-hidden='true'
                            size={18}
                        />
                    ) : (
                        <ArrowRight aria-hidden='true' size={18} />
                    )}{' '}
                    {mode === 'login'
                        ? authTranslations.form.loginSubmit
                        : authTranslations.form.registerSubmit}
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
        </>
    );
}
