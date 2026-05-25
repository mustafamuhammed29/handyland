import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Download, Smartphone, Edit2 } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

interface EbayImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: () => void;
}

export const EbayImportModal: React.FC<EbayImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
    const [query, setQuery] = useState('');
    const [year, setYear] = useState('');
    const [categoryId, setCategoryId] = useState('9355'); // Default to Smartphones
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
    const [tempBrandValue, setTempBrandValue] = useState('');

    const guessCategory = (title: string): string => {
        const t = title.toLowerCase();
        if (t.includes('watch') || t.includes('band') || t.includes('fitbit') || t.includes('garmin')) return 'Smartwatch';
        if (t.includes('ipad') || t.includes('tab ') || t.includes('tablet')) return 'Tablet';
        if (t.includes('macbook') || t.includes('laptop') || t.includes('thinkpad') || t.includes('xps') || t.includes('ideapad')) return 'Laptop';
        if (t.includes('playstation') || t.includes('xbox') || t.includes('nintendo') || t.includes('switch') || t.includes('ps4') || t.includes('ps5')) return 'Gaming';
        return 'Smartphone';
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const finalQuery = year.trim() ? `${query.trim()} ${year.trim()}` : query.trim();
            const endpoint = `/api/ebay-catalog/search?q=${encodeURIComponent(finalQuery)}&categoryId=${categoryId}`;
            const { data } = await api.get(endpoint);
            if (data.success) {
                setResults(data.data || []);
                setSelectedIds([]); // reset selection on new search
            } else {
                toast.error(data.message || 'Fehler bei der Suche');
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Fehler bei der Verbindung zur eBay API.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (selectedIds.length === 0) return;
        setImporting(true);
        try {
            const categoryMap: Record<string, string> = {
                '9355': 'Smartphone',
                '171485': 'Tablet',
                '178893': 'Smartwatch',
                '175672': 'Laptop'
            };
            const mappedCategory = categoryId === 'all' ? null : (categoryMap[categoryId] || 'Smartphone');
            
            const selectedDevices = results.filter(r => selectedIds.includes(r.id)).map(d => ({ 
                ...d, 
                category: mappedCategory || guessCategory(d.model || '') 
            }));
            const { data } = await api.post('/api/ebay-catalog/import', { devices: selectedDevices }, { timeout: 60000 });
            if (data.success) {
                toast.success(`${data.count} Gerät(e) erfolgreich importiert!`);
                onImportSuccess();
                onClose();
            } else {
                toast.error(data.message || 'Import fehlgeschlagen');
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Fehler beim Importieren.');
        } finally {
            setImporting(false);
        }
    };

    const handleQuickImport = async (item: any) => {
        setImporting(true);
        try {
            const categoryMap: Record<string, string> = {
                '9355': 'Smartphone',
                '171485': 'Tablet',
                '178893': 'Smartwatch',
                '175672': 'Laptop'
            };
            const mappedCategory = categoryId === 'all' ? null : (categoryMap[categoryId] || 'Smartphone');
            
            const itemWithCategory = { ...item, category: mappedCategory || guessCategory(item.model || '') };
            const { data } = await api.post('/api/ebay-catalog/import', { devices: [itemWithCategory] }, { timeout: 30000 });
            if (data.success) {
                toast.success(`1 Gerät erfolgreich importiert!`);
                setResults(prev => prev.map(r => r.id === item.id ? { ...r, isImported: true } : r));
                onImportSuccess();
            } else {
                toast.error(data.message || 'Import fehlgeschlagen');
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Fehler beim Importieren.');
        } finally {
            setImporting(false);
        }
    };

    const handleSaveBrand = (id: string) => {
        if (tempBrandValue.trim()) {
            setResults(prev => prev.map(r => r.id === id ? { ...r, brand: tempBrandValue.trim() } : r));
        }
        setEditingBrandId(null);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        const importableResults = results.filter(r => !r.isImported);
        if (selectedIds.length === importableResults.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(importableResults.map(r => r.id));
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
                    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-[#0B1120]/95 backdrop-blur-xl border border-blue-500/20 p-6 sm:p-8 rounded-[32px] w-full max-w-4xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.25)] overflow-hidden max-h-[90vh] flex flex-col">
                        
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                        
                        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-800 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-3xl font-black flex items-center gap-4 text-white tracking-tight">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full" />
                                    <span className="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3 rounded-2xl flex items-center justify-center shadow-lg border border-blue-400/30">
                                        <Download size={26} strokeWidth={2.5} />
                                    </span>
                                </div>
                                Import from eBay Catalog
                            </h2>
                            <p className="text-slate-400 mt-3 font-medium text-lg ml-1">Suchen Sie direkt im eBay-Katalog nach echten Gerätemodellen.</p>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
                            <div className="relative w-full sm:w-48">
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-4 py-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="9355">📱 Smartphones</option>
                                    <option value="171485">💊 Tablets</option>
                                    <option value="178893">⌚ Smartwatches</option>
                                    <option value="175672">💻 Laptops</option>
                                    <option value="all">🌐 Alle Kategorien</option>
                                </select>
                            </div>
                            <div className="relative w-full sm:w-48">
                                <select
                                    value={['Apple', 'Samsung', 'Google', 'Huawei', 'Xiaomi', 'Garmin'].includes(query) ? query : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setQuery(e.target.value);
                                        }
                                    }}
                                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-4 py-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">🎯 Smart Marke...</option>
                                    <option value="Apple">Apple</option>
                                    <option value="Samsung">Samsung</option>
                                    <option value="Google">Google</option>
                                    <option value="Huawei">Huawei</option>
                                    <option value="Xiaomi">Xiaomi</option>
                                    <option value="Garmin">Garmin</option>
                                </select>
                            </div>
                            <div className="relative w-24 sm:w-28 shrink-0">
                                <input
                                    type="text"
                                    placeholder="Jahr (z.B. 2023)"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    maxLength={4}
                                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-3 py-4 text-center text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-500 shadow-inner"
                                />
                            </div>
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="z.B. iPhone 15 Pro, Galaxy S24..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 text-lg text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-500 shadow-inner"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !query.trim()}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:hover:from-blue-600 text-white px-8 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center min-w-[130px] border border-blue-500/20"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Suchen'}
                            </button>
                        </form>

                        {/* Results Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800/60 rounded-2xl bg-slate-950/50 relative min-h-[300px]">
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    <span className="font-medium animate-pulse">Durchsuche eBay Katalog...</span>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
                                    <Smartphone size={48} className="opacity-20" />
                                    <p>Suchen Sie nach einem Gerät (z.B. iPhone 14), um Ergebnisse zu sehen.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-bold sticky top-0 backdrop-blur-md z-10 border-b border-slate-800">
                                        <tr>
                                            <th className="p-4 w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.length > 0 && selectedIds.length === results.filter(r => !r.isImported).length}
                                                    onChange={toggleAll}
                                                    className="w-4 h-4 accent-blue-500 cursor-pointer rounded border-slate-700" 
                                                />
                                            </th>
                                            <th className="p-4">Modell</th>
                                            <th className="p-4">Marke</th>
                                            <th className="p-4">Quelle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50 pb-4 block sm:table-row-group">
                                        {results.map((item, idx) => (
                                            <motion.tr 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                key={item.id} 
                                                className={`group hover:bg-blue-900/10 transition-all duration-300 ${selectedIds.includes(item.id) ? 'bg-blue-500/10' : ''}`}
                                            >
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        disabled={item.isImported}
                                                        checked={selectedIds.includes(item.id) || item.isImported}
                                                        onChange={() => toggleSelection(item.id)}
                                                        className="w-4 h-4 accent-blue-500 cursor-pointer rounded border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" 
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 ${item.isImported ? 'bg-slate-800/50' : 'bg-slate-800'} rounded-xl flex items-center justify-center border border-slate-700`}>
                                                            <Smartphone className={item.isImported ? 'text-slate-600' : 'text-slate-400'} size={20} />
                                                        </div>
                                                        <span className={`font-bold text-base ${item.isImported ? 'text-slate-500 line-through' : 'text-white'}`}>{item.model}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {editingBrandId === item.id ? (
                                                        <input 
                                                            type="text" 
                                                            autoFocus
                                                            value={tempBrandValue}
                                                            onChange={e => setTempBrandValue(e.target.value)}
                                                            onBlur={() => handleSaveBrand(item.id)}
                                                            onKeyDown={e => e.key === 'Enter' && handleSaveBrand(item.id)}
                                                            className="bg-slate-900 border border-blue-500 rounded-lg px-2 py-1 w-24 text-xs font-bold text-white outline-none"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 group/brand">
                                                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide border ${
                                                                item.isImported ? 'bg-slate-800/30 text-slate-600 border-slate-700' :
                                                                item.brand === 'Apple' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                                                                item.brand === 'Samsung' ? 'bg-blue-900/40 text-blue-300 border-blue-500/30' :
                                                                item.brand === 'Google' ? 'bg-orange-900/40 text-orange-300 border-orange-500/30' :
                                                                'bg-slate-800 text-slate-300 border-slate-700'
                                                            }`}>
                                                                {item.brand}
                                                            </span>
                                                            {!item.isImported && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setTempBrandValue(item.brand);
                                                                        setEditingBrandId(item.id);
                                                                    }}
                                                                    className="opacity-0 group-hover/brand:opacity-100 text-slate-500 hover:text-blue-400 transition-colors"
                                                                    title="Marke bearbeiten"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3 justify-between">
                                                        <span className="text-blue-400/50 font-medium text-sm flex items-center gap-1">
                                                            {item.source}
                                                        </span>
                                                        {item.isImported ? (
                                                            <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded-md border border-green-500/20">
                                                                Hinzugefügt
                                                            </span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleQuickImport(item)}
                                                                className="opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-all"
                                                                title="Schnell importieren"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-6">
                            <div className="text-slate-400 text-sm flex items-center gap-2">
                                {selectedIds.length > 0 ? (
                                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold">
                                        {selectedIds.length} von {results.length} ausgewählt
                                    </span>
                                ) : (
                                    <span>{selectedIds.length} von {results.length} ausgewählt</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button 
                                    onClick={handleImport}
                                    disabled={selectedIds.length === 0 || importing}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                >
                                    {importing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Importiere...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Ausgewählte Importieren
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
