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

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    lang, user, cartCount
}) => {
    const { settings } = useSettings();
    const hasBanner = settings.announcementBanner?.enabled && settings.announcementBanner?.text;

    return (
        <div className={`min-h-screen bg-transparent text-gray-100 font-sans flex flex-col transition-all duration-300 ${hasBanner ? 'pt-10' : ''}`}>
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
