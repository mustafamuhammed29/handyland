import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="page-container min-h-[100dvh] bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 pt-16">
            <div className="text-center max-w-lg mx-auto">
                <div className="mb-8">
                    <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-600 tracking-tight">
                        404
                    </h1>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-4 mb-2">
                        {t('notFound.title', 'Seite nicht gefunden')}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                        {t('notFound.description', 'Die von Ihnen gesuchte Seite existiert leider nicht oder wurde verschoben.')}
                    </p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t('notFound.goBack', 'Zurück')}
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25"
                    >
                        <Home className="w-5 h-5" />
                        {t('notFound.home', 'Zur Startseite')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
