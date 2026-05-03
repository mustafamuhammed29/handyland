import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle2, Truck, CreditCard, User, MapPin, ArrowRight, ArrowLeft,
    AlertTriangle, ShieldCheck, X, Home, Plus, Loader2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { authService } from '../services/authService';

// IBAN validation for DE/AT/CH
const validateIban = (iban: string, t: any): { valid: boolean; message?: string } => {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 15 || cleaned.length > 34) {
        return { valid: false, message: t('sellDevice.ibanLength', { length: 34 }) };
    }
    const countryCode = cleaned.substring(0, 2);
    const lengths: Record<string, number> = { DE: 22, AT: 20, CH: 21 };
    const patterns: Record<string, RegExp> = {
        DE: /^DE\d{20}$/,
        AT: /^AT\d{18}$/,
        CH: /^CH\d{19}$/
    };

    if (!lengths[countryCode]) {
        return { valid: false, message: t('sellDevice.ibanCountryOnly') };
    }

    if (lengths[countryCode] && cleaned.length !== lengths[countryCode]) {
        return { valid: false, message: t('sellDevice.ibanCountryError', { country: countryCode, length: lengths[countryCode] }) };
    }
    if (patterns[countryCode] && !patterns[countryCode].test(cleaned)) {
        return { valid: false, message: t('sellDevice.ibanFormat') };
    }
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
        return { valid: false, message: t('sellDevice.ibanFormat') };
    }
    return { valid: true };
};

const formatIban = (value: string): string => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

const maskIban = (iban: string) => {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 10) return iban;
    return cleaned.slice(0, 6) + ' **** **** ' + cleaned.slice(-4);
};

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

    // Saved addresses state
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useManual, setUseManual] = useState(false);

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

            try {
                const addrRes = await authService.getAddresses();
                const addresses = addrRes?.addresses || [];
                setSavedAddresses(addresses);

                const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr._id);
                    applyAddress(defaultAddr);
                } else {
                    setUseManual(true);
                }
            } catch {
                setUseManual(true);
            }

            setLoading(false);
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quoteRef]);

    const applyAddress = (addr: any) => {
        setFormData(prev => ({
            ...prev,
            address: addr.street || '',
            city: addr.city || '',
            postalCode: addr.postalCode || addr.zipCode || '',
        }));
        setErrors(prev => ({ ...prev, address: '', city: '', postalCode: '' }));
    };

    const handleSelectAddress = (addr: any) => {
        setSelectedAddressId(addr._id);
        setUseManual(false);
        applyAddress(addr);
    };

    const handleManualMode = () => {
        setSelectedAddressId(null);
        setUseManual(true);
        setFormData(prev => ({ ...prev, address: '', city: '', postalCode: '' }));
    };

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
        if (stepNumber === 2) {
            // Validation removed. Shop address is displayed statically.
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertTriangle className="w-5 h-5" />
                                <h3 className="text-lg font-bold">{t('sellDevice.checkBankDetails')}</h3>
                            </div>
                            <button onClick={() => setShowConfirm(false)} title={t('common.close')} className="text-slate-500 hover:text-slate-900 dark:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                            {t('sellDevice.verifyBankWarning')}
                        </p>
                        <div className="bg-slate-950 rounded-xl p-4 mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('sellDevice.fullName')}:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{formData.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Shop Adresse:</span>
                                <span className="text-slate-900 dark:text-white text-right">Walldorfer Str. 13, 69168 Wiesloch</span>
                            </div>
                            <div className="h-px bg-slate-800 my-1"></div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('sellDevice.bankName')}:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{formData.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('sellDevice.ibanLabel')}:</span>
                                <span className="text-slate-900 dark:text-white font-mono text-xs">{maskIban(formData.iban)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Auszahlung:</span>
                                <span className="text-emerald-400 font-bold">€{quote?.price}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                            >
                                {t('sellDevice.backBtn')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {isSubmitting ? t('sellDevice.processing') : t('sellDevice.confirmBtn')}
                            </button>
                        </div>
                    </div>
                </div>
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
                    {/* Decorative glow */}
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <form onSubmit={handlePreSubmit} className="relative z-10">
                        {formStep === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="text-center mb-8">
                                    <div className="w-14 h-14 bg-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-primary/30">
                                        <User className="w-7 h-7 text-brand-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('sellDevice.contactInfo')}</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vollständiger Name</label>
                                        <input
                                            name="fullName"
                                            required
                                            placeholder="Vor- und Nachname"
                                            value={formData.fullName}
                                            className={`w-full bg-slate-950/50 border ${errors.fullName ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all`}
                                            onChange={handleChange}
                                        />
                                        {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-Mail</label>
                                        <input
                                            name="email"
                                            required
                                            type="email"
                                            placeholder="ihre@email.de"
                                            value={formData.email}
                                            className={`w-full bg-slate-950/50 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all`}
                                            onChange={handleChange}
                                        />
                                        {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                                    </div>
                                </div>
                                <button type="button" onClick={nextStep} className="w-full py-4 mt-8 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-slate-900 font-bold text-lg transition-all flex items-center justify-center gap-2">
                                    Weiter zur Adresse <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {formStep === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="text-center mb-8">
                                    <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                                        <MapPin className="w-7 h-7 text-purple-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Versandadresse (HandyLand Shop)</h3>
                                </div>
                                <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-6 text-center shadow-inner">
                                    <p className="text-slate-700 dark:text-slate-300 mb-6">Bitte verpacken Sie Ihr Gerät sicher und senden Sie es direkt an unseren Shop. Wir bearbeiten es sofort nach Erhalt der Sendung.</p>
                                    <div className="bg-slate-900 border border-brand-primary/30 p-6 rounded-xl inline-block text-left text-slate-900 dark:text-white shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 blur-2xl rounded-full"></div>
                                        <div className="flex items-center gap-3 mb-3 border-b border-slate-800 pb-3 relative z-10">
                                            <div className="p-2 bg-brand-primary/20 rounded-lg">
                                                <Home className="w-5 h-5 text-brand-primary" />
                                            </div>
                                            <p className="font-bold text-xl text-brand-primary tracking-wide">HandyLand</p>
                                        </div>
                                        <div className="space-y-1.5 text-slate-700 dark:text-slate-300 relative z-10">
                                            <p className="font-medium text-slate-900 dark:text-white">z.H. Ankauf-Abteilung</p>
                                            <p>Walldorfer Straße 13</p>
                                            <p>69168 Wiesloch</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-amber-500/80 font-medium mt-6">Tipp: Versenden Sie das Gerät zwingend als versichertes Paket (z.B. mit DHL), damit Sie eine Sendungsnummer erhalten.</p>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={prevStep} title={t('sellDevice.backBtn', 'Zurück')} className="py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold transition-all">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <button type="button" onClick={() => { setFormStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-1 py-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-slate-900 font-bold text-lg transition-all flex items-center justify-center gap-2">
                                        Weiter zur Auszahlung <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {formStep === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="text-center mb-8">
                                    <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                        <CreditCard className="w-7 h-7 text-emerald-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Payout Details</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Bank Name</label>
                                        <input
                                            name="bankName"
                                            placeholder="e.g. Sparkasse, Deutsche Bank"
                                            value={formData.bankName}
                                            className={`w-full bg-slate-950/50 border ${errors.bankName ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all`}
                                            onChange={handleChange}
                                        />
                                        {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">IBAN</label>
                                        <div className="relative">
                                            <input
                                                name="iban"
                                                placeholder="DEXX XXXX XXXX XXXX XXXX XX"
                                                value={formData.iban}
                                                className={`w-full bg-slate-950/50 border ${errors.iban ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all uppercase`}
                                                onChange={handleChange}
                                            />
                                            {formData.iban && !errors.iban && validateIban(formData.iban, t).valid && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                </div>
                                            )}
                                        </div>
                                        {errors.iban && <p className="text-red-400 text-xs mt-1">{errors.iban}</p>}
                                    </div>
                                </div>
                                
                                <div className="mt-8 bg-slate-950/80 p-5 rounded-xl border border-slate-800 flex items-start gap-4">
                                    <div className="p-2 bg-brand-primary/10 rounded-lg shrink-0">
                                        <Truck className="w-5 h-5 text-brand-primary" />
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        <p className="text-slate-900 dark:text-white font-bold mb-0.5">{t('sellDevice.freeShipping')}</p>
                                        {t('sellDevice.freeShippingDesc', { hours: 48 })}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button type="button" onClick={prevStep} title={t('sellDevice.backBtn', 'Zurück')} className="py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold transition-all">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <button type="submit" className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-emerald-950 font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                                        <ShieldCheck className="w-5 h-5" /> Order Confirm Details
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
