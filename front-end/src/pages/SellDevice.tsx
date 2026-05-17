import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { authService } from '../services/authService';
import { formatIban, validateIban } from '../utils/ibanUtils';

// Child Components
import { ContactStep } from './SellDevice/ContactStep';
import { AddressStep } from './SellDevice/AddressStep';
import { PayoutStep } from './SellDevice/PayoutStep';
import { ConfirmModal } from './SellDevice/ConfirmModal';

export const SellDevice = () => {
    const { quoteRef } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quote, setQuote] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Multi-step form state
    const [formStep, setFormStep] = useState(1); // 1 = Contact, 2 = Address, 3 = Payout

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        iban: '',
        bankName: ''
    });

    useEffect(() => {
        const fetchAll = async () => {
            if (!quoteRef) return;

            let resolvedQuote: any = null;

            const pendingRaw = sessionStorage.getItem('pendingValuationQuote');
            if (pendingRaw) {
                try {
                    const parsed = JSON.parse(pendingRaw);
                    const quoteData = parsed.quoteData || parsed;
                    const timestamp = parsed.timestamp || Date.now();
                    
                    if (Date.now() - timestamp > 30 * 60 * 1000) {
                        sessionStorage.removeItem('pendingValuationQuote');
                    } else if (quoteData?.quoteReference === quoteRef) {
                        resolvedQuote = {
                            reference: quoteData.quoteReference,
                            model: quoteData.model,
                            price: quoteData.estimatedValue,
                            specs: quoteData.storage,
                            condition: quoteData.screenCondition,
                            status: 'active'
                        };
                        setQuote(resolvedQuote);
                    }
                } catch {
                    sessionStorage.removeItem('pendingValuationQuote');
                }
            }

            const isTemp = quoteRef?.startsWith('HV-TEMP-');

            if (isTemp && !resolvedQuote) {
                addToast(t('sellDevice.offerExpired'), 'error');
                setTimeout(() => navigate('/valuation'), 2500);
                setLoading(false);
                return;
            }

            if (!isTemp) {
                try {
                    const data: any = await api.get(`/api/valuation/quote/${quoteRef}`);
                    if (data.success) {
                        resolvedQuote = data.quote;
                        setQuote(data.quote);
                    } else if (!resolvedQuote) {
                        addToast(t('sellDevice.offerExpired'), 'error');
                        setTimeout(() => navigate('/valuation'), 3000);
                    }
                } catch {
                    if (!resolvedQuote) {
                        addToast(t('sellDevice.offerExpired'), 'error');
                        setTimeout(() => navigate('/valuation'), 3000);
                    }
                }
            }

            try {
                const meRes = await authService.getMe();
                if (meRes?.user) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: meRes.user.name || meRes.user.firstName + ' ' + meRes.user.lastName || '',
                        email: meRes.user.email || '',
                    }));
                }
            } catch { /* not critical */ }

            setLoading(false);
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quoteRef]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'iban') {
            setFormData({ ...formData, iban: formatIban(value) });
            const result = validateIban(value, t);
            setErrors(prev => result.valid ? { ...prev, iban: '' } : { ...prev, iban: result.message || '' });
        } else {
            setFormData({ ...formData, [name]: value });
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep = (stepNumber: number) => {
        const newErrors: Record<string, string> = {};
        if (stepNumber === 1) {
            if (!formData.fullName.trim()) newErrors.fullName = t('common.required');
            if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('common.required');
        }
        if (stepNumber === 3) {
            if (!formData.bankName.trim()) newErrors.bankName = t('common.required');
            const ibanResult = validateIban(formData.iban, t);
            if (!ibanResult.valid) newErrors.iban = ibanResult.message || t('sellDevice.ibanFormat');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(formStep)) {
            setFormStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setFormStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(3)) setShowConfirm(true);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const data: any = await api.put(`/api/valuation/quote/${quoteRef}/confirm`, {
                ...formData,
                iban: formData.iban.replace(/\s/g, ''),
            });
            if (data.success) {
                setShowConfirm(false);
                sessionStorage.removeItem('pendingValuationQuote');
                addToast(t('sellDevice.saleConfirmed'), 'success');
                setTimeout(() => navigate('/dashboard'), 3000);
            } else {
                addToast(data.message || t('common.error'), 'error');
                setIsSubmitting(false);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || t('common.error');
            addToast(errorMsg, 'error');
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        document.title = 'Verkauf abschließen | Handyland';
    }, []);

    if (loading) {
        return (
            <div className="min-h-[100dvh] pt-32 flex items-center justify-center text-slate-900 dark:text-white">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-primary mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">Angebot wird geladen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-slate-950 pt-24 pb-12 px-4">
            {showConfirm && (
                <ConfirmModal 
                    formData={formData} 
                    quote={quote} 
                    isSubmitting={isSubmitting} 
                    onClose={() => setShowConfirm(false)} 
                    onSubmit={handleSubmit} 
                    t={t} 
                />
            )}

            <div className="max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('sellDevice.completeOrder')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Reference: <span className="text-brand-primary font-mono mr-4">{quoteRef}</span>
                        {quote && <span className="text-emerald-400 font-bold">Angebot: €{quote.price}</span>}
                    </p>

                    {/* Stepper Dots */}
                    <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                        <div className={`flex-1 h-2 rounded-full transition-colors ${formStep >= 1 ? 'bg-brand-primary' : 'bg-slate-800'}`} />
                        <div className={`flex-1 h-2 rounded-full transition-colors ${formStep >= 2 ? 'bg-brand-primary' : 'bg-slate-800'}`} />
                        <div className={`flex-1 h-2 rounded-full transition-colors ${formStep >= 3 ? 'bg-brand-primary' : 'bg-slate-800'}`} />
                    </div>
                    <div className="flex justify-between max-w-xs mx-auto mt-2 text-xs font-bold text-slate-500 uppercase">
                        <span className={formStep >= 1 ? 'text-brand-primary' : ''}>Contact</span>
                        <span className={formStep >= 2 ? 'text-brand-primary' : ''}>Address</span>
                        <span className={formStep >= 3 ? 'text-brand-primary' : ''}>Payout</span>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <form onSubmit={handlePreSubmit} className="relative z-10">
                        {formStep === 1 && <ContactStep formData={formData} errors={errors} handleChange={handleChange} onNext={nextStep} t={t} />}
                        {formStep === 2 && <AddressStep onPrev={prevStep} onNext={nextStep} t={t} />}
                        {formStep === 3 && <PayoutStep formData={formData} errors={errors} handleChange={handleChange} onPrev={prevStep} t={t} />}
                    </form>
                </div>
            </div>
        </div>
    );
};
