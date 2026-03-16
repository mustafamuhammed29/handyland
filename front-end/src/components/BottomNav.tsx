import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

export const BottomNav = () => {
    const { t } = useTranslation();
    const { cart, setIsCartOpen } = useCart();
    const cartCount = cart.length;

    const navItems = [
        { to: '/', icon: <Home className="w-5 h-5" />, label: t('nav.home', 'Home') },
        { to: '/marketplace', icon: <Search className="w-5 h-5" />, label: t('nav.marketplace', 'Market') },
        { to: '/repair', icon: <Wrench className="w-5 h-5" />, label: t('nav.repair', 'Repair') },
        { 
            to: '#', 
            action: () => setIsCartOpen(true),
            icon: (
                <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-brand-primary text-slate-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                            {cartCount}
                        </span>
                    )}
                </div>
            ), 
            label: t('nav.cart', 'Cart') 
        },
        { to: '/dashboard', icon: <User className="w-5 h-5" />, label: t('nav.profile', 'Profile') },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
            <nav className="flex items-center justify-around px-2 h-16">
                {navItems.map((item) => (
                    item.action ? (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        >
                            {item.icon}
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ) : (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                                    isActive 
                                        ? 'text-brand-primary' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </NavLink>
                    )
                ))}
            </nav>
        </div>
    );
};
