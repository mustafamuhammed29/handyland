import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';

interface Props {
    settings: any;
    handleChange: any;
}

export const FeaturedServicesTab: React.FC<Props> = ({ settings, handleChange }) => {
    const featuredServices = settings.featuredServices || {
        tagline: 'Was wir anbieten',
        heading: 'Alles rund um dein Gerät',
        cards: [
            {
                id: 'buy',
                iconName: 'ShoppingBag',
                title: 'Kaufen',
                desc: 'Geprüfte Smartphones & Tablets zu fairen Preisen.',
                cta: 'Zum Marktplatz',
                route: '/marketplace',
                gradient: 'from-cyan-500/20 to-blue-500/10',
                border: 'hover:border-cyan-500/50',
                iconColor: 'text-cyan-400',
                ctaColor: 'text-cyan-400 group-hover:text-cyan-300',
            },
            {
                id: 'sell',
                iconName: 'Zap',
                title: 'Verkaufen',
                desc: 'Dein Gerät bewerten lassen und sofort ein Angebot erhalten.',
                cta: 'Gerät bewerten',
                route: '/valuation',
                gradient: 'from-amber-500/20 to-orange-500/10',
                border: 'hover:border-amber-500/50',
                iconColor: 'text-amber-400',
                ctaColor: 'text-amber-400 group-hover:text-amber-300',
            },
            {
                id: 'repair',
                iconName: 'Wrench',
                title: 'Reparieren',
                desc: 'Professionelle Reparaturen für alle Geräte — schnell & günstig.',
                cta: 'Reparatur anfragen',
                route: '/repair',
                gradient: 'from-purple-500/20 to-indigo-500/10',
                border: 'hover:border-purple-500/50',
                iconColor: 'text-purple-400',
                ctaColor: 'text-purple-400 group-hover:text-purple-300',
            }
        ]
    };

    const updateHeader = (field: string, value: string) => {
        handleChange('featuredServices', field, value);
    };

    const updateCard = (index: number, field: string, value: string) => {
        const newCards = [...featuredServices.cards];
        newCards[index] = { ...newCards[index], [field]: value };
        handleChange('featuredServices', 'cards', newCards);
    };

    const addCard = () => {
        const newCards = [
            ...featuredServices.cards,
            {
                id: Date.now().toString(),
                iconName: 'Star',
                title: 'Neuer Service',
                desc: 'Beschreibung hier eingeben',
                cta: 'Mehr erfahren',
                route: '/',
                gradient: 'from-blue-500/20 to-indigo-500/10',
                border: 'hover:border-blue-500/50',
                iconColor: 'text-blue-400',
                ctaColor: 'text-blue-400 group-hover:text-blue-300',
            }
        ];
        handleChange('featuredServices', 'cards', newCards);
    };

    const removeCard = (index: number) => {
        const newCards = featuredServices.cards.filter((_: any, i: number) => i !== index);
        handleChange('featuredServices', 'cards', newCards);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <Layers className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Featured Services</h3>
                        <p className="text-slate-400 text-sm">Manage the main services blocks shown on the home page.</p>
                    </div>
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-indigo-400 font-bold mb-2">Section Header</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-bold mb-1">Tagline (Small Title)</label>
                        <input
                            value={featuredServices.tagline}
                            onChange={(e) => updateHeader('tagline', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                            placeholder="Was wir anbieten"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-bold mb-1">Main Heading</label>
                        <input
                            value={featuredServices.heading}
                            onChange={(e) => updateHeader('heading', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                            placeholder="Alles rund um dein Gerät"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-8 mb-4">
                <h4 className="text-lg font-bold text-white">Service Cards</h4>
                <button
                    onClick={addCard}
                    className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-all border border-indigo-500/30 text-sm"
                >
                    <Plus size={16} /> Add Card
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {featuredServices.cards.map((card: any, index: number) => (
                    <div key={index} className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 relative group">
                        <button
                            onClick={() => removeCard(index)}
                            title="Delete service"
                            aria-label="Delete service"
                            className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Title</label>
                                    <input
                                        value={card.title}
                                        onChange={(e) => updateCard(index, 'title', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                                        placeholder="Kaufen"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Lucide Icon Name</label>
                                    <input
                                        value={card.iconName}
                                        onChange={(e) => updateCard(index, 'iconName', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                                        placeholder="ShoppingBag"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-1">Description</label>
                                <textarea
                                    value={card.desc}
                                    onChange={(e) => updateCard(index, 'desc', e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm resize-none"
                                    placeholder="Description text here..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Button Text (CTA)</label>
                                    <input
                                        value={card.cta}
                                        onChange={(e) => updateCard(index, 'cta', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                                        placeholder="Zum Marktplatz"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Route / URL</label>
                                    <input
                                        value={card.route}
                                        onChange={(e) => updateCard(index, 'route', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                                        placeholder="/marketplace"
                                    />
                                </div>
                            </div>
                            
                            <details className="mt-2 text-sm text-slate-400 cursor-pointer group">
                                <summary className="font-semibold text-xs mb-2 outline-none group-hover:text-indigo-400 transition-colors">Advanced Styling</summary>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg mt-1 cursor-default">
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-1">Gradient Class</label>
                                        <input value={card.gradient} onChange={(e) => updateCard(index, 'gradient', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-1">Border Hover Class</label>
                                        <input value={card.border} onChange={(e) => updateCard(index, 'border', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-1">Icon Color Class</label>
                                        <input value={card.iconColor} onChange={(e) => updateCard(index, 'iconColor', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-1">CTA Color Class</label>
                                        <input value={card.ctaColor} onChange={(e) => updateCard(index, 'ctaColor', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono" />
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                ))}
            </div>
            {featuredServices.cards.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl text-slate-500">
                    No featured services configured.
                </div>
            )}
        </div>
    );
};
