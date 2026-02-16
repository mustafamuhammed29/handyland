import React, { useEffect, useState } from 'react';
import { Save, CreditCard, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function PaymentManager() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        stripe: { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
        paypal: { enabled: false, clientId: '' },
        bankTransfer: { enabled: false, instructions: '' },
        cashOnDelivery: { enabled: true }
    });
    const [showSecret, setShowSecret] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/settings');
            const data = res.data || res;
            if (data.payment) {
                // Merge with default structure to ensure all keys exist
                setConfig(prev => ({
                    ...prev,
                    ...data.payment,
                    stripe: { ...prev.stripe, ...data.payment.stripe },
                    paypal: { ...prev.paypal, ...data.payment.paypal },
                    bankTransfer: { ...prev.bankTransfer, ...data.payment.bankTransfer },
                    cashOnDelivery: { ...prev.cashOnDelivery, ...data.payment.cashOnDelivery }
                }));
            }
        } catch (err) {
            console.error("Failed to load settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/api/settings', { payment: config });
            alert('Payment settings updated successfully!');
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (section: string, key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [key]: value
            }
        }));
    };

    if (loading) return <div className="text-center py-20 text-slate-500">Loading payment settings...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white">Payment Methods</h2>
                    <p className="text-slate-400 mt-1">Manage payment gateways and API keys</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    title="Save All Payment Settings"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="space-y-6">
                {/* Stripe Configuration */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Stripe Payments</h3>
                                <p className="text-sm text-slate-400">Accept credit cards securely</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${config.stripe.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {config.stripe.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <button
                                onClick={() => updateConfig('stripe', 'enabled', !config.stripe.enabled)}
                                title={config.stripe.enabled ? "Disable Stripe" : "Enable Stripe"}
                                className={`w-12 h-6 rounded-full transition-colors relative ${config.stripe.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${config.stripe.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {config.stripe.enabled && (
                        <div className="space-y-4 border-t border-slate-800 pt-6 animate-in fade-in slide-in-from-top-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Publishable Key</label>
                                <input
                                    type="text"
                                    value={config.stripe.publicKey}
                                    onChange={(e) => updateConfig('stripe', 'publicKey', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                                    placeholder="pk_test_..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Secret Key</label>
                                <div className="relative">
                                    <input
                                        type={showSecret ? "text" : "password"}
                                        value={config.stripe.secretKey}
                                        onChange={(e) => updateConfig('stripe', 'secretKey', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors font-mono text-sm pr-12"
                                        placeholder={config.stripe.secretKey ? "(Hidden)" : "sk_test_..."}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                    >
                                        {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Webhook Secret</label>
                                <div className="relative">
                                    <input
                                        type={showSecret ? "text" : "password"}
                                        value={config.stripe.webhookSecret}
                                        onChange={(e) => updateConfig('stripe', 'webhookSecret', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors font-mono text-sm pr-12"
                                        placeholder={config.stripe.webhookSecret ? "(Hidden)" : "whsec_..."}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Required for payment verification. Found in Stripe Dashboard Developers &gt; Webhooks.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cash On Delivery */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Cash on Delivery</h3>
                            <p className="text-sm text-slate-400">Pay when order arrives</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${config.cashOnDelivery.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {config.cashOnDelivery.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                            onClick={() => updateConfig('cashOnDelivery', 'enabled', !config.cashOnDelivery.enabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.cashOnDelivery.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${config.cashOnDelivery.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* PayPal (Placeholder for future) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 opacity-50 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">Coming Soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
                                <span className="font-black italic text-lg">P</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">PayPal</h3>
                                <p className="text-sm text-slate-400">Safe online payments</p>
                            </div>
                        </div>
                        <div className="w-12 h-6 rounded-full bg-slate-700 relative">
                            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform translate-x-0" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
