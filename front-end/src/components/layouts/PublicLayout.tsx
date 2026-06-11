import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { useSettings } from '../../context/SettingsContext';
import { LanguageCode, User } from '../../types';
interface PublicLayoutProps {
    lang: LanguageCode;
    user: User | null;
    cartCount: number;
}

import { BottomNav } from '../BottomNav';

import { useLocation } from 'react-router-dom';

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    lang, user, cartCount
}) => {
    const { settings } = useSettings();
    const location = useLocation();
    const hasBanner = settings.announcementBanner?.enabled && settings.announcementBanner?.text;
    
    const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

    return (
        <div className={`min-h-[100dvh] bg-transparent text-gray-100 font-sans flex flex-col transition-all duration-300 ${hasBanner ? 'pt-10' : ''} pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0`}>
            <Navbar
                lang={lang}
                cartCount={cartCount}
                user={user}
            />
            <main className="min-h-[100dvh]">
                <Outlet />
            </main>
            {!isAuthPage && <Footer lang={lang} />}
            <BottomNav />
        </div>
    );
};
