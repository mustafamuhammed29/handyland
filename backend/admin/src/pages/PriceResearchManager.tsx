import React, { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, RefreshCw, CheckCircle, AlertCircle, Loader2, ExternalLink, ChevronDown, ChevronUp, BarChart3, Zap, Target, Info } from 'lucide-react';
import { api } from '../utils/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Blueprint {
    _id: string;
    brand: string;
    model: string;
    basePrice: number;
    validStorages: string[];
    lastResearched: string | null;
    marketAvg: number | null;
    previousPrice: number | null;
    needsUpdate: boolean;
}

interface EbayResult {
    avg: number | null;
    min: number | null;
    max: number | null;
    count: number;
    keyword: string;
    suggestedBuyback: {
        conservative: number;
        balanced: number;
        aggressive: number;
    };
    samples: Array<{ price: number; title: string; condition: string; url: string; soldDate: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timeSince = (dateStr: string | null) => {
    if (!dateStr) return 'Nie';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Heute';
    if (days === 1) return 'Gestern';
    return `vor ${days} Tagen`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const PriceBadge = ({ label, price, color, onClick, active }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
            active
                ? `border-${color}-500 bg-${color}-500/20 shadow-[0_0_15px_rgba(var(--tw-shadow-color),0.3)]`
                : `border-slate-700 bg-slate-900/50 hover:border-${color}-500/50`
        }`}
    >
        <p className={`text-xs font-bold uppercase tracking-wider text-${color}-400 mb-1`}>{label}</p>
        <p className="text-2xl font-black text-white">{price}€</p>
    </button>
);

const SampleRow = ({ sample }: { sample: any }) => (
    <a
        href={sample.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-600 transition-all group"
    >
        <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
                {sample.title}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">{sample.condition} · {sample.soldDate ? new Date(sample.soldDate).toLocaleDateString('de-DE') : ''}</p>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
            <span className="text-emerald-400 font-black text-lg">{sample.price.toFixed(0)}€</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </div>
    </a>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PriceResearchManager: React.FC = () => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'needs_update' | 'researched'>('all');

    const [selected, setSelected] = useState<Blueprint | null>(null);
    const [researchData, setResearchData] = useState<Record<string, EbayResult>>({});
    const [researching, setResearching] = useState(false);
    const [applying, setApplying] = useState(false);
    const [appliedStorage, setAppliedStorage] = useState<string | null>(null);
    const [chosenBuyback, setChosenBuyback] = useState<Record<string, 'conservative' | 'balanced' | 'aggressive'>>({});
    const [expandedStorage, setExpandedStorage] = useState<string | null>(null);
    const [ebayConfigured, setEbayConfigured] = useState(true);
    const [stats, setStats] = useState({ total: 0, researched: 0, needsUpdate: 0 });

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/price-research/status');
            const data = response.data;
            setBlueprints(data.blueprints || []);
            setStats(data.stats || { total: 0, researched: 0, needsUpdate: 0 });
        } catch (err) {
            console.error('Failed to load blueprints:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const handleResearch = async (bp: Blueprint) => {
        setSelected(bp);
        setResearchData({});
        setAppliedStorage(null);
        setChosenBuyback({});
        setExpandedStorage(null);
        setResearching(true);

        try {
            const response = await api.post(`/api/price-research/ebay/device/${bp._id}`, {});
            const data = response.data;
            if (data.success) {
                setResearchData(data.data.storages);
                // default all storages to 'balanced'
                const defaults: Record<string, any> = {};
                bp.validStorages.forEach(s => { defaults[s] = 'balanced'; });
                setChosenBuyback(defaults);
                setExpandedStorage(bp.validStorages[0]);
            } else if (data.message?.includes('not configured')) {
                setEbayConfigured(false);
            }
        } catch (err: any) {
            if (err?.response?.data?.message?.includes('not configured')) {
                setEbayConfigured(false);
            }
        } finally {
            setResearching(false);
        }
    };

    const handleApplyAll = async () => {
        if (!selected) return;
        setApplying(true);
        try {
            // Build new basePrice and storagePrices from chosen tier
            // Use 128GB (or first storage) as new basePrice
            const firstStorage = selected.validStorages[0];
            const firstResult = researchData[firstStorage];
            if (!firstResult?.avg) {
                alert('Keine eBay-Daten für diese Variante.');
                setApplying(false);
                return;
            }

            const tier = chosenBuyback[firstStorage] || 'balanced';
            const newBasePrice = firstResult.suggestedBuyback[tier];

            // Build storage addon prices relative to new base
            const storagePrices: Record<string, number> = {};
            selected.validStorages.forEach((s, idx) => {
                if (idx === 0) { storagePrices[s] = 0; return; }
                const sResult = researchData[s];
                if (sResult?.avg) {
                    const sTier = chosenBuyback[s] || 'balanced';
                    const sPrice = sResult.suggestedBuyback[sTier];
                    storagePrices[s] = Math.max(0, sPrice - newBasePrice);
                }
            });

            await api.post(`/api/price-research/apply/${selected._id}`, {
                newBasePrice,
                storagePrices,
                marketAvg: firstResult.avg,
                ebaySource: 'eBay.de Completed Listings',
            });

            setAppliedStorage('all');
            await fetchStatus();
        } catch (err) {
            alert('Fehler beim Anwenden der Preise.');
        } finally {
            setApplying(false);
        }
    };

    const filtered = blueprints.filter(b => {
        const matchSearch = b.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.brand.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filter === 'all' || (filter === 'needs_update' && b.needsUpdate) ||
            (filter === 'researched' && !!b.lastResearched);
        return matchSearch && matchFilter;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <TrendingUp className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">eBay Preisrecherche</h1>
                        <p className="text-slate-400 text-sm">Aktuelle Gebrauchtpreise von eBay.de · Abgeschlossene Verkäufe</p>
                    </div>
                </div>
                <button onClick={fetchStatus} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all" title="Refresh">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* eBay not configured warning */}
            {!ebayConfigured && (
                <div className="p-5 bg-amber-900/20 border border-amber-500/40 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-300 font-bold mb-1">eBay API nicht konfiguriert</p>
                        <p className="text-amber-400/80 text-sm mb-3">
                            Trage deinen <strong>eBay App ID</strong> in die <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">.env</code> Datei ein:
                        </p>
                        <code className="block bg-black/40 rounded-xl px-4 py-3 text-emerald-400 text-sm font-mono">
                            EBAY_APP_ID=Your_App_ID_Here
                        </code>
                        <a
                            href="https://developer.ebay.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors"
                        >
                            <ExternalLink size={14} /> Kostenlos registrieren auf developer.ebay.com
                        </a>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Geräte gesamt', value: stats.total, color: 'blue', icon: BarChart3 },
                    { label: 'Recherchiert', value: stats.researched, color: 'emerald', icon: CheckCircle },
                    { label: 'Braucht Update', value: stats.needsUpdate, color: 'amber', icon: AlertCircle },
                ].map(stat => (
                    <div key={stat.label} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10`}>
                            <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                            <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Device List */}
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Gerät suchen..."
                                title="Gerät suchen"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-blue-500 outline-none text-sm"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as any)}
                            title="Filter"
                            aria-label="Filter blueprints"
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">Alle</option>
                            <option value="needs_update">Braucht Update</option>
                            <option value="researched">Recherchiert</option>
                        </select>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : filtered.map(bp => (
                            <button
                                key={bp._id}
                                onClick={() => handleResearch(bp)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    selected?._id === bp._id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-bold text-sm">{bp.model}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">{bp.brand} · {bp.validStorages.join(', ')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-black">{bp.basePrice}€</p>
                                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                            {bp.needsUpdate
                                                ? <span className="text-[10px] text-amber-400 font-bold">⚠ Update nötig</span>
                                                : <span className="text-[10px] text-emerald-400 font-bold">✓ Aktuell</span>
                                            }
                                            <span className="text-[10px] text-slate-600">{timeSince(bp.lastResearched)}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {!loading && filtered.length === 0 && (
                            <div className="py-12 text-center text-slate-500">Keine Geräte gefunden</div>
                        )}
                    </div>
                </div>

                {/* Right: Research Results */}
                <div className="space-y-4">
                    {!selected && !researching && (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-center p-8">
                            <div className="p-4 bg-slate-800/50 rounded-2xl mb-4">
                                <Search className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-slate-400 font-bold mb-2">Gerät auswählen</h3>
                            <p className="text-slate-600 text-sm">Wähle ein Gerät aus der Liste um aktuelle eBay.de Preise abzurufen</p>
                            <div className="mt-6 p-4 bg-blue-950/40 border border-blue-800/30 rounded-xl text-left max-w-xs">
                                <p className="text-blue-400 text-xs font-bold flex items-center gap-2 mb-2"><Info size={12} /> Wie funktioniert das?</p>
                                <ul className="text-blue-300/70 text-xs space-y-1.5">
                                    <li>• Sucht abgeschlossene Verkäufe auf eBay.de</li>
                                    <li>• Berechnet den Marktdurchschnitt</li>
                                    <li>• Schlägt Ankaufspreise vor (52–65%)</li>
                                    <li>• Du wählst den Tier und wendest an</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {researching && (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-slate-800 rounded-2xl">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
                            <p className="text-white font-bold">{selected?.model} wird recherchiert...</p>
                            <p className="text-slate-500 text-sm mt-1">Abrufen von eBay.de Abschlusspreisen</p>
                        </div>
                    )}

                    {selected && !researching && Object.keys(researchData).length > 0 && (
                        <div className="space-y-4">
                            {/* Device Header */}
                            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-700 rounded-2xl">
                                <div>
                                    <h3 className="text-white font-black text-lg">{selected.model}</h3>
                                    <p className="text-slate-400 text-sm">Aktueller Ankaufspreis: <span className="text-emerald-400 font-bold">{selected.basePrice}€</span></p>
                                </div>
                                {appliedStorage === 'all'
                                    ? <div className="flex items-center gap-2 text-emerald-400 font-bold"><CheckCircle size={18} /> Angewendet!</div>
                                    : <button
                                        onClick={handleApplyAll}
                                        disabled={applying}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all"
                                    >
                                        {applying ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                        {applying ? 'Wird angewendet...' : 'Alle anwenden'}
                                    </button>
                                }
                            </div>

                            {/* Storage Variants */}
                            {selected.validStorages.map(storage => {
                                const result = researchData[storage];
                                const isExpanded = expandedStorage === storage;
                                const tier = chosenBuyback[storage] || 'balanced';

                                return (
                                    <div key={storage} className="border border-slate-700 rounded-2xl overflow-hidden">
                                        {/* Collapsed header */}
                                        <button
                                            onClick={() => setExpandedStorage(isExpanded ? null : storage)}
                                            className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold text-sm">{storage}</span>
                                                {result?.avg
                                                    ? <span className="text-slate-300 text-sm">eBay Ø <strong className="text-white">{result.avg}€</strong> · {result.count} Verkäufe</span>
                                                    : <span className="text-slate-500 text-sm">Keine Daten</span>
                                                }
                                            </div>
                                            {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                                        </button>

                                        {/* Expanded detail */}
                                        {isExpanded && result?.avg && (
                                            <div className="p-4 bg-slate-950/50 border-t border-slate-800 space-y-4">
                                                {/* Price range bar */}
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-slate-500">Min: <strong className="text-white">{result.min}€</strong></span>
                                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full" style={{ width: '100%' }} />
                                                    </div>
                                                    <span className="text-slate-500">Max: <strong className="text-white">{result.max}€</strong></span>
                                                </div>

                                                {/* Tier selector */}
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Ankaufspreis wählen (% vom Marktpreis)</p>
                                                    <div className="flex gap-3">
                                                        <PriceBadge label="Sicher 52%" price={result.suggestedBuyback.conservative}
                                                            color="slate" active={tier === 'conservative'}
                                                            onClick={() => setChosenBuyback(p => ({ ...p, [storage]: 'conservative' }))} />
                                                        <PriceBadge label="⚡ Optimal 58%" price={result.suggestedBuyback.balanced}
                                                            color="blue" active={tier === 'balanced'}
                                                            onClick={() => setChosenBuyback(p => ({ ...p, [storage]: 'balanced' }))} />
                                                        <PriceBadge label="🏆 Aggressiv 65%" price={result.suggestedBuyback.aggressive}
                                                            color="emerald" active={tier === 'aggressive'}
                                                            onClick={() => setChosenBuyback(p => ({ ...p, [storage]: 'aggressive' }))} />
                                                    </div>
                                                </div>

                                                {/* Sample listings */}
                                                {result.samples?.length > 0 && (
                                                    <div>
                                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Beispiel-Verkäufe auf eBay.de</p>
                                                        <div className="space-y-2">
                                                            {result.samples.map((s, i) => <SampleRow key={i} sample={s} />)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isExpanded && !result?.avg && (
                                            <div className="p-6 text-center border-t border-slate-800 bg-slate-950/50">
                                                <Target className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                                <p className="text-slate-500 text-sm">Keine abgeschlossenen eBay-Verkäufe gefunden für "{storage}"</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceResearchManager;
