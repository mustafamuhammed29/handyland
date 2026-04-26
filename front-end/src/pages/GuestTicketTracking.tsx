import React, { useState } from 'react';
import { api } from '../utils/api';
import { Search, Loader2, Wrench, CheckCircle, Clock } from 'lucide-react';
import { SEO } from '../components/SEO';
import { VisualOrderTimeline } from '../components/VisualOrderTimeline';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const GuestTicketTracking: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const [ticketId, setTicketId] = useState(location.state?.ticketId || '');
    const [email, setEmail] = useState(location.state?.email || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ticket, setTicket] = useState<any | null>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    const handleTrack = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setTicket(null);

        try {
            const res = await api.post('/api/repairs/track-guest', { ticketId: ticketId.trim(), email: email.trim() }) as any;
            if (res.success && res.ticket) {
                setTicket(res.ticket);
            } else {
                setError('Failed to retrieve ticket information.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ticket not found or email doesn\'t match.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (location.state?.ticketId && location.state?.email && !initialLoadDone) {
            handleTrack();
            setInitialLoadDone(true);
        }
    }, [location.state, initialLoadDone]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending': return { text: 'Pending', icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-500/20' };
            case 'in_progress': return { text: 'In Progress', icon: <Wrench className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/20' };
            case 'completed': return { text: 'Completed', icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-500/20' };
            case 'cancelled': return { text: 'Cancelled', icon: <div className="w-3 h-3 rounded-full bg-red-500" />, bg: 'bg-red-500/20' };
            default: return { text: status, icon: <div className="w-3 h-3 rounded-full bg-slate-500" />, bg: 'bg-slate-500/20' };
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-950 pt-32 pb-12 px-4 flex flex-col items-center">
            <SEO
                title="Track Repair Ticket"
                description="Track the status of your device repair with HandyLand."
            />

            <div className="max-w-md w-full text-center mb-8">
                <Wrench className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">{t('trackRepair.title', 'Reparatur verfolgen')}</h1>
                <p className="text-slate-400">{t('trackRepair.subtitle', 'Gib deine Ticket-ID und E-Mail ein, um den Status deiner Reparatur zu prüfen.')}</p>
            </div>

            <div className="w-full max-w-md">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl mb-8">
                    <form onSubmit={handleTrack} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">{t('trackRepair.ticketId', 'Ticket-ID')}</label>
                            <input
                                type="text"
                                required
                                value={ticketId}
                                onChange={e => setTicketId(e.target.value)}
                                placeholder={t('trackRepair.ticketPlaceholder', 'z.B. 5f8d04f2b5...')}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">{t('trackRepair.emailAddress', 'E-Mail-Adresse')}</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={t('trackRepair.emailPlaceholder', 'E-Mail, die für die Reparatur verwendet wurde')}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !ticketId || !email}
                            className="w-full py-4 bg-brand-primary hover:bg-brand-primary text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> {t('trackRepair.trackButton', 'Ticket verfolgen')}</>}
                        </button>
                    </form>
                </div>

                {ticket && (
                    <div className="bg-slate-900 border border-brand-primary/30 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-3xl rounded-full"></div>

                        <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{ticket.device}</h3>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusConfig(ticket.status).bg}`}>
                                    {getStatusConfig(ticket.status).icon}
                                    <span className="font-bold text-sm text-white capitalize">{getStatusConfig(ticket.status).text}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-sm font-mono mt-1">Ticket #{ticket._id.substring(0, 8)}</p>
                            </div>
                        </div>

                        {/* Integration of Visual Timeline for Guests */}
                        <div className="mb-8">
                            <VisualOrderTimeline
                                currentStatus={ticket.status}
                                type="repair"
                                history={ticket.history || [{ status: ticket.status, date: ticket.updatedAt || new Date().toISOString() }]}
                            />
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('trackRepair.issueDescription', 'Problembeschreibung')}</label>
                                <p className="text-slate-300 mt-1">{ticket.issue}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('trackRepair.dateCreated', 'Erstellt am')}</label>
                                    <p className="text-slate-300 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                </div>
                                {ticket.estimatedCost && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('trackRepair.estCost', 'Gesch. Kosten')}</label>
                                        <p className="text-brand-primary font-bold mt-1 text-lg">€{ticket.estimatedCost}</p>
                                    </div>
                                )}
                            </div>

                            {ticket.notes && (
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('trackRepair.latestNotes', 'Neueste Notizen')}</label>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{ticket.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuestTicketTracking;
