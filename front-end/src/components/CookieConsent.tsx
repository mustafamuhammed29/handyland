import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Check, Target, BarChart2 } from 'lucide-react';
import { useCookieConsent } from '../context/CookieContext';

// Simple Toggle Component
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }> = ({ checked, onChange, disabled, label }) => (
    <button
        aria-label={label || 'Toggle cookie setting'}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

export const CookieConsent: React.FC = () => {
    const { hasConsented, acceptAll, rejectAll, savePreferences } = useCookieConsent();
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    
    // Manage local toggle state before saving
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        if (!hasConsented) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [hasConsented]);

    const handleSave = () => {
        savePreferences({ analytics, marketing });
        setIsVisible(false); // Context handles saving & hiding
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0, transition: { duration: 0.3 } }}
                    className="fixed bottom-0 left-0 right-0 z-[150] p-4 sm:p-6 pointer-events-none flex justify-center"
                >
                    <div className="bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl w-full max-w-4xl p-5 sm:p-6 pointer-events-auto flex flex-col md:flex-row gap-6 items-center overflow-hidden relative backdrop-blur-xl">
                        {/* Ambient Glow */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
                        
                        <div className="flex-1 flex gap-4 items-start w-full">
                            <div className="p-3 bg-blue-500/10 rounded-xl shrink-0 border border-blue-500/20 hidden sm:block">
                                <Cookie className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="w-full">
                                <div className="flex items-center gap-2 mb-2 sm:hidden">
                                    <Cookie className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-lg font-bold text-white">We value your privacy</h3>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 hidden sm:block">We value your privacy</h3>
                                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                                    We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                                </p>
                                
                                {showDetails && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="mt-4 space-y-3 overflow-hidden text-sm w-full"
                                    >
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-white">Strictly Necessary</p>
                                                    <p className="text-xs text-slate-400 mt-1">Required for the website to function securely. Cannot be disabled.</p>
                                                </div>
                                            </div>
                                            <Toggle checked={true} onChange={() => {}} disabled={true} />
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                                            <div className="flex items-start gap-3">
                                                <BarChart2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-white">Analytics & Performance</p>
                                                    <p className="text-xs text-slate-400 mt-1">Help us understand how visitors interact with our website to improve UX.</p>
                                                </div>
                                            </div>
                                            <Toggle checked={analytics} onChange={setAnalytics} />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                                            <div className="flex items-start gap-3">
                                                <Target className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-white">Marketing & Tracking</p>
                                                    <p className="text-xs text-slate-400 mt-1">Used to deliver advertisements more relevant to you and your interests.</p>
                                                </div>
                                            </div>
                                            <Toggle checked={marketing} onChange={setMarketing} />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                            {showDetails ? (
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 w-full whitespace-nowrap"
                                >
                                    Save Preferences
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={acceptAll}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 w-full whitespace-nowrap"
                                    >
                                        Accept All
                                    </button>
                                    <button 
                                        onClick={rejectAll}
                                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all w-full whitespace-nowrap"
                                    >
                                        Reject Non-Essential
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={() => setShowDetails(!showDetails)}
                                className="px-6 py-2.5 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white font-medium rounded-xl transition-all w-full text-sm underline-offset-4 hover:underline"
                            >
                                {showDetails ? 'Hide Preferences' : 'Manage Preferences'}
                            </button>
                        </div>
                        
                        <button 
                            onClick={rejectAll}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
