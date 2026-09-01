'use client';

import { useState } from 'react';
import { LogOut, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/src/modules/auth/actions';

export function ProfileMenu({ email }: { email: string | null }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`profile-menu ${isOpen ? 'open' : ''}`}>
            <button
                className='avatar'
                type='button'
                aria-label='Otwórz profil'
                aria-expanded={isOpen}
                aria-controls='profile-popover'
                onClick={() => setIsOpen((value) => !value)}
            >
                <UserRound size={16} />
            </button>
            {isOpen && (
                <div className='profile-popover' id='profile-popover'>
                    <div className='profile-identity'>
                        <span>
                            <UserRound size={15} />
                        </span>
                        <div>
                            <small>Zalogowano jako</small>
                            <strong>{email ?? 'Tryb demo'}</strong>
                        </div>
                    </div>
                    <Link href='/settings' onClick={() => setIsOpen(false)}>
                        <Settings size={15} /> Ustawienia
                    </Link>
                    <form action={signOut}>
                        <button type='submit'>
                            <LogOut size={15} /> Wyloguj się
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
