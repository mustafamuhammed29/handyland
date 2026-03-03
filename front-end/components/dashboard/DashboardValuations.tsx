import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, TrendingUp, Shield, ChevronRight, Plus, Clock, CheckCircle2, Package, Banknote, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SavedValuation } from '../../types';

interface ValuationWithMeta extends SavedValuation {
    expiresAt?: string | number;
    status?: string;
    quoteReference?: string;
    screenCondition?: string;
    bodyCondition?: string;
    isFunctional?: boolean;
}

interface DashboardValuationsProps {
    valuations: ValuationWithMeta[];
    isLoading: boolean;
    onSell: (valId: string) => void;
    onDelete?: (valId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending_shipment: {
        label: 'Versand ausstehend',
        color: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        icon: <Package className="w-3 h-3" />
    },
    received: {
        label: 'Erhalten — Prüfung',
        color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        icon: <CheckCircle2 className="w-3 h-3" />
    },
    paid: {
        label: 'Bezahlt',
        color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        icon: <Banknote className="w-3 h-3" />
    },
    active: {
        label: 'Aktiv',
        color: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
        icon: <Clock className="w-3 h-3" />
    }
};

const CountdownBadge = ({ expiresAt }: { expiresAt?: string | number }) => {
    const [text, setText] = useState('');
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!expiresAt) return;
        const target = new Date(expiresAt).getTime();

        const update = () => {
            const remaining = target - Date.now();
            if (remaining <= 0) {
                setText('Abgelaufen');
                if (ref.current) clearInterval(ref.current);
                return;
            }
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            setText(`${h}h ${m}m`);
        };
        update();
        ref.current = setInterval(update, 60000);
        return () => { if (ref.current) clearInterval(ref.current); };
    }, [expiresAt]);

    if (!text) return null;
    const isExpired = text === 'Abgelaufen';

    return (
        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isExpired ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            <Clock className="w-2.5 h-2.5" />
            {isExpired ? 'Abgelaufen' : `Noch ${text}`}
        </div>
    );
};

export const DashboardValuations: React.FC<DashboardValuationsProps> = ({
    valuations,
    isLoading,
    onSell,
    onDelete
}) => {
    const navigate = useNavigate();
    const [selectedDetails, setSelectedDetails] = useState<ValuationWithMeta | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="h-48 bg-slate-800/50 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Meine Angebote</h2>
                    <p className="text-slate-400 text-sm">Verfolge deine Gerätebewertungen und den Verkaufsstatus.</p>
                </div>
                <button
                    onClick={() => navigate('/valuation')}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700"
                >
                    <Plus className="w-4 h-4" /> Neues Angebot
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {valuations.map(val => {
                    const statusKey = (val.status || 'active') as string;
                    const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.active;
                    const isExpiredOrEmpty = !val.expiresAt || new Date(val.expiresAt).getTime() < Date.now();
                    const isPaid = statusKey === 'paid';
                    const canSell = !isPaid && statusKey === 'active';

                    return (
                        <div
                            key={val.id}
                            className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors"></div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg relative">
                                        <BarChart3 className="w-7 h-7 text-slate-300" />
                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-slate-900">
                                            <TrendingUp className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">{val.device}</div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] uppercase font-bold text-slate-400">
                                                {val.specs?.split('|')[0]?.trim() || val.specs?.split('•')[0] || '128GB'}
                                            </span>
                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusCfg.color}`}>
                                                {statusCfg.icon} {statusCfg.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="text-[10px] text-slate-500 font-mono">{val.date}</div>
                                    {val.quoteReference && (
                                        <div className="text-[9px] text-slate-600 font-mono">{val.quoteReference}</div>
                                    )}
                                </div>
                            </div>

                            {/* Countdown */}
                            {!isPaid && (
                                <div className="mb-3">
                                    <CountdownBadge expiresAt={val.expiresAt} />
                                </div>
                            )}

                            <div className="border-t border-slate-800/50 pt-4 flex items-end justify-between">
                                <div>
                                    <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1">Auszahlungsbetrag</div>
                                    <div className="text-3xl font-black text-white tracking-tight">€{val.estimatedValue}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedDetails(val)}
                                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                        title="Details"
                                    >
                                        <Shield className="w-5 h-5" />
                                    </button>
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(val.id!)}
                                            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                            title="Löschen"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    {canSell && (
                                        <button
                                            onClick={() => onSell(val.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            Jetzt verkaufen <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isExpiredOrEmpty && statusKey === 'active' && (
                                        <button
                                            onClick={() => navigate('/valuation')}
                                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                        >
                                            Erneuern <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isPaid && (
                                        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <CheckCircle2 className="w-4 h-4" /> Abgeschlossen
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {valuations.length === 0 && (
                    <div className="col-span-1 md:col-span-2 text-center py-16 bg-slate-900/30 border border-slate-800 rounded-3xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-slate-800 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-slate-900/50">
                                <BarChart3 className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Noch keine Angebote</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">
                                Hol dir jetzt eine kostenlose und unverbindliche Bewertung für dein Gerät und finde heraus, wie viel es noch wert ist.
                            </p>
                            <button
                                onClick={() => navigate('/valuation')}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-blue-900/20 hover:scale-105"
                            >
                                <Plus className="w-5 h-5" /> Jetzt Gerät bewerten
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-400" />
                                Angebotsdetails
                            </h3>
                            <button
                                onClick={() => setSelectedDetails(null)}
                                title="Schließen"
                                aria-label="Schließen"
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Gerät</div>
                                <div className="text-lg font-bold text-white mb-1">{selectedDetails.device}</div>
                                <div className="text-sm text-slate-400">{selectedDetails.specs} • {selectedDetails.condition}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800">
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Displayzustand</div>
                                    <div className="text-sm font-medium text-slate-300">{selectedDetails.screenCondition || '-'}</div>
                                </div>
                                <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800">
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Gehäusezustand</div>
                                    <div className="text-sm font-medium text-slate-300">{selectedDetails.bodyCondition || '-'}</div>
                                </div>
                            </div>

                            <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Funktionalität</div>
                                    <div className="text-sm font-medium text-slate-300">
                                        {selectedDetails.isFunctional !== false ? 'Voll funktionsfähig' : 'Defekt'}
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${selectedDetails.isFunctional !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex justify-between items-center">
                            <div>
                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Auszahlungsbetrag</div>
                                <div className="text-2xl font-black text-white">€{selectedDetails.estimatedValue}</div>
                            </div>
                            <button
                                onClick={() => {
                                    onSell(selectedDetails.id!);
                                    setSelectedDetails(null);
                                }}
                                disabled={selectedDetails.status === 'paid' || (selectedDetails.status !== 'active')}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                            >
                                Auswählen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
