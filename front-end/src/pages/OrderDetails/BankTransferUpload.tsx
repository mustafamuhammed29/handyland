import React, { useState, useEffect } from 'react';
import { AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { Order } from '../../types';

interface BankTransferUploadProps {
    order: Order;
    orderId: string;
    onUploadSuccess: (url: string) => void;
}

export const BankTransferUpload: React.FC<BankTransferUploadProps> = ({ order, orderId, onUploadSuccess }) => {
    const { addToast } = useToast();
    const { t } = useTranslation();
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    useEffect(() => {
        if (order?.paymentMethod === 'bank_transfer') {
            const fetchSettings = async () => {
                try {
                    const res = await api.get('/api/settings');
                    const data = (res as any)?.data || res;
                    if (data && data?.payment?.bankTransfer) {
                        setPaymentConfig(data.payment.bankTransfer);
                    }
                } catch (e) {
                    console.error("Error fetching settings", e);
                }
            };
            fetchSettings();
        }
    }, [order?.paymentMethod]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !order) return;
        const file = e.target.files[0];
        
        if (file.size > 5 * 1024 * 1024) {
            addToast('File size must be less than 5MB', 'error');
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('receipt', file);
        try {
            setUploading(true);
            const res = await api.post(`/api/orders/${order._id || orderId}/receipt`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            } as any) as any;
            
            const data = res?.data || res;
            
            if (data?.success) {
                setReceiptUrl(data.receiptUrl);
                addToast(t('orders.receiptUploaded'), 'success');
                onUploadSuccess(data.receiptUrl);
            } else {
                addToast(data?.message || t('orders.uploadError'), 'error');
            }
        } catch (err: any) {
            addToast(err?.response?.data?.message || t('orders.uploadError'), 'error');
        } finally {
            setUploading(false);
        }
    };

    const isCancelled = order.status === 'cancelled';

    if (order.paymentMethod !== 'bank_transfer' || order.paymentStatus === 'paid' || isCancelled) {
        return null;
    }

    return (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2 relative z-10">
                <AlertTriangle className="w-5 h-5" /> Action Required: Bank Transfer
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 relative z-10">
                {paymentConfig?.instructions || "Please transfer the total amount to the following bank account. Include the Order Number as the reference (Verwendungszweck)."}
            </p>

            <div className="bg-slate-900 rounded-xl p-4 space-y-2 mb-6 text-sm relative z-10 border border-slate-800">
                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                    <span className="text-slate-500 dark:text-slate-400">Bank:</span>
                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.bankName || import.meta.env.VITE_BANK_NAME || "Pending Configuration"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                    <span className="text-slate-500 dark:text-slate-400">Account Holder:</span>
                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.accountHolder || import.meta.env.VITE_BANK_HOLDER || "Your Company"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                    <span className="text-slate-500 dark:text-slate-400">IBAN:</span>
                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.iban || import.meta.env.VITE_BANK_IBAN || "DE00 0000 0000 0000 0000 00"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                    <span className="text-slate-500 dark:text-slate-400">BIC:</span>
                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.bic || import.meta.env.VITE_BANK_BIC || "XXXXXXXX"}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-500/20 p-2 rounded border border-blue-500/30 mt-4">
                    <span className="text-blue-300 font-bold">Reference:</span>
                    <span className="text-slate-900 dark:text-white font-bold font-mono text-lg select-all">#{(order.orderNumber || order._id?.slice(-6).toUpperCase() || '')}</span>
                </div>
            </div>

            <div className="border-t border-blue-500/20 pt-4 relative z-10">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Upload Payment Receipt</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Upload a screenshot or photo of your transfer receipt to speed up processing.</p>

                {(receiptUrl || (order as any).paymentReceipt) ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <CheckCircle className="w-5 h-5 shadow-emerald-500/50 drop-shadow-lg" />
                        Receipt Uploaded Successfully
                    </div>
                ) : (
                    <label className="flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 p-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 group">
                        {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-blue-200 group-hover:-translate-y-1 transition-transform" />}
                        <span className="text-slate-900 dark:text-white font-bold group-hover:text-slate-900 dark:text-white transition-colors">{uploading ? 'Uploading...' : 'Upload Receipt Image'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                )}
            </div>
        </div>
    );
};
