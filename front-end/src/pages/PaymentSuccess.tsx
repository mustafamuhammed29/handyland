import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Download, Package, Home, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '../hooks/useDashboardData';
import { api } from '../utils/api';
import { orderService } from '../services/orderService';

interface OrderSummary {
    id: string;
    _id?: string;
    totalAmount: number;
    items: any[];
}

const PaymentSuccess: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar' || i18n.language === 'fa';
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(t('paymentSuccess.verifyingMessage', 'Bitte warten Sie einen Moment.'));
    const [order, setOrder] = useState<OrderSummary | null>(null);

    const method = searchParams.get('method');
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId && !orderId) {
            setStatus('error');
            setMessage(t('paymentSuccess.invalidSessionMessage', 'Die Bestellinformationen konnten nicht geladen werden.'));
            return;
        }

        const verifyOrder = async () => {
            try {
                let data;

                if (sessionId) {
                    // Stripe Verification using API helper with rawResponse
                    const response = await api.post('/api/payment/success', { sessionId }, { rawResponse: true });
                    data = response.data;
                } else if (orderId) {
                    // COD / Direct Order / Stripe Elements Verification using api.get with rawResponse
                    try {
                        const response = await api.get(`/api/orders/${orderId}`, { rawResponse: true });
                        const resData = response.data;
                        if (resData.success) {
                            data = { success: true, order: resData.order };
                        } else {
                            data = { success: false, message: t('paymentSuccess.invalidSessionMessage', 'Die Bestellinformationen konnten nicht geladen werden.') };
                        }
                    } catch (e) {
                        // Guest COD / Direct Order Success Cache Verification
                        const storedOrderId = sessionStorage.getItem('placed_order_id') || sessionStorage.getItem('pending_stripe_order_id');
                        if (storedOrderId === orderId) {
                            const cachedOrder = sessionStorage.getItem('last_placed_order');
                            if (cachedOrder) {
                                data = { success: true, order: JSON.parse(cachedOrder) };
                            } else {
                                data = { success: true, order: { id: orderId, totalAmount: 0, items: [] } };
                            }
                        } else {
                            data = { success: false, message: t('paymentSuccess.invalidSessionMessage', 'Die Bestellinformationen konnten nicht geladen werden.') };
                        }
                    }
                }

                if (data && data.success) {
                    setStatus('success');
                    setOrder(data.order);
                    clearCart();
                    localStorage.removeItem('checkout_shipping');

                    // Invalidate React Query cache so dashboard shows new order immediately
                    queryClient.invalidateQueries({ queryKey: dashboardKeys.orders() });
                    queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
                } else {
                    setStatus('error');
                    setMessage(data?.message || t('paymentSuccess.errorMessage', 'Ein Fehler ist aufgetreten.'));
                }
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') console.error('Order verification error:', error);
                setStatus('error');
                setMessage(t('paymentSuccess.errorMessage', 'Ein Fehler ist aufgetreten.'));
            }
        };

        verifyOrder();

        // Fetch Bank Transfer settings if method is bank_transfer
        if (method === 'bank_transfer') {
            const fetchSettings = async () => {
                try {
                    const response: any = await api.get('/api/settings');
                    const settings = response?.settings || response?.data || response;
                    if (settings && settings.payment && settings.payment.bankTransfer) {
                        setPaymentConfig(settings.payment.bankTransfer);
                    }
                } catch (e) {
                    console.error("Error fetching settings", e);
                }
            };
            fetchSettings();
        }
    }, [sessionId, orderId, method, clearCart, queryClient, t]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('receipt', file);
        try {
            setUploading(true);
            const response: any = await api.post(`/api/orders/${orderId}/receipt`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response && response.success) {
                setReceiptUrl(response.receiptUrl);
                addToast(t('paymentSuccess.receiptUploaded', 'Rechnung erfolgreich hochgeladen! Wir bearbeiten Ihre Bestellung in Kürze.'), 'success');
            } else {
                addToast(response?.message || t('paymentSuccess.receiptUploadError', 'Fehler beim Hochladen der Rechnung.'), 'error');
            }
        } catch (err) {
            addToast(t('paymentSuccess.receiptUploadError', 'Fehler beim Hochladen der Rechnung.'), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        const id = order._id || order.id;
        if (!id) return addToast(t('paymentSuccess.invoiceNotFound', 'Bestellungs-ID nicht gefunden'), 'error');
        try {
            await orderService.downloadInvoice(id);
        } catch {
            alert(t('paymentSuccess.invoiceError', 'Rechnung konnte nicht geladen werden.'));
        }
    };

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-2xl relative z-10">

                {/* Loading State */}
                {status === 'loading' && (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center shadow-2xl">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {t('paymentSuccess.verifyingTitle', 'Bestelldetails werden überprüft...')}
                        </h2>
                        <p className="text-slate-400 text-lg">
                            {t('paymentSuccess.verifyingMessage', 'Bitte warten Sie einen Moment.')}
                        </p>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <div className="animate-in zoom-in duration-500 space-y-6">
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/30">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                {t('paymentSuccess.successTitle', 'Zahlung erfolgreich!')}
                            </h1>
                            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                                {t('paymentSuccess.successMessage', 'Ihre Bestellung wurde bestätigt.')}
                            </p>

                            {order && (
                                <div className="bg-slate-950/50 rounded-xl p-4 mb-4 border border-slate-800 inline-block text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                                        {t('paymentSuccess.orderNumber', 'Bestellnummer')}
                                    </div>
                                    <div className="text-white font-mono text-2xl font-black tracking-wide select-all">#{(order._id || order.id || "").slice(-8).toUpperCase()}</div>
                                </div>
                            )}

                            {method === 'bank_transfer' && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8 text-left rtl:text-right max-w-lg mx-auto">
                                    <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                        {t('paymentSuccess.bankTransferTitle', 'Hinweise zur Banküberweisung')}
                                    </h3>
                                    <p className="text-slate-300 text-sm mb-4">
                                        {paymentConfig?.instructions || t('paymentSuccess.bankTransferInstructions', 'Bitte überweisen Sie den Gesamtbetrag auf das folgende Bankkonto. Geben Sie die Bestellnummer als Verwendungszweck an.')}
                                    </p>

                                    <div className="bg-slate-900 rounded-lg p-4 space-y-2 mb-6">
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">{t('paymentSuccess.bank', 'Bank:')}</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.bankName || "Pending Configuration"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">{t('paymentSuccess.accountHolder', 'Kontoinhaber:')}</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.accountHolder || "Your Company"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">{t('paymentSuccess.iban', 'IBAN:')}</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.iban || "DE00 0000 0000 0000 0000 00"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">{t('paymentSuccess.bic', 'BIC:')}</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.bic || "XXXXXXXX"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-blue-500/20 p-2 rounded border border-blue-500/30 mt-4">
                                            <span className="text-blue-300 text-sm font-bold">{t('paymentSuccess.reference', 'Verwendungszweck:')}</span>
                                            <span className="text-white font-bold font-mono text-lg select-all">#{(order?._id || order?.id || "").slice(-8).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700/50 pt-4">
                                        <h4 className="font-bold text-white mb-2 text-sm">
                                            {t('paymentSuccess.uploadReceiptTitle', 'Zahlungsbeleg hochladen')}
                                        </h4>
                                        <p className="text-xs text-slate-400 mb-4">
                                            {t('paymentSuccess.uploadReceiptDesc', 'Um die Bearbeitung zu beschleunigen, können Sie hier einen Screenshot oder ein Foto Ihrer Überweisung hochladen.')}
                                        </p>

                                        {receiptUrl ? (
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 p-3 rounded-lg">
                                                <CheckCircle className="w-5 h-5" />
                                                {t('paymentSuccess.receiptUploadedBadge', 'Beleg erfolgreich hochgeladen')}
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-dashed border-slate-600 transition-colors">
                                                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-slate-400" />}
                                                <span className="text-white text-sm font-medium">
                                                    {uploading ? t('paymentSuccess.uploading', 'Wird hochgeladen...') : t('paymentSuccess.uploadReceipt', 'Rechnung hochladen')}
                                                </span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Package className="w-5 h-5 group-hover:scale-110 transition-transform" /> {t('paymentSuccess.trackOrder', 'Bestellung verfolgen')}
                                </button>
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" /> {t('paymentSuccess.invoice', 'Rechnung herunterladen')}
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                                <Home className="w-4 h-4" /> {t('paymentSuccess.returnHome', 'Zurück zur Startseite')}
                            </Link>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-12 text-center shadow-2xl animate-in shake">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            {t('paymentSuccess.errorTitle', 'Fehler')}
                        </h2>
                        <p className="text-red-400 mb-8 bg-red-950/30 p-4 rounded-xl border border-red-900/50">
                            {message}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/contact')}
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                            >
                                {t('paymentSuccess.contactSupport', 'Support kontaktieren')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
