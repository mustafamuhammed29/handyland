
import React, { useState } from 'react';
import { Menu, X, Smartphone, Wrench, BarChart3, ShoppingBag, User as UserIcon, ShoppingCart, Home } from 'lucide-react';
import { LanguageCode, User } from '../types';
import { translations } from '../i18n';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  lang: LanguageCode;
  setLang?: (lang: LanguageCode) => void; // Made optional as it might not be passed always or handled by context
  user: User | null;
  cartCount: number; // Add cartCount as it was passed in PublicLayout
}

export const Navbar: React.FC<NavbarProps> = ({ lang, user, cartCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, setIsCartOpen } = useCart();
  const { settings } = useSettings(); // Use Global Settings
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { label: t('nav.home', 'Startseite'), path: '/', icon: <Home className="w-4 h-4" /> },
    { label: t('nav.marketplace', 'Marketplace'), path: '/marketplace', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: t('nav.repair', 'Reparatur'), path: '/repair', icon: <Wrench className="w-4 h-4" /> },
    { label: t('nav.sell', 'Verkaufen'), path: '/valuation', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rtl:left-auto rtl:right-1/2 rtl:translate-x-1/2">
      <div className="glass-modern rounded-3xl px-6 py-4 border border-slate-700/50 shadow-2xl">
        <div className="flex justify-between items-center">

          {/* Logo - Dynamic from Settings */}
          <Link to="/" className="flex items-center cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center me-3 shadow-lg group-hover:rotate-12 transition-transform">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">
              {settings.navbar?.logoText || 'HANDY'}<span className="text-cyan-400">{settings.navbar?.logoAccentText || 'LAND'}</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 bg-black/30 rounded-full p-1 border border-slate-800/50">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${location.pathname === item.path
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                <span className="me-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            {(settings.navbar?.showLanguageSwitcher !== false) && (
              <LanguageSwitcher />
            )}

            <button onClick={() => setIsCartOpen(true)} className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition-colors group">
              <ShoppingCart className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 w-4 h-4 bg-cyan-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border border-black">{cart.length}</span>}
            </button>

            <Link
              to={user ? '/dashboard' : '/login'}
              className={`w-10 h-10 flex items-center justify-center text-white rounded-xl shadow-lg transition-all active:scale-90 ${user ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-cyan-600 shadow-cyan-900/20'
                }`}
            >
              <UserIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
