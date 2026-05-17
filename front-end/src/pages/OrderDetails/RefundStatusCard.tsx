import React from 'react';
import { RotateCcw, AlertTriangle, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../utils/formatPrice';

interface RefundStatusCardProps {
    activeRefund: any;
    orderTotalAmount: number;
}

const REFUND_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending:      { label: 'Offen — Wird geprüft',       color: 'yellow', icon: '⏳' },
    under_review: { label: 'In Prüfung',                  color: 'blue',   icon: '🔍' },
    approved:     { label: 'Genehmigt ✅',                 color: 'emerald', icon: '✅' },
    rejected:     { label: 'Abgelehnt',                    color: 'red',    icon: '❌' },
    processed:    { label: 'Abgeschlossen & Erstattet',    color: 'slate',  icon: '💰' },
};

const REFUND_REASON_LABELS: Record<string, string> = {
    widerrufsrecht:   '§ 312g BGB — 14-Tage Widerrufsrecht',
    defective:        'Defekt / Beschädigt',
    wrong_item:       'Falscher Artikel geliefert',
    not_as_described: 'Nicht wie beschrieben',
    other:            'Sonstiges',
};

export const RefundStatusCard: React.FC<RefundStatusCardProps> = ({ activeRefund, orderTotalAmount }) => {
    const { t } = useTranslation();

    if (!activeRefund) return null;

    return (
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Glow accent */}
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] pointer-events-none ${
                activeRefund.status === 'approved' || activeRefund.status === 'processed' ? 'bg-emerald-500/15' :
                activeRefund.status === 'rejected' ? 'bg-red-500/15' :
                activeRefund.status === 'under_review' ? 'bg-blue-500/15' :
                'bg-orange-500/15'
            }`} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-orange-400" />
                    {t('orders.refundStatus', 'Rückgabe-Status')}
                </h3>
                <span className={`text-[11px] px-4 py-1.5 rounded-full border font-black uppercase tracking-widest ${
                    activeRefund.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    activeRefund.status === 'under_review' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    activeRefund.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    activeRefund.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
                }`}>
                    {REFUND_STATUS_CONFIG[activeRefund.status]?.icon} {REFUND_STATUS_CONFIG[activeRefund.status]?.label || activeRefund.status}
                </span>
            </div>

            {/* Mini Refund Timeline */}
            <div className="relative z-10 mb-6">
                <div className="flex items-center justify-between gap-1">
                    {['pending', 'under_review', 'approved', 'processed'].map((step, idx) => {
                        const stepOrder = ['pending', 'under_review', 'approved', 'processed'];
                        const currentIdx = stepOrder.indexOf(activeRefund.status);
                        const isRejected = activeRefund.status === 'rejected';
                        const isCompleted = !isRejected && idx <= currentIdx;
                        const isActive = !isRejected && idx === currentIdx;
                        const labels = ['Eingereicht', 'In Prüfung', 'Genehmigt', 'Erstattet'];

                        return (
                            <div key={step} className="flex-1 flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-500 ${
                                    isRejected && step === 'approved' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                                    isCompleted ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                    isActive ? 'bg-blue-500/20 border-blue-400 text-blue-400 animate-pulse' :
                                    'bg-slate-800 border-slate-700 text-slate-600'
                                }`}>
                                    {isCompleted && !isActive ? '✓' : idx + 1}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${
                                    isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600'
                                }`}>{labels[idx]}</span>
                                {idx < 3 && (
                                    <div className={`absolute top-4 h-0.5 transition-all duration-700 ${
                                        isCompleted && idx < currentIdx ? 'bg-emerald-500/50' : 'bg-slate-800'
                                    }`} style={{ left: `${(idx + 0.5) * 25}%`, width: '20%' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
                {activeRefund.status === 'rejected' && (
                    <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {t('orders.refundRejectedNote', 'Ihre Rückgabeanfrage wurde leider abgelehnt.')}
                    </div>
                )}
            </div>

            {/* Details Grid */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Grund</p>
                    <p className="text-slate-900 dark:text-white font-bold text-sm">{REFUND_REASON_LABELS[activeRefund.reason] || activeRefund.reason}</p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Erstattungsbetrag</p>
                    <p className="text-emerald-400 font-black text-xl tracking-tight">{formatPrice(activeRefund.refundAmount || orderTotalAmount)}</p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Eingereicht am</p>
                    <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">{new Date(activeRefund.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                {activeRefund.resolvedAt && (
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Bearbeitet am</p>
                        <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">{new Date(activeRefund.resolvedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                )}
            </div>

            {/* Admin Notes */}
            {activeRefund.adminNotes && (
                <div className="relative z-10 mt-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em]">Hinweis vom Team</p>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{activeRefund.adminNotes}</p>
                </div>
            )}

            {/* Description */}
            {activeRefund.description && (
                <div className="relative z-10 mt-4 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">Ihre Beschreibung</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic leading-relaxed">"{activeRefund.description}"</p>
                </div>
            )}
        </div>
    );
};
