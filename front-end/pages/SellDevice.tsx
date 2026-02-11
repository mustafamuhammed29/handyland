import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Truck, CreditCard, User, MapPin, ArrowRight, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// IBAN validation for DE/AT/CH
const validateIban = (iban: string): { valid: boolean; message?: string } => {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 15 || cleaned.length > 34) {
        return { valid: false, message: 'IBAN must be between 15 and 34 characters' };
    }
    const countryCode = cleaned.substring(0, 2);
    const lengths: Record<string, number> = { DE: 22, AT: 20, CH: 21 };
    if (lengths[countryCode] && cleaned.length !== lengths[countryCode]) {
        return { valid: false, message: `${countryCode} IBAN must be exactly ${lengths[countryCode]} characters` };
    }
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
        return { valid: false, message: 'Invalid IBAN format' };
    }
    return { valid: true };
};

const formatIban = (value: string): string => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

export const SellDevice = () => {
    const { quoteRef } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
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
        const fetchQuote = async () => {
            if (!quoteRef) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/valuation/quote/${quoteRef}`);
                const data = await response.json();

                if (data.success) {
                    setQuote(data.quote);
                } else {
                    addToast("Invalid or Expired Quote", "error");
                    setTimeout(() => navigate('/valuation'), 3000);
                }
            } catch (err) {
                console.error(err);
                addToast("Error fetching quote details", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
    }, [quoteRef, navigate, addToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'iban') {
            setFormData({ ...formData, iban: formatIban(value) });
            const result = validateIban(value);
            setErrors(prev => result.valid ? { ...prev, iban: '' } : { ...prev, iban: result.message || '' });
        } else {
            setFormData({ ...formData, [name]: value });
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
        if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
        const ibanResult = validateIban(formData.iban);
        if (!ibanResult.valid) newErrors.iban = ibanResult.message || 'Invalid IBAN';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setShowConfirm(true);
        }
    };

    const handleSubmit = async () => {
        setShowConfirm(false);
        const token = localStorage.getItem('token');
        if (!token) {
            addToast("Please login to complete this sale", "error");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/valuation/quote/${quoteRef}/confirm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    iban: formData.iban.replace(/\s/g, ''),
                })
            });
            const data = await response.json();

            if (data.success) {
                addToast("Sell Order Confirmed! Check your email for shipping label.", "success");
                setTimeout(() => navigate('/dashboard'), 3000);
            } else {
                addToast(data.message || "Failed to confirm sale", "error");
            }
        } catch (err) {
            console.error(err);
            addToast("Network error. Please try again.", "error");
        }
    };

    useEffect(() => {
        document.title = "Complete Your Sale | Handyland";
    }, []);

    if (loading) return <div className="min-h-screen pt-32 text-center text-white">Loading Quote...</div>;

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertTriangle className="w-5 h-5" />
                                <h3 className="text-lg font-bold">Confirm Bank Details</h3>
                            </div>
                            <button onClick={() => setShowConfirm(false)} className="text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">
                            Please verify your bank details are correct. Incorrect information may delay your payment.
                        </p>
                        <div className="bg-slate-950 rounded-xl p-4 mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Bank:</span>
                                <span className="text-white font-medium">{formData.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">IBAN:</span>
                                <span className="text-white font-mono text-xs">{formData.iban}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Amount:</span>
                                <span className="text-emerald-400 font-bold">€{quote?.price}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                                <ShieldCheck className="w-4 h-4" /> Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Complete Your Sale</h1>
                    <p className="text-slate-400">
                        Reference: <span className="text-cyan-400 font-mono mr-4">{quoteRef}</span>
                        {quote && <span className="text-emerald-400 font-bold">Offer: €{quote.price}</span>}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handlePreSubmit} className="space-y-8">
                        {/* Personal Details */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-cyan-400" /> Contact Info
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Full Name</label>
                                    <input
                                        name="fullName"
                                        required
                                        className={`w-full bg-slate-950 border ${errors.fullName ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-cyan-500 outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Email</label>
                                    <input
                                        name="email"
                                        required
                                        type="email"
                                        className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-cyan-500 outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-purple-400" /> Shipping Address
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        name="address"
                                        placeholder="Street Address"
                                        required
                                        className={`w-full bg-slate-950 border ${errors.address ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-cyan-500 outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            name="city"
                                            placeholder="City"
                                            required
                                            className={`w-full bg-slate-950 border ${errors.city ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-cyan-500 outline-none`}
                                            onChange={handleChange}
                                        />
                                        {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                                    </div>
                                    <div>
                                        <input
                                            name="postalCode"
                                            placeholder="Postal Code"
                                            required
                                            className={`w-full bg-slate-950 border ${errors.postalCode ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-cyan-500 outline-none`}
                                            onChange={handleChange}
                                        />
                                        {errors.postalCode && <p className="text-red-400 text-xs mt-1">{errors.postalCode}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-400" /> Payout Details (Bank Transfer)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input
                                        name="bankName"
                                        placeholder="Bank Name"
                                        required
                                        className={`w-full bg-slate-950 border ${errors.bankName ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-cyan-500 outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>}
                                </div>
                                <div>
                                    <input
                                        name="iban"
                                        placeholder="IBAN (e.g. DE89 3704 0044 0532 0130 00)"
                                        required
                                        value={formData.iban}
                                        className={`w-full bg-slate-950 border ${errors.iban ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white font-mono text-sm focus:border-cyan-500 outline-none`}
                                        onChange={handleChange}
                                    />
                                    {errors.iban && <p className="text-red-400 text-xs mt-1">{errors.iban}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-start gap-4">
                            <Truck className="w-6 h-6 text-cyan-400 shrink-0" />
                            <div className="text-sm text-slate-400">
                                <p className="text-white font-bold mb-1">Free Shipping Included</p>
                                We will email you a prepaid shipping label immediately.
                                Send your device within <span className="text-amber-400 font-semibold">48 hours</span> to lock in your quote.
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            Review & Confirm Sale <ArrowRight className="w-5 h-5" />
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};
