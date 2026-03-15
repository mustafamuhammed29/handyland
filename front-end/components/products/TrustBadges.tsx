import React from 'react';
import { ShieldCheck, Truck, RefreshCw, CreditCard, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TrustBadgesProps {
    className?: string;
    variant?: 'horizontal' | 'grid';
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ className = '', variant = 'grid' }) => {
    const { t } = useTranslation();

    const badges = [
        {
            icon: ShieldCheck,
            title: t('trust.warranty.title', '12-Month Warranty'),
            subtitle: t('trust.warranty.sub', 'Free repairs or replacement'),
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            icon: RefreshCw,
            title: t('trust.return.title', '30-Day Returns'),
            subtitle: t('trust.return.sub', 'No questions asked'),
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            icon: Truck,
            title: t('trust.shipping.title', 'Free Shipping'),
            subtitle: t('trust.shipping.sub', 'Fast & tracked delivery'),
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            icon: Lock,
            title: t('trust.secure.title', 'Secure Checkout'),
            subtitle: t('trust.secure.sub', 'SSL encrypted payment'),
            color: 'text-slate-700 dark:text-slate-300',
            bg: 'bg-slate-100 dark:bg-slate-800'
        }
    ];

    if (variant === 'horizontal') {
        return (
            <div className={`flex flex-wrap items-center justify-center gap-6 ${className}`}>
                {badges.map((badge, idx) => {
                    const Icon = badge.icon;
                    return (
                        <div key={idx} className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.bg} ${badge.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{badge.title}</div>
                                <div className="text-xs text-slate-500">{badge.subtitle}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            {badges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                    <div key={idx} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform hover:scale-110 ${badge.bg} ${badge.color}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{badge.title}</h4>
                        <p className="text-xs text-slate-500">{badge.subtitle}</p>
                    </div>
                );
            })}
        </div>
    );
};
