import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Smartphone, Wrench, BarChart3, ShoppingBag, User as UserIcon, ShoppingCart, Home, Bell, ClipboardList, Heart, Search } from 'lucide-react';
import { User } from '../types';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { GlobalSearchBar } from './GlobalSearchBar';
import { CommandMenu } from './layouts/CommandMenu';
import { NotificationBell } from './dashboard/NotificationBell';
import { MegaMenu } from './MegaMenu';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user: User | null;
  cartCount: number; // Add cartCount as it was passed in PublicLayout
  lang?: any;
}

export const Navbar: React.FC<NavbarProps> = ({ user, cartCount, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const { cart, setIsCartOpen } = useCart();
  const { settings } = useSettings(); // Use Global Settings
  const location = useLocation();
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

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
    <nav className={`fixed left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 rtl:left-auto rtl:right-1/2 rtl:translate-x-1/2 transition-all duration-500 ${hasBanner ? 'top-14' : 'top-6'}`}>
      <div className="bg-white/80 dark:bg-[#0b1121]/80 backdrop-blur-2xl rounded-2xl px-6 py-3 border border-black/5 dark:border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] flex items-center justify-between w-full transition-all">
        
        {/* Left: Logo & Brand */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center me-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] group-hover:rotate-12 transition-all duration-300">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase hidden sm:block">
              {settings.navbar?.logoText || 'HANDY'}<span className="text-brand-primary drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">{settings.navbar?.logoAccentText || 'LAND'}</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden lg:flex flex-1 justify-center items-center px-2 xl:px-4">
          <div className="flex items-center justify-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            if (item.path === '/market') {
              return <MegaMenu key={item.path} label={item.label} icon={item.icon} isActive={isActive} path={item.path} />;
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-1.5 xl:gap-2 px-2 xl:px-4 py-2 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-widest transition-all duration-300 group whitespace-nowrap ${isActive
                  ? 'text-slate-900 dark:text-white bg-black/5 dark:bg-white/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <span className={`relative z-10 flex items-center gap-2 transition-transform duration-300 ${isActive ? '' : 'group-hover:-translate-y-[1px]'}`}>
                  <span className={`transition-colors duration-300 ${isActive ? 'text-brand-primary' : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-primary'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                
                {/* Active Neon Line Indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-brand-primary rounded-t-full shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-in fade-in zoom-in duration-300"></span>
                )}
              </Link>
            );
          })}
          
          <Link
            to="/track-repair"
            className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-all duration-200"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Track Repair
          </Link>
          </div>
        </div>

        {/* Right: Action Icons */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0 pr-2">
          
          <div className="hidden sm:block">
             <button
               onClick={() => setIsCommandMenuOpen(true)}
               aria-label="Open search menu"
               className="w-10 h-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none outline-none group relative"
             >
               <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
               <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-slate-500 whitespace-nowrap bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none">
                 Cmd+K
               </span>
             </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 border-l border-black/10 dark:border-white/[0.05] pl-2 ml-1">
            {(settings.navbar?.showLanguageSwitcher !== false) && (
              <LanguageSwitcher />
            )}

            <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-all outline-none">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-slate-400 hover:text-white" /> : <Moon className="w-5 h-5 text-slate-600 hover:text-slate-900" />}
            </button>

            {user && (
              <NotificationBell userId={user._id} variant="navbar" />
            )}

            <button onClick={() => setIsCartOpen(true)} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-transparent transition-all duration-300 group outline-none hover:bg-black/5 dark:hover:bg-white/5">
              <ShoppingCart className={`w-5 h-5 transition-colors ${cart.length > 0 ? 'text-brand-primary group-hover:text-brand-secondary drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
              {cart.length > 0 && <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-primary text-black text-[10px] font-black rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] px-1">{cart.length}</span>}
            </button>

            {user && (
              <Link to="/dashboard?tab=wishlist"
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-transparent transition-all group hidden md:flex outline-none hover:bg-black/5 dark:hover:bg-white/5">
                <Heart className="w-5 h-5 text-slate-600 dark:text-slate-400 transition-colors group-hover:text-pink-400 drop-shadow-none group-hover:drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]" />
              </Link>
            )}

            <Link
              to={user ? '/dashboard' : '/login'}
              aria-label={user ? 'Go to dashboard' : 'Log in'}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 active:scale-95 hidden md:flex group outline-none"
            >
              <UserIcon className={`w-5 h-5 transition-colors ${user ? 'text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] group-hover:text-emerald-600 dark:group-hover:text-emerald-300' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
              className="w-10 h-10 flex lg:hidden items-center justify-center rounded-full transition-all active:scale-90 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 group outline-none ms-2"
            >
              {isOpen ? (
                <X className="w-4 h-4 text-brand-primary group-hover:text-brand-secondary drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              ) : (
                <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu Drawer */}
      {isOpen && (
        <div id="mobile-menu" className="lg:hidden absolute top-[calc(100%+0.75rem)] left-0 right-0 w-full max-h-[85vh] bg-white/95 dark:bg-[#0b1121]/95 backdrop-blur-3xl border border-black/5 dark:border-white/[0.05] rounded-3xl flex flex-col px-6 py-6 gap-3 animate-in fade-in slide-in-from-top-4 duration-300 z-50 overflow-y-auto custom-scrollbar shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
          <div className="w-full mb-2">
            <button
               onClick={() => {
                 setIsOpen(false);
                 setIsCommandMenuOpen(true);
               }}
               className="w-full bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 p-3 rounded-2xl flex items-center justify-between transition-colors border border-transparent dark:border-slate-700/50"
             >
               <div className="flex items-center gap-2">
                 <Search className="w-5 h-5" />
                 <span className="font-medium text-sm">Search products...</span>
               </div>
               <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400">Cmd+K</span>
             </button>
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
                  ? 'bg-brand-primary/10 border border-brand-primary/20 text-cyan-700 dark:text-brand-primary shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'bg-black/[0.02] dark:bg-white/[0.02] text-slate-600 dark:text-slate-300 border border-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <span className="me-4 scale-125 opacity-80">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* Track Repair removed per user request */}

          <div className="mt-auto pt-4 border-t border-white/[0.05]">
            <Link
              to={user ? '/dashboard' : '/login'}
              onClick={() => setIsOpen(false)}
              className={`flex w-full justify-center items-center px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${user
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                }`}
            >
              <UserIcon className="w-5 h-5 me-3" />
              {user ? t('admin.dashboard', 'Go to Dashboard') : t('common.signInRegister', 'Sign In / Register')}
            </Link>
          </div>
        </div>
      )}

      {/* Global Command Menu */}
      <CommandMenu 
        isOpen={isCommandMenuOpen} 
        onClose={() => setIsCommandMenuOpen(false)} 
      />
    </nav>
  );
};
