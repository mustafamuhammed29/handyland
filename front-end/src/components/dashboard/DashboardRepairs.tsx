import React, { useState, useEffect } from 'react';
import { Wrench, MessageSquare, ChevronRight, Send, Loader2 } from 'lucide-react';
import { RepairTicket } from '../../types';
import { api } from '../../utils/api';
import { useTranslation } from 'react-i18next';

interface DashboardRepairsProps {
    repairs: RepairTicket[];
    isLoading: boolean;
}

export const DashboardRepairs: React.FC<DashboardRepairsProps> = ({
    repairs,
    isLoading
}) => {
    const { t } = useTranslation();
    const [expandedRepairId, setExpandedRepairId] = useState<string | null>(null);
    const [localRepairs, setLocalRepairs] = useState<RepairTicket[]>([]);
    const [newNoteText, setNewNoteText] = useState('');
    const [isSubmittingNote, setIsSubmittingNote] = useState<string | null>(null);

    useEffect(() => {
        setLocalRepairs(repairs || []);
    }, [repairs]);

    const handleAddNote = async (ticketId: string) => {
        if (!newNoteText.trim()) return;
        setIsSubmittingNote(ticketId);
        try {
            const res: any = await api.put(`/api/repairs/tickets/${ticketId}/notes`, { notes: newNoteText });
            if (res?.success) {
                setLocalRepairs(prev => prev.map(t => 
                    t.id === ticketId || t._id === ticketId ? { 
                        ...t, 
                        notes: res.ticket.notes,
                        messages: res.ticket.messages 
                    } : t
                ));
                setNewNoteText('');
            }
        } catch (err) {
            console.error('Failed to add note', err);
            alert(t('repairs.chat.error.send', 'Failed to add message. Please try again.'));
        } finally {
            setIsSubmittingNote(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'repairing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'diagnosing': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            case 'testing': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/30';
            case 'received': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'attention': return 'bg-red-500/10 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        }
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'received': return 1;
            case 'diagnosing': return 2;
            case 'repairing': return 3;
            case 'testing': return 4;
            case 'ready': return 5;
            case 'attention': return 2; // Show as early stage needing attention
            default: return 1;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map(i => (
                    <div key={i} className="h-32 bg-slate-900/50 border border-slate-800 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">{t('repairs.title', 'Active Repairs')}</h2>

            <div className="space-y-4">
                {localRepairs.map((ticket) => (
                    <div
                        key={ticket.id || ticket._id}
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center relative">
                                        <Wrench className="w-6 h-6 text-brand-primary" />
                                        {ticket.status === 'attention' && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                            {ticket.device}
                                            <span className="text-xs font-normal text-slate-500 font-mono">#{ticket.ticketId || ticket._id}</span>
                                        </h3>
                                        <p className="text-sm text-slate-400">{ticket.issue}</p>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                    {t(`repairs.status.${ticket.status}`, ticket.status)}
                                </span>
                            </div>

                            {/* Timeline */}
                            <div className="relative px-2 mb-8">
                                <div className="h-1 bg-slate-800 w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0 rounded-full"></div>
                                <div
                                    className="h-1 bg-brand-primary shadow-[0_0_10px_#06b6d4] absolute top-1/2 -translate-y-1/2 left-0 z-0 transition-all duration-1000 rounded-full"
                                    style={{ width: `${(getStatusStep(ticket.status) / 5) * 100}%` }}
                                ></div>

                                <div className="relative z-10 flex justify-between">
                                    {[
                                        { key: 'received', label: t('repairs.timeline.received', 'Received') },
                                        { key: 'diagnosing', label: t('repairs.timeline.diag', 'Diag') },
                                        { key: 'repairing', label: t('repairs.timeline.repair', 'Repair') },
                                        { key: 'testing', label: t('repairs.timeline.test', 'Test') },
                                        { key: 'ready', label: t('repairs.timeline.ready', 'Ready') }
                                    ].map((step, idx) => {
                                        const currentStep = idx + 1;
                                        const active = currentStep <= getStatusStep(ticket.status);
                                        return (
                                            <div key={step.key} className="flex flex-col items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full border-2 transition-colors ${active
                                                    ? 'bg-brand-primary border-brand-primary shadow-[0_0_10px_#06b6d4]'
                                                    : 'bg-slate-900 border-slate-700'
                                                    }`}></div>
                                                <span className={`text-[10px] font-bold uppercase ${active ? 'text-brand-primary' : 'text-slate-600'
                                                    }`}>{step.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    {ticket.estimatedCompletion ? (
                                        <div className="text-xs text-slate-500">
                                            {t('repairs.item.estCompletion', 'Est. Completion')}:{' '}
                                            <span className="text-white font-bold">
                                                {new Date(ticket.estimatedCompletion).toLocaleDateString(t('common.locale', 'en-US'), {
                                                    weekday: 'short', day: '2-digit', month: 'short'
                                                })}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-600">{t('repairs.item.noEstCompletion', 'Completion: TBD')}</div>
                                    )}
                                    {((ticket as any).estimatedCost !== undefined || ticket.cost !== undefined) && (
                                        <div className="text-xs text-slate-500">
                                            {t('repairs.item.cost', 'Cost')}: <span className="text-brand-primary font-bold">€{(ticket as any).estimatedCost || ticket.cost}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setExpandedRepairId(expandedRepairId === (ticket.id || ticket._id) ? null : (ticket.id || (ticket._id as string)));
                                        setNewNoteText('');
                                    }}
                                    className="text-sm text-brand-primary font-bold hover:text-brand-primary flex items-center gap-1"
                                >
                                    {expandedRepairId === (ticket.id || ticket._id) ? t('repairs.actions.hideDetails', 'Hide Details') : t('repairs.actions.viewDetails', 'View Details')}
                                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedRepairId === (ticket.id || ticket._id) ? 'rotate-90' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedRepairId === (ticket.id || ticket._id) && (
                            <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                                <div className="h-px bg-slate-800 mb-6"></div>
                                <div className="flex flex-col h-[400px]">
                                    {/* Chat Header */}
                                    <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> {t('repairs.chat.title', 'Ticket Chat')}
                                    </h4>
                                    
                                    {/* Chat Window */}
                                    <div className="flex-1 bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 flex flex-col">
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
                                            {/* Legacy Notes Handling & Messages Map */}
                                            {(!ticket.messages || ticket.messages.length === 0) && !ticket.notes && !ticket.technicianNotes ? (
                                                <div className="flex items-center justify-center h-full text-slate-600 text-sm italic">
                                                    {t('repairs.chat.empty', 'Keine Nachrichten bisher. Sende die erste Nachricht!')}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Legacy string notes if messages array is empty/undefined */}
                                                    {(!ticket.messages || ticket.messages.length === 0) && ticket.notes && (
                                                        <div className="flex justify-end">
                                                            <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-br-sm max-w-[80%]">
                                                                <p className="text-sm whitespace-pre-wrap">{ticket.notes}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(!ticket.messages || ticket.messages.length === 0) && ticket.technicianNotes && (
                                                        <div className="flex justify-start">
                                                            <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-bl-sm max-w-[80%]">
                                                                <p className="text-sm whitespace-pre-wrap">{ticket.technicianNotes}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Actual messages array rendering */}
                                                    {ticket.messages && ticket.messages.map((msg, index) => (
                                                        <div key={msg._id || index} className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                                                                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'customer' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm'}`}>
                                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                                </div>
                                                                <span className={`text-[10px] text-slate-500 font-mono ${msg.role === 'customer' ? 'text-right pr-1' : 'text-left pl-1'} `}>
                                                                    {new Date(msg.timestamp).toLocaleString(t('common.locale', 'en-US'), { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Chat Input Field */}
                                        <div className="mt-auto relative">
                                            <textarea 
                                                value={newNoteText}
                                                onChange={(e) => setNewNoteText(e.target.value)}
                                                placeholder={t('repairs.chat.placeholder', 'Schreibe eine Nachricht...')}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pr-12 text-sm text-white focus:border-blue-500 outline-none resize-none h-14 min-h-[56px] shadow-inner"
                                                disabled={isSubmittingNote === (ticket.id || ticket._id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleAddNote(ticket._id || ticket.id || '');
                                                    }
                                                }}
                                            />
                                            <button 
                                                onClick={() => handleAddNote(ticket._id || ticket.id || '')}
                                                disabled={!newNoteText.trim() || isSubmittingNote === (ticket.id || ticket._id)}
                                                className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                            >
                                                {isSubmittingNote === (ticket.id || ticket._id) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" /> }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {repairs.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
                        <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                        <p className="text-lg font-bold text-white mb-1">{t('repairs.empty.title', 'No active repairs')}</p>
                        <p className="text-sm text-slate-500 mb-6">
                            {t('repairs.empty.subtitle', 'Need a repair? Browse our service catalog and contact us to get started.')}
                        </p>
                        <a
                            href="/repair"
                            className="inline-block px-6 py-2.5 bg-brand-primary hover:bg-brand-primary text-white rounded-xl text-sm font-bold transition-colors"
                        >
                            {t('repairs.empty.cta', 'View Repair Services')} →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};
