import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VerifyEmailNotice: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar' || i18n.language === 'fa';
    const location = useLocation();
    const email = location.state?.email || t('verifyEmailNotice.defaultEmail', 'deine E-Mail-Adresse');

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-[100dvh] bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                    <Mail className="w-10 h-10 text-green-400" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                    {t('verifyEmailNotice.pageTitle', 'E-Mail-Adresse bestätigen')}
                </h1>

                <p className="text-slate-500 dark:text-slate-400 text-lg mb-6 leading-relaxed">
                    {t('verifyEmailNotice.sentTo', 'Wir haben einen Bestätigungslink gesendet an')} <br />
                    <span className="text-slate-900 dark:text-white font-bold bg-slate-800 px-3 py-1 rounded-lg mt-2 inline-block">{email}</span>
                </p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8 text-left rtl:text-right">
                    <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> {t('verifyEmailNotice.nextStepsTitle', 'Nächste Schritte:')}
                    </h3>
                    <ul className="text-slate-500 dark:text-slate-400 text-sm space-y-2 list-disc list-inside">
                        <li>{t('verifyEmailNotice.step1', 'Überprüfe deinen Posteingang auf eine E-Mail von HandyLand.')}</li>
                        <li>{t('verifyEmailNotice.step2', 'Klicke auf den Bestätigungslink in der E-Mail.')}</li>
                        <li>{t('verifyEmailNotice.step3', 'Kehre hierher zurück, um dich in deinem Konto anzumelden.')}</li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/login"
                        className="block w-full py-3 bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold rounded-lg shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                        {t('verifyEmailNotice.proceedToLogin', 'Weiter zum Login')} {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                    </Link>

                    <Link
                        to="/"
                        className="block text-slate-500 hover:text-slate-700 dark:text-slate-300 text-sm transition-colors"
                    >
                        {t('verifyEmailNotice.returnHome', 'Zurück zur Startseite')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailNotice;
