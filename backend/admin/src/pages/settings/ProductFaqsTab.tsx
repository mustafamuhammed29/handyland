import { Input } from '../SettingsManager';
import { Plus, Trash2, HelpCircle, Smartphone, Headphones } from 'lucide-react';

export const ProductFaqsTab = ({ settings, handleChange }: any) => {
    const phoneFaqs = Array.isArray(settings.productFaqs) ? settings.productFaqs : [];
    const accessoryFaqs = Array.isArray(settings.accessoryFaqs) ? settings.accessoryFaqs : [];

    const handleAddFaq = (type: 'productFaqs' | 'accessoryFaqs', e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        const currentFaqs = type === 'productFaqs' ? phoneFaqs : accessoryFaqs;
        const newFaqs = [...currentFaqs, { question: '', answer: '' }];
        handleChange(null, type, newFaqs);
    };

    const handleRemoveFaq = (type: 'productFaqs' | 'accessoryFaqs', index: number, e: React.MouseEvent) => {
        e.preventDefault();
        const currentFaqs = type === 'productFaqs' ? phoneFaqs : accessoryFaqs;
        const newFaqs = currentFaqs.filter((_: any, i: number) => i !== index);
        handleChange(null, type, newFaqs);
    };

    const handleUpdateFaq = (type: 'productFaqs' | 'accessoryFaqs', index: number, field: 'question' | 'answer', value: string) => {
        const currentFaqs = type === 'productFaqs' ? phoneFaqs : accessoryFaqs;
        const newFaqs = [...currentFaqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        handleChange(null, type, newFaqs);
    };

    const renderFaqSection = (title: string, desc: string, icon: any, type: 'productFaqs' | 'accessoryFaqs', faqs: any[]) => (
        <div className="space-y-4 mb-12">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <p className="text-slate-400 text-sm">{desc}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={(e) => handleAddFaq(type, e)}
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
                            onClick={(e) => handleRemoveFaq(type, index, e)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove FAQ"
                        >
                            <Trash2 size={18} />
                        </button>
                        
                        <div className="pr-8">
                            <Input
                                label={`Question ${index + 1}`}
                                value={faq.question}
                                onChange={(v: string) => handleUpdateFaq(type, index, 'question', v)}
                                placeholder="e.g. Is the device unlocked?"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-slate-400 text-sm font-bold mb-2">Answer</label>
                            <textarea
                                value={faq.answer}
                                onChange={e => handleUpdateFaq(type, index, 'answer', e.target.value)}
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
                            onClick={(e) => handleAddFaq(type, e)}
                            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold text-sm bg-slate-800 px-4 py-2 rounded-lg"
                        >
                            <Plus size={16} /> Add FAQ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            {renderFaqSection('Phone FAQs', 'Manage the questions and answers that appear on phone product pages.', <Smartphone className="text-cyan-400" size={24} />, 'productFaqs', phoneFaqs)}
            <div className="h-px bg-slate-800 my-8"></div>
            {renderFaqSection('Accessory FAQs', 'Manage the questions and answers that appear on accessory product pages.', <Headphones className="text-cyan-400" size={24} />, 'accessoryFaqs', accessoryFaqs)}
        </div>
    );
};
