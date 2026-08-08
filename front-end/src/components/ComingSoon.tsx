import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hammer, ArrowLeft, Construction, Sparkles, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ComingSoonProps {
  title?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl opacity-20 animate-spin-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 dark:bg-black/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <Construction className="w-16 h-16 text-brand-primary drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
          </div>
          <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-bounce" style={{ animationDelay: '1s' }} />
          <Clock className="absolute -bottom-2 -left-4 w-6 h-6 text-brand-secondary animate-pulse" />
        </div>

        {/* Content */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 uppercase">
          {title ? (
            <>
              {title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('comingSoon.title', 'Coming Soon')}</span>
            </>
          ) : (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('comingSoon.title', 'Coming Soon')}</span>
          )}
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
          {t('comingSoon.description', 'We are working hard to bring this feature to you. Stay tuned for exciting updates and a better experience!')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-brand-primary/50 transition-all group shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            {t('common.goBack', 'Go Back')}
          </button>
          
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5"
          >
            <Hammer className="w-5 h-5" />
            {t('nav.home', 'Back to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
};
