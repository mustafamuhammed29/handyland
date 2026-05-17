import React, { useState } from 'react';
import { RotateCcw, X, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

interface RefundModalProps {
    orderId: string;
    totalAmount: number;
    onClose: () => void;
    onSuccess: (newRefund: any) => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ orderId, totalAmount, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [refundReason, setRefundReason] = useState('widerrufsrecht');
    const [refundDescription, setRefundDescription] = useState('');
    const [refundConfirmed, setRefundConfirmed] = useState(false);
    const [submittingRefund, setSubmittingRefund] = useState(false);

    const handleSubmitRefund = async () => {
        if (!refundConfirmed) return;
        setSubmittingRefund(true);
        try {
            const res: any = await api.post('/api/refunds', {
                orderId: orderId,
                reason: refundReason,
                description: refundDescription,
                customerConfirmedReturn: refundConfirmed,
            });
            const newRefund = res?.refund || res?.data?.refund;
            addToast('Rückgabeanfrage erfolgreich eingereicht!', 'success');
            onSuccess(newRefund);
        } catch (err: any) {
            addToast(err.response?.data?.message || 'Fehler beim Einreichen der Rückgabeanfrage.', 'error');
        } finally {
            setSubmittingRefund(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90dvh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-orange-400" /> Refund / Rückgabe
                    </h3>
                    <button onClick={onClose} title="Close refund modal" aria-label="Close refund modal" className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300 flex gap-3">
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-1">Widerrufsrecht (§ 312g BGB)</span>
                        Sie haben das Recht, innerhalb von <strong>14 Tagen</strong> ohne Angabe von Gründen zu widerrufen.
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Grund / Reason *</label>
                    <select value={refundReason} onChange={e => setRefundReason(e.target.value)}
                        title="Refund reason" aria-label="Refund reason"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-orange-500 outline-none">
                        <option value="widerrufsrecht">Widerrufsrecht — 14-Day Withdrawal (EU Law)</option>
                        <option value="defective">Defective / Damaged (Mangelhaft)</option>
                        <option value="wrong_item">Wrong Item Received (Falsche Lieferung)</option>
                        <option value="not_as_described">Not as Described</option>
                        <option value="other">Other / Sonstiges</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Details (optional)</label>
                    <textarea value={refundDescription} onChange={e => setRefundDescription(e.target.value)}
                        placeholder="Please describe the issue..." rows={3} maxLength={1000}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-orange-500 outline-none resize-none text-sm" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Refund Amount</span>
                    <span className="text-emerald-400 font-bold">{formatPrice(totalAmount)}</span>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={refundConfirmed} onChange={e => setRefundConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-orange-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                        I confirm I will return the product(s). <span className="text-orange-400">(Ich bestätige die Rücksendung.)</span>
                    </span>
                </label>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSubmitRefund} disabled={!refundConfirmed || submittingRefund}
                        className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-slate-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2">
                        {submittingRefund ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><RotateCcw className="w-4 h-4" /> Submit</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
