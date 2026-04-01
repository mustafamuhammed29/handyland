import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle2, Truck, CreditCard, User, MapPin, ArrowRight,
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
        return { valid: false, message: t('sellDevice.ibanLength', { length: 34 }) }; // Just generic fallback for max length if needed, handled properly in translation
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

    // Fetch quote + user profile + saved addresses
    useEffect(() => {
        const fetchAll = async () => {
            if (!quoteRef) return;

            let resolvedQuote: any = null;

            // 1. Restore pending quote from sessionStorage (post-login or after valuation)
            const pendingRaw = sessionStorage.getItem('pendingValuationQuote');
            if (pendingRaw) {
                try {
                    const parsed = JSON.parse(pendingRaw);
                    const quoteData = parsed.quoteData || parsed;
                    const timestamp = parsed.timestamp || Date.now(); // Fallback if no timestamp
                    
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
                        // Don't remove sessionStorage yet - keep it for page refreshes
                    }
                } catch {
                    sessionStorage.removeItem('pendingValuationQuote');
                }
            }

            // 2. Handle quote loading based on reference type
            const isTemp = quoteRef?.startsWith('HV-TEMP-');

            if (isTemp && !resolvedQuote) {
                // Temp quote with no session data = expired/unusable, restart
                addToast(t('sellDevice.offerExpired'), 'error');
                setTimeout(() => navigate('/valuation'), 2500);
                setLoading(false);
                return;
            }

            if (!isTemp) {
                // Real DB quote: fetch from API
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

            // 3. Fetch user profile to pre-fill name/email
            try {
                const meRes = await authService.getMe();
                if (meRes?.user) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: meRes.user.name || '',
                        email: meRes.user.email || '',
                    }));
                }
            } catch { /* not critical */ }

            // 4. Fetch saved addresses
            try {
                const addrRes = await authService.getAddresses();
                const addresses = addrRes?.addresses || [];
                setSavedAddresses(addresses);

                // Auto-select default address
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

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = t('common.required');
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('common.required');
        if (!formData.address.trim()) newErrors.address = t('common.required');
        if (!formData.city.trim()) newErrors.city = t('common.required');
        if (!formData.postalCode.trim()) newErrors.postalCode = t('common.required');
        if (!formData.bankName.trim()) newErrors.bankName = t('common.required');
        const ibanResult = validateIban(formData.iban, t);
        if (!ibanResult.valid) newErrors.iban = ibanResult.message || t('sellDevice.ibanFormat');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) setShowConfirm(true);
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
            <div className="min-h-screen pt-32 flex items-center justify-center text-white">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-primary mx-auto mb-3" />
                    <p className="text-slate-400">Angebot wird geladen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertTriangle className="w-5 h-5" />
                                <h3 className="text-lg font-bold">{t('sellDevice.checkBankDetails')}</h3>
                            </div>
                            <button onClick={() => setShowConfirm(false)} title={t('common.close')} className="text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">
                            {t('sellDevice.verifyBankWarning')}
                        </p>
                        <div className="bg-slate-950 rounded-xl p-4 mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('sellDevice.fullName')}:</span>
                                <span className="text-white font-medium">{formData.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('sellDevice.shippingAddress')}:</span>
                                <span className="text-white text-right">{formData.address}, {formData.postalCode} {formData.city}</span>
                            </div>
                            <div className="h-px bg-slate-800 my-1"></div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('sellDevice.bankName')}:</span>
                                <span className="text-white font-medium">{formData.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('sellDevice.ibanLabel')}:</span>
                                <span className="text-white font-mono text-xs">{maskIban(formData.iban)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Auszahlung:</span>
                                <span className="text-emerald-400 font-bold">€{quote?.price}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
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
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">{t('sellDevice.completeOrder')}</h1>
                    <p className="text-slate-400">
                        Reference: <span className="text-brand-primary font-mono mr-4">{quoteRef}</span>
                        {quote && <span className="text-emerald-400 font-bold">Angebot: €{quote.price}</span>}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handlePreSubmit} className="space-y-8">

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-brand-primary" /> {t('sellDevice.contactInfo')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Vollständiger Name</label>
                                    <input
                                        name="fullName"
                                        required
                                        title="Vollständiger Name"
                                        placeholder="Vor- und Nachname"
                                        value={formData.fullName}
                                        className={`w-full bg-slate-950 border ${errors.fullName ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-brand-primary outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">E-Mail</label>
                                    <input
                                        name="email"
                                        required
                                        type="email"
                                        title="E-Mail-Adresse"
                                        placeholder="ihre@email.de"
                                        value={formData.email}
                                        className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-brand-primary outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-purple-400" /> {t('sellDevice.shippingAddress')}
                            </h3>

                            {/* Saved Addresses */}
                            {savedAddresses.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-slate-400 mb-3">{t('sellDevice.savedAddresses')}:</p>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {savedAddresses.map((addr: any) => (
                                            <button
                                                key={addr._id}
                                                type="button"
                                                onClick={() => handleSelectAddress(addr)}
                                                className={`text-left p-4 rounded-xl border transition-all ${selectedAddressId === addr._id && !useManual
                                                    ? 'border-purple-500 bg-purple-600/10'
                                                    : 'border-slate-700 bg-slate-950 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Home className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedAddressId === addr._id && !useManual ? 'text-purple-400' : 'text-slate-500'
                                                        }`} />
                                                    <div className="min-w-0">
                                                        {addr.name && (
                                                            <p className="text-white font-semibold text-sm truncate">{addr.name}</p>
                                                        )}
                                                        <p className="text-slate-300 text-sm">{addr.street}</p>
                                                        <p className="text-slate-400 text-xs">{addr.postalCode || addr.zipCode} {addr.city}, {addr.country}</p>
                                                        {addr.isDefault && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-600/20 text-purple-400 text-[10px] font-bold rounded">
                                                                Standard
                                                            </span>
                                                        )}
                                                    </div>
                                                    {selectedAddressId === addr._id && !useManual && (
                                                        <CheckCircle2 className="w-4 h-4 text-purple-400 ml-auto flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}

                                        {/* Manual entry option */}
                                        <button
                                            type="button"
                                            onClick={handleManualMode}
                                            className={`text-left p-4 rounded-xl border transition-all ${useManual
                                                ? 'border-brand-primary bg-brand-primary/10'
                                                : 'border-slate-700 border-dashed bg-slate-950 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Plus className={`w-4 h-4 ${useManual ? 'text-brand-primary' : 'text-slate-500'}`} />
                                                <span className={`text-sm font-medium ${useManual ? 'text-brand-primary' : 'text-slate-400'}`}>
                                                    {t('sellDevice.manualEntry')}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Manual fields — shown if: no saved addresses OR manual mode selected */}
                            {(savedAddresses.length === 0 || useManual) && (
                                <div className="space-y-4">
                                    <div>
                                        <input
                                            name="address"
                                            placeholder="Straße und Hausnummer"
                                            required
                                            value={formData.address}
                                            className={`w-full bg-slate-950 border ${errors.address ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-brand-primary outline-none`}
                                            onChange={handleChange}
                                        />
                                        {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <input
                                                name="city"
                                                placeholder="Stadt"
                                                required
                                                value={formData.city}
                                                className={`w-full bg-slate-950 border ${errors.city ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-brand-primary outline-none`}
                                                onChange={handleChange}
                                            />
                                            {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                                        </div>
                                        <div>
                                            <input
                                                name="postalCode"
                                                placeholder="Postleitzahl"
                                                required
                                                value={formData.postalCode}
                                                className={`w-full bg-slate-950 border ${errors.postalCode ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-brand-primary outline-none`}
                                                onChange={handleChange}
                                            />
                                            {errors.postalCode && <p className="text-red-400 text-xs mt-1">{errors.postalCode}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview of selected saved address fields */}
                            {savedAddresses.length > 0 && !useManual && selectedAddressId && (
                                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm text-slate-400">
                                    <span className="text-slate-500">Adresse: </span>
                                    <span className="text-white">{formData.address}, {formData.postalCode} {formData.city}</span>
                                </div>
                            )}

                            {(errors.address || errors.city || errors.postalCode) && savedAddresses.length > 0 && !useManual && (
                                <p className="text-red-400 text-xs mt-2">Bitte wähle eine Adresse aus oder gib eine manuell ein.</p>
                            )}
                        </div>

                        {/* Payout / Bank Details */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-400" /> Payout (Bank Transfer)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input
                                        name="bankName"
                                        placeholder={t('sellDevice.bankName')}
                                        required
                                        value={formData.bankName}
                                        className={`w-full bg-slate-950 border ${errors.bankName ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-brand-primary outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>}
                                </div>
                                <div>
                                    <input
                                        name="iban"
                                        placeholder={t('sellDevice.ibanLabel')}
                                        required
                                        value={formData.iban}
                                        className={`w-full bg-slate-950 border ${errors.iban ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white font-mono text-sm focus:border-brand-primary outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.iban && <p className="text-red-400 text-xs mt-1">{errors.iban}</p>}
                                    {formData.iban && !errors.iban && validateIban(formData.iban, t).valid && (
                                        <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> {t('sellDevice.ibanValid')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-start gap-4">
                            <Truck className="w-6 h-6 text-brand-primary shrink-0" />
                            <div className="text-sm text-slate-400">
                                <p className="text-white font-bold mb-1">{t('sellDevice.freeShipping')}</p>
                                {t('sellDevice.freeShippingDesc', { hours: 48 })}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-secondary to-brand-primary hover:from-brand-secondary/90 hover:to-brand-primary/90 text-white font-bold text-lg shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            {t('sellDevice.completeOrder')} <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
