import React, { useState } from 'react';
import { LanguageCode } from '../types';
import { Upload, Camera, Tag, Smartphone, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

interface SellerStudioProps {
    lang: LanguageCode;
}

export const SellerStudio: React.FC<SellerStudioProps> = ({ lang }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    // Mock Form State
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [condition, setCondition] = useState('used');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Mock API Submission
        setTimeout(() => {
            setIsSubmitting(false);
            addToast("Listing Published Successfully!", "success");
            navigate('/dashboard');
        }, 2000);
    };

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
                    <Tag className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white">Seller Studio</h1>
                    <p className="text-slate-400">Turn your tech into cash.</p>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden relative">
                {/* Progress Bar */}
                <div className="h-1 w-full bg-slate-800">
                    <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">

                    {/* STEP 1: IMAGES */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Camera className="w-5 h-5 text-orange-400" /> Device Photos
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-500/5 transition-all cursor-pointer group">
                                    <Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Front View</span>
                                </div>
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-500/5 transition-all cursor-pointer">
                                    <PlusIcon />
                                    <span className="text-xs mt-2">Back View</span>
                                </div>
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-500/5 transition-all cursor-pointer">
                                    <PlusIcon />
                                    <span className="text-xs mt-2">Accessories</span>
                                </div>
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-500/5 transition-all cursor-pointer">
                                    <PlusIcon />
                                    <span className="text-xs mt-2">Screen On</span>
                                </div>
                            </div>

                            <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-blue-200">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>Tip: Ensure the screen is on and shows the "About Phone" settings page for faster verification.</p>
                            </div>

                            <button type="button" onClick={() => setStep(2)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                                Next Step
                            </button>
                        </div>
                    )}

                    {/* STEP 2: DETAILS */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-orange-400" /> Device Details
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Listing Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. iPhone 14 Pro Max - 256GB - Deep Purple"
                                        className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Price (€)</label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Condition</label>
                                        <select
                                            value={condition}
                                            onChange={e => setCondition(e.target.value)}
                                            className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none appearance-none"
                                        >
                                            <option value="new">Brand New (Sealed)</option>
                                            <option value="like-new">Like New</option>
                                            <option value="used">Used (Good)</option>
                                            <option value="fair">Fair (Visible Wear)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Describe scratches, battery health, included accessories..."
                                        className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold rounded-xl transition-all">
                                    Back
                                </button>
                                <button type="button" onClick={() => setStep(3)} className="flex-[2] py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                                    Review Listing
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-orange-400" /> Review & Publish
                            </h2>

                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex gap-6">
                                <div className="w-24 h-24 bg-slate-700 rounded-lg shrink-0 flex items-center justify-center">
                                    <Smartphone className="w-10 h-10 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{title || "Untitled Listing"}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                        <span className="capitalize">{condition}</span>
                                        <span>•</span>
                                        <span>Verified Seller</span>
                                    </div>
                                    <div className="text-2xl font-bold text-orange-400 mt-2">
                                        €{price || "0"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setStep(2)} className="flex-1 py-4 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold rounded-xl transition-all">
                                    Edit
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Publish Listing <ArrowRight className="w-5 h-5" /></>}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
