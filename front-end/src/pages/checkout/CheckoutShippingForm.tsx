import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Tag, CheckCircle, ArrowRight, Loader2, Phone } from 'lucide-react';

// FIXED: Extracted from Checkout.tsx for better maintainability (FIX 5)

interface ShippingMethod {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    isExpress: boolean;
}

interface ShippingFormData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface CheckoutShippingFormProps {
    formData: ShippingFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    shippingMethods: ShippingMethod[];
    selectedMethodId: string;
    onMethodChange: (id: string) => void;
    isLoadingMethods: boolean;
    getShippingCostDisplay: (method: ShippingMethod) => string;
    onSubmit: (e: React.FormEvent) => void;
    formErrors: Partial<Record<keyof ShippingFormData, string>>;
    termsAccepted: boolean;
    onTermsChange: (accepted: boolean) => void;
    error: string | null;
    onClearError: () => void;
    user: any;
    setShippingDetails: React.Dispatch<React.SetStateAction<ShippingFormData>>;
    setFormErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof ShippingFormData, string>>>>;
}

export const CheckoutShippingForm: React.FC<CheckoutShippingFormProps> = ({
    formData,
    onChange,
    shippingMethods,
    selectedMethodId,
    onMethodChange,
    isLoadingMethods,
    getShippingCostDisplay,
    onSubmit,
    formErrors,
    termsAccepted,
    onTermsChange,
    error,
    onClearError,
    user,
    setShippingDetails,
    setFormErrors,
}) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-left-4">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-500" /> Shipping Details
            </h2>

            {/* Saved Addresses Selection */}
            {user && user.addresses && user.addresses.length > 0 && (
                <div className="mb-8 p-4 bg-slate-950/50 rounded-xl border border-dashed border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-3 h-3" /> Select Saved Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {user.addresses.map((addr: any, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setShippingDetails(prev => ({
                                        ...prev,
                                        fullName: prev.fullName && prev.fullName.trim() !== '' ? prev.fullName : (addr.name || prev.fullName),
                                        address: addr.street || '',
                                        city: addr.city || '',
                                        state: addr.state || '',
                                        zipCode: addr.zipCode || addr.postalCode || '',
                                        country: addr.country || 'Germany',
                                        phone: addr.phone || prev.phone
                                    }));
                                    setFormErrors({});
                                }}
                                className={`relative p-4 rounded-xl border cursor-pointer transition-all group ${formData.address === addr.street && formData.fullName === addr.name
                                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
                                    : 'bg-black/20 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-bold text-white text-sm">{addr.name}</div>
                                        <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            {addr.street}<br />
                                            {addr.zipCode || addr.postalCode} {addr.city}<br />
                                            {addr.country}
                                        </div>
                                        {addr.phone && (
                                            <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {addr.phone}
                                            </div>
                                        )}
                                    </div>
                                    {addr.isDefault && (
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-3 right-3 shadow-lg shadow-blue-900/50">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={onChange}
                            className={`w-full bg-black/40 border ${formErrors.fullName ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                            placeholder="John Doe"
                        />
                        {formErrors.fullName && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Email (for order updates)</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={onChange}
                            className={`w-full bg-black/40 border ${formErrors.email ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                            placeholder="john@example.com"
                        />
                        {formErrors.email && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.email}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={onChange}
                        className={`w-full bg-black/40 border ${formErrors.phone ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                        placeholder="+49 123 456789"
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.phone}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={onChange}
                        className={`w-full bg-black/40 border ${formErrors.address ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                        placeholder="123 Tech Street"
                    />
                    {formErrors.address && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.address}</p>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={onChange}
                            className={`w-full bg-black/40 border ${formErrors.city ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                            placeholder="Berlin"
                        />
                        {formErrors.city && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.city}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">State / Region</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={onChange}
                            className={`w-full bg-black/40 border ${formErrors.state ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                            placeholder="BE"
                        />
                        {formErrors.state && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.state}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Zip Code</label>
                        <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={onChange}
                            className={`w-full bg-black/40 border ${formErrors.zipCode ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none rtl:text-right transition-colors`}
                            placeholder="10115"
                        />
                        {formErrors.zipCode && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.zipCode}</p>}
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <label className="text-sm font-bold text-slate-400">Country</label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={onChange}
                            aria-label="Country"
                            className={`w-full bg-black/40 border ${formErrors.country ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                        >
                            <option value="Germany">Germany</option>
                            <option value="Austria">Austria</option>
                            <option value="Switzerland">Switzerland</option>
                        </select>
                        {formErrors.country && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.country}</p>}
                    </div>
                </div>

                {/* Shipping Method Selection */}
                <div className="pt-6 border-t border-slate-800">
                    <h3 className="font-bold text-white mb-4">Shipping Method</h3>
                    <div className="space-y-3">
                        {shippingMethods.map((method) => (
                            <label key={method._id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedMethodId === method._id ? 'bg-blue-600/10 border-blue-500' : 'bg-black/20 border-slate-700 hover:border-slate-500'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="shippingMethod"
                                        value={method._id}
                                        checked={selectedMethodId === method._id}
                                        onChange={() => onMethodChange(method._id)}
                                        className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                                    />
                                    <div>
                                        <div className="font-bold text-white">{method.name}</div>
                                        <div className="text-xs text-slate-400">{method.duration}</div>
                                    </div>
                                </div>
                                <div className={`font-bold ${method.isExpress ? 'text-emerald-400' : 'text-white'}`}>
                                    {getShippingCostDisplay(method)}
                                </div>
                            </label>
                        ))}
                        {shippingMethods.length === 0 && !isLoadingMethods && (
                            <div className="text-slate-400 text-sm">No shipping methods available.</div>
                        )}
                        {isLoadingMethods && (
                            <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading shipping methods...</div>
                        )}
                    </div>
                </div>

                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                        20%, 40%, 60%, 80% { transform: translateX(4px); }
                    }
                    .animate-shake {
                        animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                    }
                `}</style>

                {/* Terms & Conditions */}
                <div className={`pt-4 pb-2 transition-colors duration-300 rounded-lg p-2 ${error && !termsAccepted ? 'bg-red-500/10 border border-red-500/30 animate-shake' : ''}`}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${termsAccepted ? 'bg-blue-500 border-blue-500' : (error && !termsAccepted ? 'border-red-500' : 'border-slate-600 group-hover:border-blue-400')}`}>
                            {termsAccepted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={e => {
                                onTermsChange(e.target.checked);
                                if (e.target.checked) onClearError();
                            }}
                            className="hidden"
                        />
                        <span className={`text-sm ${error && !termsAccepted ? 'text-red-400 font-bold' : 'text-slate-400'} group-hover:text-slate-300`}>
                            I agree to the <Link to="/agb" target="_blank" className="text-blue-400 hover:underline">Terms & Conditions</Link> and <Link to="/privacy" target="_blank" className="text-blue-400 hover:underline">Privacy Policy</Link>.
                        </span>
                    </label>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        Proceed to Payment <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};
