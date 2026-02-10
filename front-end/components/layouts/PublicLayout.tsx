import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { ViewState, LanguageCode, User } from '../../types';

interface PublicLayoutProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    lang: LanguageCode;
    user: User | null;
    view: ViewState;
    setView: (view: ViewState) => void;
    lang: LanguageCode;
    user: User | null;
    cartCount: number;
    toggleAuth: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    view, setView, lang, user, cartCount, toggleAuth
}) => {
    return (
        <div className="min-h-screen bg-slate-900 text-gray-100 font-sans">
            <Navbar
                view={view}
                setView={setView}
                lang={lang}
                cartCount={cartCount}
                onAuthClick={toggleAuth}
                user={user}
            />
            <main className="min-h-screen">
                <Outlet />
            </main>
            <Footer setView={setView} lang={lang} />
        </div>
    );
};
