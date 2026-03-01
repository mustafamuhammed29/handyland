
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Smartphone, Wrench, BarChart3, ShoppingBag, User as UserIcon, ShoppingCart, Home, Bell } from 'lucide-react';
import { LanguageCode, User } from '../types';
import { translations } from '../i18n';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';

interface NavbarProps {
  lang: LanguageCode;
  setLang?: (lang: LanguageCode) => void; // Made optional as it might not be passed always or handled by context
  user: User | null;
  cartCount: number; // Add cartCount as it was passed in PublicLayout
}

export const Navbar: React.FC<NavbarProps> = ({ lang, user, cartCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { cart, setIsCartOpen } = useCart();
  const { settings } = useSettings(); // Use Global Settings
  const location = useLocation();
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications') as any;
        if (res.success) {
          setNotifications(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReadNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.put(`/api/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const iconMap: Record<string, React.ReactNode> = {
    Home: <Home className="w-4 h-4" />,
    ShoppingBag: <ShoppingBag className="w-4 h-4" />,
    Wrench: <Wrench className="w-4 h-4" />,
    BarChart3: <BarChart3 className="w-4 h-4" />
  };

  const navItems = (settings.navbar?.links || []).map(link => ({
    label: link.labelKey ? t(link.labelKey, link.defaultLabel) : link.defaultLabel,
    path: link.path,
    icon: link.iconName && iconMap[link.iconName] ? iconMap[link.iconName] : <Home className="w-4 h-4" />
  }));

  const hasBanner = settings.announcementBanner?.enabled && settings.announcementBanner?.text;

  return (
    <nav className={`fixed left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rtl:left-auto rtl:right-1/2 rtl:translate-x-1/2 transition-all duration-300 ${hasBanner ? 'top-14' : 'top-6'}`}>
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
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            {(settings.navbar?.showLanguageSwitcher !== false) && (
              <LanguageSwitcher />
            )}

            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition-colors group"
                >
                  <Bell className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border border-black">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-14 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-white">Notifications</h3>
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{unreadCount} New</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif._id}
                            onClick={(e) => handleReadNotification(notif._id, e)}
                            className={`px-4 py-3 border-b border-slate-800/50 cursor-pointer transition-colors ${notif.read ? 'opacity-60 hover:opacity-100 hover:bg-slate-800/50' : 'bg-slate-800/20 hover:bg-slate-800/80'}`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.read ? 'bg-transparent' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                              <div>
                                <p className={`text-sm ${notif.read ? 'text-slate-300' : 'text-white font-medium'}`}>{notif.title}</p>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setIsCartOpen(true)} className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition-colors group">
              <ShoppingCart className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 w-4 h-4 bg-cyan-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border border-black">{cart.length}</span>}
            </button>

            <Link
              to={user ? '/dashboard' : '/login'}
              aria-label={user ? 'Go to dashboard' : 'Log in'}
              className={`w-10 h-10 flex items-center justify-center text-white rounded-xl shadow-lg transition-all active:scale-90 hidden md:flex ${user ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-cyan-600 shadow-cyan-900/20'
                }`}
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
              aria-controls="mobile-menu"
              className="w-10 h-10 flex md:hidden items-center justify-center text-white rounded-xl shadow-lg transition-all active:scale-90 bg-slate-900 border border-slate-800 hover:border-cyan-500 group"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isOpen && (
          <div id="mobile-menu" className="md:hidden mt-4 pt-4 border-t border-slate-800/50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            {navItems.map((item) => {
              const isMobileActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isMobileActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                    : 'bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <span className="me-3">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <Link
              to={user ? '/dashboard' : '/login'}
              onClick={() => setIsOpen(false)}
              className={`flex mt-2 items-center px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${user
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                : 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30'
                }`}
            >
              <UserIcon className="w-4 h-4 me-3" />
              {user ? 'Dashboard' : 'Login'}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
