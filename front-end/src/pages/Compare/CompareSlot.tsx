import React from 'react';
import { X, Plus, Search, ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

interface CompareSlotProps {
    slotIndex: number;
    product: any | null;
    isSearching: boolean;
    searchTerm: string;
    brandFilter: string;
    filteredSearch: any[];
    onSetIsSearching: (val: { slotIndex: number } | null) => void;
    onSetSearchTerm: (term: string) => void;
    onSetBrandFilter: (brand: string) => void;
    onSelectProduct: (product: any, slotIndex: number) => void;
    onRemoveProduct: (slotIndex: number) => void;
    onNavigate: (path: string) => void;
    onAddToCart: (product: any) => void;
    t: any;
}

export const CompareSlot: React.FC<CompareSlotProps> = ({
    slotIndex, product, isSearching, searchTerm, brandFilter, filteredSearch,
    onSetIsSearching, onSetSearchTerm, onSetBrandFilter, onSelectProduct, onRemoveProduct, onNavigate, onAddToCart, t
}) => {
    return (
        <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 min-h-[360px] flex flex-col items-center justify-center group overflow-hidden transition-all hover:border-brand-primary/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            {isSearching ? (
                <div className="absolute inset-0 bg-slate-900 z-20 flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">{t('compare.selectDevice', 'Gerät auswählen')}</h3>
                        <button onClick={() => onSetIsSearching(null)} title={t('common.close', 'Schließen')} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500 dark:text-slate-400"/></button>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <select 
                            title="Brand Filter"
                            aria-label="Filter by Brand"
                            className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary"
                            value={brandFilter} onChange={(e) => onSetBrandFilter(e.target.value)}
                        >
                            <option value="">All Brands</option>
                            <option value="Apple">Apple</option>
                            <option value="Samsung">Samsung</option>
                            <option value="Google">Google</option>
                            <option value="Xiaomi">Xiaomi</option>
                            <option value="Sony">Sony</option>
                        </select>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => onSetSearchTerm(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {filteredSearch.map(p => (
                            <button 
                                key={p._id || p.id} 
                                onClick={() => onSelectProduct(p, slotIndex)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
                            >
                                <img src={getImageUrl(p.images?.[0] || p.image || p.thumbnail)} alt={p.name} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-10 h-10 object-contain bg-white rounded-md p-1" />
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate">{p.name || p.model}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.price} €</div>
                                </div>
                            </button>
                        ))}
                        {filteredSearch.length === 0 && <div className="text-center text-slate-500 mt-8 text-sm">{t('compare.noDevicesFound', 'Keine Geräte gefunden.')}</div>}
                    </div>
                </div>
            ) : product ? (
                <>
                    <button 
                        onClick={() => onRemoveProduct(slotIndex)}
                        title={t('common.remove', 'Entfernen')}
                        className="absolute top-4 right-4 p-2 bg-slate-950 hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-400 rounded-full transition-colors z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="h-40 w-full mb-6 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-[40px] -z-10 group-hover:bg-brand-primary/20 transition-all"></div>
                        <img src={getImageUrl(product.images?.[0] || product.image || product.thumbnail)} alt={product.name || product.model} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-auto h-full max-w-full rounded-2xl object-cover mb-4 shadow-xl group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <h3 className="text-xl font-black text-center mb-2 line-clamp-1">{product.name || product.model}</h3>
                    
                    <div className="flex flex-col items-center justify-center gap-1 mb-4">
                        {product.specs?.globalPrice && (
                            <div className="text-slate-500 dark:text-slate-400 text-sm line-through decoration-red-500/50">{t('compare.marketAverage', 'Markt Ø')} €{product.specs.globalPrice}</div>
                        )}
                        <div className="text-brand-primary font-black text-2xl flex items-center gap-2">
                            €{product.pricing?.basePrice || product.price}
                            {product.specs?.globalPrice && Number(product.specs.globalPrice) > Number(product.price) && (
                                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {t('compare.save', 'Spare')} €{Number(product.specs.globalPrice) - Number(product.price)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex w-full gap-2 mt-auto">
                        <button 
                            onClick={() => onNavigate(`/products/${product.id || product._id}`)}
                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors text-center"
                        >
                            Details
                        </button>
                        <button 
                            onClick={() => onAddToCart(product)}
                            className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-secondary text-black rounded-xl text-sm font-bold transition-colors shadow-[0_0_15px_rgba(var(--brand-primary),0.3)] flex items-center justify-center gap-1"
                        >
                            <ShoppingCart className="w-4 h-4" /> Add
                        </button>
                    </div>
                </>
            ) : (
                <button 
                    onClick={() => onSetIsSearching({ slotIndex })}
                    className="flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-brand-primary transition-colors h-full w-full"
                >
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 group-hover:border-brand-primary flex items-center justify-center transition-colors">
                        <Plus className="w-8 h-8" />
                    </div>
                    <span className="font-bold">{t('compare.addDevice', 'Add Device')}</span>
                </button>
            )}
        </div>
    );
};
