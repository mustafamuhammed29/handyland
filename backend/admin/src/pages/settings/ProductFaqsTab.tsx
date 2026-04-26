import { Input } from '../SettingsManager';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

export const ProductFaqsTab = ({ settings, handleChange }: any) => {
    const faqs = Array.isArray(settings.productFaqs) ? settings.productFaqs : [];

    const handleAddFaq = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        const newFaqs = [...faqs, { question: '', answer: '' }];
        handleChange(null, 'productFaqs', newFaqs);
    };

    const handleRemoveFaq = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        const newFaqs = faqs.filter((_: any, i: number) => i !== index);
        handleChange(null, 'productFaqs', newFaqs);
    };

    const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
        const newFaqs = [...faqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        handleChange(null, 'productFaqs', newFaqs);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                        <HelpCircle className="text-cyan-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Product FAQs</h3>
                        <p className="text-slate-400 text-sm">Manage the questions and answers that appear on all product pages.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAddFaq}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm"
                >
                    <Plus size={16} /> Add FAQ
                </button>
            </div>

            <div className="space-y-4">
                {faqs.map((faq: any, index: number) => (
                    <div key={index} className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4 relative group">
                        <button
                            type="button"
                            onClick={(e) => handleRemoveFaq(e, index)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove FAQ"
                        >
                            <Trash2 size={18} />
                        </button>
                        
                        <div className="pr-8">
                            <Input
                                label={`Question ${index + 1}`}
                                value={faq.question}
                                onChange={(v: string) => handleUpdateFaq(index, 'question', v)}
                                placeholder="e.g. Is the device unlocked?"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-slate-400 text-sm font-bold mb-2">Answer</label>
                            <textarea
                                value={faq.answer}
                                onChange={e => handleUpdateFaq(index, 'answer', e.target.value)}
                                rows={3}
                                placeholder="Provide the answer here..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                ))}
                
                {faqs.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl bg-slate-900/20">
                        <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-slate-300 font-bold">No FAQs added yet</h4>
                        <p className="text-slate-500 text-sm mt-1 mb-4">Click the button below to add your first question.</p>
                        <button
                            type="button"
                            onClick={handleAddFaq}
                            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold text-sm bg-slate-800 px-4 py-2 rounded-lg"
                        >
                            <Plus size={16} /> Add FAQ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
