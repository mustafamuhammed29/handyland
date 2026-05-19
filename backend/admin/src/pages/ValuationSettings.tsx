import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

interface Category {
    id: string;
    name: string;
    label: string;
    emoji: string;
    icon_name: string;
    color: string;
    display_order: number;
    is_active: boolean;
}

interface Brand {
    id: string;
    name: string;
    logo_url: string;
    is_popular: boolean;
}

const ValuationSettings = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');

    // Forms state
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState<Partial<Category>>({
        name: '', label: '', emoji: '', icon_name: 'Smartphone', color: 'blue', display_order: 0, is_active: true
    });

    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [brandForm, setBrandForm] = useState<Partial<Brand>>({
        name: '', logo_url: '', is_popular: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, brandRes] = await Promise.all([
                api.get(`/api/valuation/categories?_t=${Date.now()}`),
                api.get(`/api/valuation/brands?_t=${Date.now()}`)
            ]);
            setCategories(catRes.data.data || []);
            setBrands(brandRes.data.data || []);
        } catch (err) {
            toast.error('Fehler beim Laden der Daten');
        } finally {
            setLoading(false);
        }
    };

    // --- Category Actions ---
    const handleSaveCategory = async () => {
        try {
            if (editingCat) {
                await api.put(`/api/valuation/categories/${editingCat.id}`, catForm);
                toast.success('Kategorie aktualisiert');
            } else {
                await api.post('/api/valuation/categories', catForm);
                toast.success('Kategorie erstellt');
            }
            setIsCatModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Fehler beim Speichern');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;
        try {
            await api.delete(`/api/valuation/categories/${id}`);
            toast.success('Kategorie gelöscht');
            fetchData();
        } catch (err) {
            toast.error('Fehler beim Löschen');
        }
    };

    // --- Brand Actions ---
    const handleSaveBrand = async () => {
        try {
            if (editingBrand) {
                await api.put(`/api/valuation/brands/${editingBrand.id}`, brandForm);
                toast.success('Marke aktualisiert');
            } else {
                await api.post('/api/valuation/brands', brandForm);
                toast.success('Marke erstellt');
            }
            setIsBrandModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Fehler beim Speichern');
        }
    };

    const handleDeleteBrand = async (id: string) => {
        if (!confirm('Möchten Sie diese Marke wirklich löschen?')) return;
        try {
            await api.delete(`/api/valuation/brands/${id}`);
            toast.success('Marke gelöscht');
            fetchData();
        } catch (err) {
            toast.error('Fehler beim Löschen');
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Ankauf-Konfiguration</h1>
                <p className="text-slate-400">Verwalten Sie Kategorien und Markensymbole für den Ankaufsprozess.</p>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-4 px-2 transition-all relative ${activeTab === 'categories' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <LayoutGrid size={18} />
                        Kategorien
                    </div>
                    {activeTab === 'categories' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`pb-4 px-2 transition-all relative ${activeTab === 'brands' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <ImageIcon size={18} />
                        Marken-Logos
                    </div>
                    {activeTab === 'brands' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
            </div>

            <main className="bg-[#0B1120]/60 backdrop-blur-xl border border-slate-800/60 p-6 rounded-3xl min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : activeTab === 'categories' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Kategorien verwalten</h2>
                            <button
                                onClick={() => { setEditingCat(null); setCatForm({ name: '', label: '', emoji: '', icon_name: 'Smartphone', color: 'blue', display_order: categories.length * 10, is_active: true }); setIsCatModalOpen(true); }}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
                            >
                                <Plus size={18} />
                                Neue Kategorie
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">
                                            {cat.emoji}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-100">{cat.label}</div>
                                            <div className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">{cat.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingCat(cat); setCatForm(cat); setIsCatModalOpen(true); }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="Kategorie bearbeiten" aria-label="Kategorie bearbeiten"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="Kategorie löschen" aria-label="Kategorie löschen"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Marken-Logos verwalten</h2>
                            <button
                                onClick={() => { setEditingBrand(null); setBrandForm({ name: '', logo_url: '', is_popular: false }); setIsBrandModalOpen(true); }}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
                            >
                                <Plus size={18} />
                                Neue Marke
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {brands.map((brand) => (
                                <div key={brand.id} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col items-center gap-3 group relative hover:border-blue-500/30 transition-all">
                                    <div className="h-16 w-full flex items-center justify-center p-2 bg-white/90 rounded-xl backdrop-blur-sm">
                                        <img src={brand.logo_url} alt={brand.name} className="max-h-full max-w-full object-contain" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{brand.name}</div>
                                    
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingBrand(brand); setBrandForm(brand); setIsBrandModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg" title="Marke bearbeiten" aria-label="Marke bearbeiten"><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteBrand(brand.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800/80 rounded-lg" title="Marke löschen" aria-label="Marke löschen"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Components */}
            <AnimatePresence>
                {isCatModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCatModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-[#0B1120] border border-slate-800 p-8 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <LayoutGrid className="text-blue-400" />
                                {editingCat ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
                            </h3>
                            <div className="space-y-4">
                                <div><label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Interner Name (ID)</label><input type="text" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 mt-1 focus:border-blue-500 outline-none transition-all" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="z.B. Smartphone" /></div>
                                <div><label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Anzeigename</label><input type="text" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 mt-1 focus:border-blue-500 outline-none transition-all" value={catForm.label} onChange={e => setCatForm({...catForm, label: e.target.value})} placeholder="z.B. Smartphones" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Emoji</label><input type="text" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 mt-1 focus:border-blue-500 outline-none transition-all text-center text-xl" value={catForm.emoji} onChange={e => setCatForm({...catForm, emoji: e.target.value})} placeholder="📱" /></div>
                                    <div><label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Icon Name (Lucide)</label><input type="text" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 mt-1 focus:border-blue-500 outline-none transition-all" value={catForm.icon_name} onChange={e => setCatForm({...catForm, icon_name: e.target.value})} placeholder="Smartphone" /></div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsCatModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl transition-all font-semibold">Abbrechen</button>
                                <button onClick={handleSaveCategory} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20">Speichern</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isBrandModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsBrandModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-[#0B1120] border border-slate-800 p-8 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ImageIcon className="text-blue-400" />
                                {editingBrand ? 'Marke bearbeiten' : 'Neue Marke'}
                            </h3>
                            <div className="space-y-4">
                                <div><label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Markenname</label><input type="text" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 mt-1 focus:border-blue-500 outline-none transition-all" value={brandForm.name} onChange={e => setBrandForm({...brandForm, name: e.target.value})} placeholder="z.B. Apple" /></div>
                                <div><label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Logo URL</label><input type="text" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 mt-1 focus:border-blue-500 outline-none transition-all" value={brandForm.logo_url} onChange={e => setBrandForm({...brandForm, logo_url: e.target.value})} placeholder="https://..." /></div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsBrandModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl transition-all font-semibold">Abbrechen</button>
                                <button onClick={handleSaveBrand} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20">Speichern</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ValuationSettings;
