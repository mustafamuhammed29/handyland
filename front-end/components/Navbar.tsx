
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Smartphone, Wrench, BarChart3, ShoppingBag, User as UserIcon, ShoppingCart, Home, Bell, ClipboardList, Heart } from 'lucide-react';
import { User } from '../types';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { GlobalSearchBar } from './GlobalSearchBar';
import { NotificationBell } from './dashboard/NotificationBell';

interface NavbarProps {
  user: User | null;
  cartCount: number; // Add cartCount as it was passed in PublicLayout
}

export const Navbar: React.FC<NavbarProps> = ({ user, cartCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, setIsCartOpen } = useCart();
  const { settings } = useSettings(); // Use Global Settings
  const location = useLocation();
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const iconMap: Record<string, React.ReactNode> = {
    Home: <Home className="w-4 h-4" />,
    ShoppingBag: <ShoppingBag className="w-4 h-4" />,
    Wrench: <Wrench className="w-4 h-4" />,
    BarChart3: <BarChart3 className="w-4 h-4" />
  };

  const navItems = (settings.navbar?.links || []).map(link => {
    // Migration mapping for legacy database keys
    let key = link.labelKey;
    if (key === 'home') key = 'nav.home';
    if (key === 'market') key = 'nav.marketplace';
    if (key === 'repair') key = 'nav.repair';
    if (key === 'valuation') key = 'nav.valuation';

    let translatedLabel = key ? t(key, link.defaultLabel) : link.defaultLabel;
    
    // Failsafe: if translation returns an object (e.g. key doesn't resolve to a string), use default
    if (typeof translatedLabel === 'object') {
      translatedLabel = (link.defaultLabel || '') as any;
    }

    return {
      label: translatedLabel as React.ReactNode,
      path: link.path,
      icon: link.iconName && iconMap[link.iconName] ? iconMap[link.iconName] : <Home className="w-4 h-4" />
    };
  });

  const hasBanner = settings.announcementBanner?.enabled && settings.announcementBanner?.text;

  return (
    <nav className={`fixed left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rtl:left-auto rtl:right-1/2 rtl:translate-x-1/2 transition-all duration-300 ${hasBanner ? 'top-14' : 'top-6'}`}>
      <div className="glass-modern rounded-3xl px-6 py-4 border border-slate-700/50 shadow-2xl">
        <div className="flex justify-between items-center">

          {/* Logo - Dynamic from Settings */}
          <Link to="/" className="flex items-center cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center me-3 shadow-lg group-hover:rotate-12 transition-transform">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">
              {settings.navbar?.logoText || 'HANDY'}<span className="text-brand-primary">{settings.navbar?.logoAccentText || 'LAND'}</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-stretch gap-2 bg-slate-900/60 backdrop-blur-md rounded-full p-1.5 border border-slate-800/50 shadow-inner h-[52px]">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-5 py-2 h-full rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 border border-brand-primary/30 text-brand-primary shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105'
                    : 'text-slate-400 border border-transparent hover:bg-slate-800/60 hover:border-slate-700/50 hover:text-white'
                    }`}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            {/* Track Repair - inside pill */}
            {(() => {
              const isTrackActive = location.pathname === '/track-repair';
              return (
                <Link
                  to="/track-repair"
                  className={`flex items-center gap-1.5 px-4 py-2 h-full rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 border ${isTrackActive
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'border-amber-500/20 text-amber-400/70 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400'
                    }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Track Repair
                </Link>
              );
            })()}
          </div>

          <div className="hidden lg:flex ml-4 flex-1 items-center h-[52px]">
            <GlobalSearchBar className="w-full" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 h-[52px]">
            {/* Language Switcher */}
            {(settings.navbar?.showLanguageSwitcher !== false) && (
              <LanguageSwitcher />
            )}

            {user && (
              <NotificationBell userId={user._id} variant="navbar" />
            )}

            <button onClick={() => setIsCartOpen(true)} className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 group ${cart.length > 0 ? 'bg-brand-primary/10 border border-brand-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:bg-brand-primary/20' : 'bg-slate-900/60 border border-slate-800 hover:border-brand-primary/50 hover:bg-brand-primary/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'}`}>
              <ShoppingCart className={`w-5 h-5 transition-colors ${cart.length > 0 ? 'text-brand-primary group-hover:text-brand-secondary' : 'text-slate-400 group-hover:text-brand-primary'}`} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 w-4 h-4 bg-brand-primary text-black text-[10px] font-black rounded-full flex items-center justify-center border border-black">{cart.length}</span>}
            </button>

            {user && (
              <Link to="/dashboard?tab=wishlist"
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 transition-all group shadow-[0_0_15px_rgba(236,72,153,0)] hover:shadow-[0_0_15px_rgba(236,72,153,0.15)] hidden md:flex">
                <Heart className="w-5 h-5 text-slate-400 transition-colors group-hover:text-pink-400" />
              </Link>
            )}

            <Link
              to={user ? '/dashboard' : '/login'}
              aria-label={user ? 'Go to dashboard' : 'Log in'}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 active:scale-90 hidden md:flex group ${user
                ? 'bg-emerald-600/10 border border-emerald-600/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-emerald-600/20'
                : 'bg-slate-900/60 border border-slate-800 hover:border-brand-primary/50 hover:bg-brand-primary/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                }`}
            >
              <UserIcon className={`w-5 h-5 transition-colors ${user ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-slate-400 group-hover:text-brand-primary'}`} />
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
              className="w-10 h-10 flex md:hidden items-center justify-center text-white rounded-xl shadow-lg transition-all active:scale-90 bg-slate-900 border border-slate-800 hover:border-brand-primary group"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
              ) : (
                <Menu className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isOpen && (
          <div id="mobile-menu" className="md:hidden absolute top-[calc(100%+0.5rem)] left-0 right-0 w-full h-[80vh] bg-black/95 backdrop-blur-3xl border border-slate-800/50 rounded-b-3xl flex flex-col px-6 py-6 gap-3 animate-in fade-in slide-in-from-top-4 duration-300 z-50 overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="w-full mb-2">
              <GlobalSearchBar className="w-full" />
            </div>

            {navItems.map((item) => {
              const isMobileActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-5 py-4 rounded-2xl text-base font-bold uppercase tracking-widest transition-all duration-300 ${isMobileActive
                    ? 'bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 border border-brand-primary/30 text-brand-primary shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/40 text-slate-300 border border-transparent hover:bg-slate-800 hover:border-slate-700/50 hover:text-white'
                    }`}
                >
                  <span className="me-4 scale-125 opacity-80">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}

            {/* Track Repair - Mobile */}
            <Link
              to="/track-repair"
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-5 py-4 rounded-2xl text-base font-bold uppercase tracking-widest transition-all duration-300 border ${location.pathname === '/track-repair'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-slate-900/40 text-amber-400/70 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-400'
                }`}
            >
              <span className="me-4 scale-125 opacity-80"><ClipboardList className="w-5 h-5" /></span>
              Track Repair
            </Link>

            <div className="mt-auto pt-4 border-t border-slate-800/50">
              <Link
                to={user ? '/dashboard' : '/login'}
                onClick={() => setIsOpen(false)}
                className={`flex w-full justify-center items-center px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${user
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  }`}
              >
                <UserIcon className="w-5 h-5 me-3" />
                {user ? t('admin.dashboard', 'Go to Dashboard') : t('common.signInRegister', 'Sign In / Register')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
