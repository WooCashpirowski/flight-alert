'use client';

import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/src/modules/auth/actions';
import { authTranslations } from '@/src/translations/pl/auth';

export function ProfileMenu({ email }: { email: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        function closeOnOutsideClick(event: PointerEvent) {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setIsOpen(false);
            triggerRef.current?.focus();
        }

        document.addEventListener('pointerdown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);

    return (
        <div
            className={`profile-menu ${isOpen ? 'open' : ''}`}
            ref={menuRef}
        >
            <button
                ref={triggerRef}
                className='avatar'
                type='button'
                aria-label={authTranslations.profile.open}
                aria-expanded={isOpen}
                aria-controls='profile-popover'
                aria-haspopup='dialog'
                onClick={() => setIsOpen((value) => !value)}
            >
                <UserRound size={16} />
            </button>
            {isOpen && (
                <div
                    className='profile-popover'
                    id='profile-popover'
                    role='dialog'
                    aria-label={authTranslations.profile.signedInAs}
                >
                    <div className='profile-identity'>
                        <span>
                            <UserRound size={15} />
                        </span>
                        <div>
                            <small>{authTranslations.profile.signedInAs}</small>
                            <strong>
                                {email ?? authTranslations.profile.demo}
                            </strong>
                        </div>
                    </div>
                    <Link href='/settings' onClick={() => setIsOpen(false)}>
                        <Settings size={15} />{' '}
                        {authTranslations.profile.settings}
                    </Link>
                    <form action={signOut}>
                        <button type='submit'>
                            <LogOut size={15} />{' '}
                            {authTranslations.profile.signOut}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
