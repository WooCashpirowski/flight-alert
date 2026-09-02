'use client';

import { useState } from 'react';
import { LogOut, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/src/modules/auth/actions';
import { authTranslations } from '@/src/translations/pl/auth';

export function ProfileMenu({ email }: { email: string | null }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`profile-menu ${isOpen ? 'open' : ''}`}>
            <button
                className='avatar'
                type='button'
                aria-label={authTranslations.profile.open}
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
