import { useState, useEffect } from 'react';
import {
    RotateCcw, CheckCircle, XCircle, Eye, Loader2, ShieldCheck,
    Package, User, CreditCard, Calendar, MessageSquare,
    ChevronRight, RefreshCw, Clock, X, DollarSign, Truck
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    pending:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    under_review: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    approved:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected:     'bg-red-500/10 text-red-400 border-red-500/30',
    processed:    'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const REFUND_STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'processed'];

const STATUS_LABELS: Record<string, string> = {
    pending: 'Offen',
    under_review: 'In Prüfung',
    approved: 'Genehmigt',
    rejected: 'Abgelehnt',
    processed: 'Abgeschlossen'
};

const REASON_LABELS: Record<string, string> = {
    widerrufsrecht:   '§ 312g BGB — Widerrufsrecht',
    defective:        'Defekt / Beschädigt',
    wrong_item:       'Falscher Artikel geliefert',
    not_as_described: 'Nicht wie beschrieben',
    other:            'Sonstiges',
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Ausstehend',
    processing: 'In Bearbeitung',
    shipped: 'Versandt',
    delivered: 'Geliefert',
    cancelled: 'Storniert',
    refunded: 'Rückerstattet'
};

const ORDER_STATUS_COLORS: Record<string, string> = {
    pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    shipped:    'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    delivered:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cancelled:  'bg-red-500/10 text-red-400 border-red-500/30',
    refunded:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function RefundManager() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedRefund, setSelectedRefund] = useState<any | null>(null);

    // Review modal state
    const [adminNotes, setAdminNotes] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [processStripe, setProcessStripe] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Order status override
    const [newOrderStatus, setNewOrderStatus] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const res: any = await api.get(`/api/refunds${filterStatus ? `?status=${filterStatus}` : ''}`);
            setRefunds(res?.refunds || res?.data?.refunds || []);
        } catch {
            toast.error('Fehler beim Laden der Rückerstattungsanfragen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRefunds(); }, [filterStatus]);

    // ── Actions ───────────────────────────────────────────────────────────────
    const openReview = (r: any) => {
        setSelectedRefund(r);
        setAdminNotes(r.adminNotes || '');
        setRefundAmount((r.refundAmount || r.order?.totalAmount || '').toString());
        setProcessStripe(false);
        setNewOrderStatus(r.order?.status || '');
    };

    const handleChangeStatus = async (newStatus: string) => {
        if (!selectedRefund) return;
        setStatusLoading(true);
        try {
            // FIX: Endpoint path should be /api/orders/admin/:id/status
            await api.put(`/api/orders/admin/${selectedRefund.order?._id}/status`, { status: newStatus });
            toast.success(`Bestellstatus auf "${ORDER_STATUS_LABELS[newStatus]}" aktualisiert`);
            setSelectedRefund((prev: any) => ({
                ...prev,
                order: { ...prev.order, status: newStatus }
            }));
            setNewOrderStatus(newStatus);
            fetchRefunds();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Fehler beim Aktualisieren des Bestellstatus');
        } finally {
            setStatusLoading(false);
        }
    };

    const handleChangeRefundStatus = async (newStatus: string) => {
        if (!selectedRefund) return;
        setActionLoading(true);
        try {
            if (newStatus === 'approved') {
                await api.put(`/api/refunds/${selectedRefund._id}/approve`, {
                    refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
                    adminNotes,
                    processStripe,
                });
            } else if (newStatus === 'rejected') {
                await api.put(`/api/refunds/${selectedRefund._id}/reject`, { adminNotes });
            } else {
                await api.put(`/api/refunds/${selectedRefund._id}/status`, { status: newStatus, adminNotes });
            }
            toast.success(`Rückerstattungsstatus → ${STATUS_LABELS[newStatus]}`);
            setSelectedRefund(null);
            fetchRefunds();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Aktion fehlgeschlagen');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const counts = REFUND_STATUSES.reduce((acc, s) => {
        acc[s] = refunds.filter(r => r.status === s).length;
        return acc;
    }, {} as Record<string, number>);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <RotateCcw className="w-7 h-7 text-orange-400" /> Rückerstattungen
                    </h2>
                    <p className="text-slate-400 mt-1 text-sm">EU Widerrufsrecht · Bestellstatus-Kontrolle · Stripe Auto-Refund</p>
                </div>
                <button onClick={fetchRefunds} disabled={loading} title="Aktualisieren"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm font-bold border border-slate-700">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Aktualisieren
                </button>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {REFUND_STATUSES.map(s => (
                    <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                        className={`p-4 rounded-2xl border text-left transition-all ${filterStatus === s ? 'ring-2 ring-blue-500 ' + STATUS_COLORS[s] : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}>
                        <p className="text-2xl font-black text-white">{counts[s] || 0}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">{STATUS_LABELS[s]}</p>
                    </button>
                ))}
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex gap-2 flex-wrap items-center bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-2 mr-2">Filter:</span>
                <button onClick={() => setFilterStatus('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === '' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    Alle ({refunds.length})
                </button>
                {REFUND_STATUSES.map(s => (
                    <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {STATUS_LABELS[s]} {counts[s] > 0 ? `(${counts[s]})` : ''}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="animate-spin w-8 h-8 text-blue-400" /></div>
            ) : refunds.length === 0 ? (
                <div className="text-center py-24 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-sm text-slate-600">Keine Rückerstattungsanfragen gefunden</p>
                    <p className="text-xs mt-2 italic">Filter: {STATUS_LABELS[filterStatus] || 'Alle'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {refunds.map(r => (
                        <div key={r._id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-xl hover:shadow-blue-900/5">
                            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">

                                {/* Left: Info */}
                                <div className="flex-1 space-y-4 w-full">
                                    {/* Badges */}
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ${STATUS_COLORS[r.status] || ''}`}>
                                            {STATUS_LABELS[r.status]}
                                        </span>
                                        <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ${ORDER_STATUS_COLORS[r.order?.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            Bestellung: {ORDER_STATUS_LABELS[r.order?.status] || 'UNBEKANNT'}
                                        </span>
                                        {r.withinWithdrawalPeriod && (
                                            <span className="text-[10px] px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <ShieldCheck className="w-3 h-3" /> Innerhalb 14 Tage
                                            </span>
                                        )}
                                        {r.stripeRefundId && (
                                            <span className="text-[10px] px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-black uppercase tracking-widest">
                                                Stripe Erstattet
                                            </span>
                                        )}
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                            <Package className="w-4 h-4 text-blue-400 shrink-0" />
                                            <span className="truncate font-mono">#{r.order?.orderNumber || r.order?._id?.slice(-8)?.toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                            <User className="w-4 h-4 text-blue-400 shrink-0" />
                                            <span className="truncate font-bold">{r.user?.firstName} {r.user?.lastName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                            <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                                            <span className="uppercase">{r.order?.paymentMethod || 'K.A.'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                                            <span>{new Date(r.createdAt).toLocaleDateString('de-DE')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{REASON_LABELS[r.reason] || r.reason}</p>
                                        {r.description && (
                                            <p className="text-sm text-slate-400 leading-relaxed bg-slate-950/30 rounded-xl p-3 border border-slate-800/50 italic line-clamp-2">"{r.description}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Amount + Action */}
                                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                                    <div className="text-left lg:text-right">
                                        <p className="text-emerald-400 font-black text-2xl tracking-tighter">€{(r.refundAmount || r.order?.totalAmount || 0).toFixed(2)}</p>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Rückerstattungsbetrag</p>
                                    </div>
                                    <button
                                        onClick={() => openReview(r)}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 group">
                                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" /> Prüfen
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────────── */}
            {/* ── Review Modal ── */}
            {/* ─────────────────────────────────────────────────────────────────────── */}
            {selectedRefund && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl max-h-[94dvh] flex flex-col overflow-hidden">

                        {/* Modal Header */}
                        <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 py-5">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <RotateCcw className="w-6 h-6 text-orange-400" /> Prüfung der Rückerstattung
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-widest ${STATUS_COLORS[selectedRefund.status] || ''}`}>
                                        Status: {STATUS_LABELS[selectedRefund.status]}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRefund(null)} title="Schließen" aria-label="Schließen" className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                                <X className="w-6 h-6 text-slate-500 hover:text-white" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto flex-1">

                            {/* ── Info Grid ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Kunde</p>
                                    <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Name</span><span className="text-white font-bold">{selectedRefund.user?.firstName} {selectedRefund.user?.lastName}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">E-Mail</span><span className="text-blue-400 font-mono text-xs">{selectedRefund.user?.email}</span></div>
                                </div>
                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Bestellung</p>
                                    <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Nummer</span><span className="text-white font-mono font-bold">#{selectedRefund.order?.orderNumber}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Gesamt</span><span className="text-emerald-400 font-black">€{(selectedRefund.order?.totalAmount || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Zahlung</span><span className="text-white font-bold uppercase text-xs tracking-wider">{selectedRefund.order?.paymentMethod}</span></div>
                                </div>
                            </div>

                            {/* ── Refund Details ── */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                    <div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Grund</p>
                                        <p className="text-white font-bold text-lg mt-1">{REASON_LABELS[selectedRefund.reason] || selectedRefund.reason}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Eingereicht am</p>
                                        <p className="text-slate-300 font-bold mt-1">{new Date(selectedRefund.createdAt).toLocaleDateString('de-DE')} {new Date(selectedRefund.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-slate-400 font-bold text-sm">14-Tage Widerrufsrecht?</span>
                                    {selectedRefund.withinWithdrawalPeriod ? (
                                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">Ja — Gesetzlicher Anspruch</span>
                                    ) : (
                                        <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30">Nein — Kulanzentscheidung</span>
                                    )}
                                </div>

                                {selectedRefund.description && (
                                    <div className="pt-4 border-t border-slate-800">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">Beschreibung des Kunden:</p>
                                        <p className="text-slate-300 text-sm leading-relaxed bg-slate-900 p-4 rounded-xl italic">"{selectedRefund.description}"</p>
                                    </div>
                                )}
                            </div>

                            {/* ── ORDER STATUS CONTROL ── */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-blue-500" /> Bestellstatus Ändern
                                    </p>
                                    <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ${ORDER_STATUS_COLORS[selectedRefund.order?.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        Aktuell: {ORDER_STATUS_LABELS[selectedRefund.order?.status] || 'K.A.'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {ORDER_STATUSES.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleChangeStatus(s)}
                                            disabled={statusLoading || selectedRefund.order?.status === s}
                                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                                                ${selectedRefund.order?.status === s
                                                    ? 'ring-2 ring-blue-500 ' + ORDER_STATUS_COLORS[s]
                                                    : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-40 border border-slate-800'
                                                }`}
                                        >
                                            {statusLoading && newOrderStatus === s
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : selectedRefund.order?.status === s
                                                    ? <CheckCircle className="w-3 h-3" />
                                                    : <Clock className="w-3 h-3" />
                                            }
                                            {ORDER_STATUS_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Form Inputs ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <DollarSign className="w-3 h-3 text-emerald-500" /> Erstattungsbetrag (€)
                                    </label>
                                    <input type="number" step="0.01" min="0" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                                        title="Rückerstattungsbetrag in Euro" placeholder="0.00"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-emerald-500 outline-none font-mono text-xl shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <MessageSquare className="w-3 h-3 text-blue-500" /> Admin-Notizen (E-Mail an Kunden)
                                    </label>
                                    <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                                        placeholder="Grund der Entscheidung..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none resize-none text-sm shadow-inner" />
                                </div>
                            </div>

                            {/* ── Stripe Toggle ── */}
                            {(selectedRefund.order?.paymentMethod === 'card' || selectedRefund.order?.paymentMethod === 'stripe') && (
                                <label className="flex items-center gap-4 cursor-pointer bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 hover:bg-indigo-500/20 transition-colors group">
                                    <input type="checkbox" title="Stripe Auto-Refund" aria-label="Auto-refund via Stripe" checked={processStripe} onChange={e => setProcessStripe(e.target.checked)} className="w-5 h-5 accent-indigo-500 cursor-pointer" />
                                    <div>
                                        <span className="text-white font-black text-sm uppercase tracking-tight">Automatische Rückerstattung über Stripe</span>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Die Stripe-API wird sofort mit dem oben genannten Betrag aufgerufen</p>
                                    </div>
                                </label>
                            )}

                            {/* ── Quick Action Buttons ── */}
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-800">
                                <button onClick={() => handleChangeRefundStatus('rejected')} disabled={actionLoading || selectedRefund.status === 'rejected'}
                                    className="flex-1 min-w-[150px] py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all">
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Ablehnen
                                </button>
                                <button onClick={() => handleChangeRefundStatus('under_review')} disabled={actionLoading || selectedRefund.status === 'under_review'}
                                    className="flex-1 min-w-[150px] py-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all">
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} In Prüfung
                                </button>
                                <button onClick={() => handleChangeRefundStatus('approved')} disabled={actionLoading || selectedRefund.status === 'approved'}
                                    className="flex-[1.5] min-w-[200px] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-lg shadow-emerald-900/40 active:scale-[0.98]">
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Genehmigen & Erstatten
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
