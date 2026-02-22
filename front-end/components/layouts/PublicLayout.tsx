import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { LanguageCode, User } from '../../types';
interface PublicLayoutProps {
    lang: LanguageCode;
    user: User | null;
    cartCount: number;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    lang, user, cartCount
}) => {
    return (
        <div className="min-h-screen bg-transparent text-gray-100 font-sans flex flex-col">
            <Navbar
                lang={lang}
                cartCount={cartCount}
                user={user}
            />
            <main className="min-h-screen">
                <Outlet />
            </main>
            <Footer lang={lang} />
        </div>
    );
};
