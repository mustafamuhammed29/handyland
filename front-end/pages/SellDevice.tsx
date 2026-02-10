import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Truck, CreditCard, User, MapPin, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const SellDevice = () => {
    const { quoteRef } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState<any>(null);
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/valuation/quote/${quoteRef}/confirm`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                addToast("Sell Order Confirmed! Check your email for shipping label.", "success");
                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
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
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Complete Your Sale</h1>
                    <p className="text-slate-400">
                        Reference: <span className="text-cyan-400 font-mono mr-4">{quoteRef}</span>
                        {quote && <span className="text-emerald-400 font-bold">Offer: €{quote.price}</span>}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
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
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Email</label>
                                    <input
                                        name="email"
                                        required
                                        type="email"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-purple-400" /> Shipping Address
                            </h3>
                            <div className="space-y-4">
                                <input
                                    name="address"
                                    placeholder="Street Address"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                    onChange={handleChange}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        name="city"
                                        placeholder="City"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                        onChange={handleChange}
                                    />
                                    <input
                                        name="postalCode"
                                        placeholder="Postal Code"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-400" /> Payout Details (Bank Transfer)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    name="bankName"
                                    placeholder="Bank Name"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                    onChange={handleChange}
                                />
                                <input
                                    name="iban"
                                    placeholder="IBAN"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-start gap-4">
                            <Truck className="w-6 h-6 text-cyan-400 shrink-0" />
                            <div className="text-sm text-slate-400">
                                <p className="text-white font-bold mb-1">Free Shipping Included</p>
                                We will email you a prepaid shipping label immediately.
                                Send your device within 48 hours to lock in your quote.
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            Confirm Sale <ArrowRight className="w-5 h-5" />
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};
