import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneForwarded, Plus, Search, Trash2, Smartphone, FileText, CheckCircle, Clock, Copy, Phone, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

interface Loaner {
    _id: string;
    brand: string;
    model: string;
    imei: string;
    status: 'Available' | 'Lent' | 'Maintenance';
    currentCustomer: { name: string; phone: string; email: string };
    lentDate: string;
    dueDate: string;
    notes: string;
    createdAt: string;
}

interface Stats {
    Total: number;
    Available: number;
    Lent: number;
    Maintenance: number;
}

const LoanerManager = () => {
    const [loaners, setLoaners] = useState<Loaner[]>([]);
    const [stats, setStats] = useState<Stats>({ Total: 0, Available: 0, Lent: 0, Maintenance: 0 });
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 12;

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLendModalOpen, setIsLendModalOpen] = useState<{ open: boolean, loaner: Loaner | null }>({ open: false, loaner: null });

    // Forms
    const [formData, setFormData] = useState({ brand: '', model: '', imei: '', status: 'Available', notes: '' });
    const [lendFormData, setLendFormData] = useState({ customerName: '', customerPhone: '', customerEmail: '', dueDate: '', notes: '' });
    
    const fetchStats = async () => {
        try {
            const { data } = await api.get('/api/loaners/stats');
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchLoaners = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: debouncedSearch,
                status: filterStatus !== 'All' ? filterStatus : ''
            });
            const { data } = await api.get(`/api/loaners?${queryParams.toString()}`);
            if (data.success) {
                setLoaners(data.loaners);
                setTotalPages(data.totalPages || 1);
            } else if (Array.isArray(data)) { // Fallback for old API format
                setLoaners(data);
            }
        } catch (error) {
            console.error('Failed to fetch loaners:', error);
            toast.error('Fehler beim Laden der Leihgeräte');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterStatus]);

    useEffect(() => {
        fetchLoaners();
    }, [page, debouncedSearch, filterStatus]);

    const handleAddLoaner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/loaners', formData);
            fetchLoaners();
            fetchStats();
            setIsAddModalOpen(false);
            setFormData({ brand: '', model: '', imei: '', status: 'Available', notes: '' });
            toast.success('Neues Leihgerät hinzugefügt!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error adding loaner');
        }
    };

    const handleLendPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLendModalOpen.loaner) return;
        try {
            await api.post(`/api/loaners/${isLendModalOpen.loaner._id}/lend`, lendFormData);
            fetchLoaners();
            fetchStats();
            setIsLendModalOpen({ open: false, loaner: null });
            setLendFormData({ customerName: '', customerPhone: '', customerEmail: '', dueDate: '', notes: '' });
            toast.success('Gerät wurde erfolgreich verliehen!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Fehler beim Verleihen');
        }
    };

    const handleReturnPhone = async (id: string, isMaintenance = false) => {
        if (!window.confirm(`Ist das Gerät wirklich ${isMaintenance ? 'in die Wartung gegangen' : 'zurückgegeben worden'}?`)) return;
        try {
            await api.post(`/api/loaners/${id}/return`, { status: isMaintenance ? 'Maintenance' : 'Available' });
            fetchLoaners();
            fetchStats();
            toast.success('Gerät wurde zurückgenommen.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Fehler bei der Rückgabe');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Leihtelefon wirklich löschen? Dieser Schritt kann nicht rückgängig gemacht werden.')) return;
        try {
            await api.delete(`/api/loaners/${id}`);
            fetchLoaners();
            fetchStats();
            toast.success('Gerät gelöscht.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Fehler beim Löschen');
        }
    };

    const handleCopyIMEI = (imei: string) => {
        navigator.clipboard.writeText(imei);
        toast.success(`IMEI kopiert: ${imei}`);
    };

    const StatusBadge = ({ status, isOverdue }: { status: string, isOverdue?: boolean }) => {
        if (isOverdue && status === 'Lent') {
            return (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5 shadow-sm">
                    <AlertTriangle size={12} /> Überfällig
                </span>
            );
        }

        const styles: Record<string, { colors: string, label: string, icon: React.ReactNode }> = {
            'Available': { colors: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Verfügbar', icon: <CheckCircle size={12} /> },
            'Lent': { colors: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Ausgeliehen', icon: <Clock size={12} /> },
            'Maintenance': { colors: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Wartung', icon: <Wrench size={12} /> }
        };
        
        const config = styles[status] || { colors: 'bg-slate-700 text-slate-300 border-slate-600', label: status, icon: null };
        return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 shadow-sm ${config.colors}`}>
                {config.icon} {config.label}
            </span>
        );
    };

    const isDateOverdue = (dateString: string) => {
        if (!dateString) return false;
        const due = new Date(dateString);
        due.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        return due < today;
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-black flex items-center gap-3 text-white">
                    <div className="p-2.5 bg-blue-500/20 rounded-xl">
                        <PhoneForwarded className="w-8 h-8 text-blue-400" />
                    </div>
                    Leihgeräte Manager
                </h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Neues Gerät anlegen
                </button>
            </div>

            {/* Top Dashboard Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-colors"></div>
                    <div className="text-sm text-slate-400 mb-1 relative z-10 font-bold tracking-wider uppercase">Geräte Gesamt</div>
                    <div className="text-3xl font-black text-white relative z-10">{stats.Total}</div>
                </div>
                <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="text-sm text-emerald-400/80 font-bold mb-1 relative z-10 tracking-wider uppercase">Verfügbar</div>
                    <div className="text-3xl font-black text-emerald-400 relative z-10">{stats.Available}</div>
                </div>
                <div className="bg-blue-500/5 backdrop-blur-xl border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="text-sm text-blue-400/80 font-bold mb-1 relative z-10 tracking-wider uppercase">Ausgeliehen</div>
                    <div className="text-3xl font-black text-blue-400 relative z-10">{stats.Lent}</div>
                </div>
                <div className="bg-amber-500/5 backdrop-blur-xl border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
                    <div className="text-sm text-amber-400/80 font-bold mb-1 relative z-10 tracking-wider uppercase">In Wartung</div>
                    <div className="text-3xl font-black text-amber-400 relative z-10">{stats.Maintenance}</div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 shadow-lg">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Suchen nach Modell, IMEI oder Kundenname..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-colors"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {['All', 'Available', 'Lent', 'Maintenance'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-5 py-3 rounded-xl text-sm font-bold transition-colors ${filterStatus === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            {f === 'All' ? 'Alle Geräte' : f === 'Available' ? 'Verfügbar' : f === 'Lent' ? 'Ausgeliehen' : 'Wartung'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center items-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : loaners.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/5 flex flex-col items-center">
                        <Smartphone size={48} className="text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Keine Leihgeräte gefunden</h3>
                        <p className="text-slate-400">Es wurden keine Geräte gefunden, die deinen Kriterien entsprechen.</p>
                    </div>
                ) : (
                    loaners.map(loaner => {
                        const isOverdue = isDateOverdue(loaner.dueDate);
                        return (
                        <motion.div
                            layout
                            key={loaner._id}
                            className={`bg-slate-900/40 backdrop-blur-xl border ${isOverdue && loaner.status === 'Lent' ? 'border-red-500/50 shadow-lg shadow-red-900/10' : 'border-white/5'} rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all flex flex-col group`}
                        >
                            <div className="p-5 border-b border-white/5 flex justify-between items-start bg-slate-900/50">
                                <div>
                                    <h3 className="text-lg font-black text-white mb-1.5 flex items-center gap-2">
                                        <Smartphone size={18} className="text-blue-400" />
                                        {loaner.brand} {loaner.model}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">IMEI: {loaner.imei}</span>
                                        <button 
                                            onClick={() => handleCopyIMEI(loaner.imei)}
                                            title="IMEI kopieren"
                                            aria-label="IMEI kopieren"
                                            className="text-slate-500 hover:text-blue-400 transition-colors p-1 bg-slate-800/50 hover:bg-blue-500/10 rounded"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>
                                <StatusBadge status={loaner.status} isOverdue={isOverdue} />
                            </div>

                            <div className="p-5 flex-1 space-y-4">
                                {loaner.status === 'Lent' ? (
                                    <div className={`rounded-xl border p-4 space-y-3 ${isOverdue ? 'bg-red-500/5 border-red-500/20' : 'bg-blue-500/5 border-blue-500/10'}`}>
                                        <div className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2 ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}>
                                            <Clock size={14} /> {isOverdue ? 'Rückgabe überfällig!' : 'Ausgeliehen an'}
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Kunde</span>
                                                <span className="text-white text-sm font-bold">{loaner.currentCustomer?.name}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Telefon</span>
                                                <span className="text-slate-300 text-sm font-mono">{loaner.currentCustomer?.phone}</span>
                                            </div>
                                            {/* Action Shortcuts */}
                                            <div className="flex gap-2">
                                                <a href={`tel:${loaner.currentCustomer?.phone}`} title="Kunden anrufen" aria-label="Anrufen" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-colors">
                                                    <Phone size={14} />
                                                </a>
                                                <a href={`https://wa.me/${loaner.currentCustomer?.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp Nachricht" aria-label="WhatsApp" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-colors">
                                                    <MessageCircle size={14} />
                                                </a>
                                            </div>
                                        </div>
                                        
                                        <div className={`pt-3 mt-2 border-t ${isOverdue ? 'border-red-500/20' : 'border-blue-500/10'}`}>
                                            <span className="text-slate-400 text-xs flex items-center justify-between">
                                                Rückgabe bis: 
                                                <span className={`font-black px-2 py-0.5 rounded ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-amber-400'}`}>
                                                    {new Date(loaner.dueDate).toLocaleDateString('de-DE')}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                ) : loaner.status === 'Maintenance' ? (
                                    <div className="h-full flex items-center justify-center py-6">
                                        <div className="text-center text-slate-500">
                                            <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
                                                <Wrench size={24} className="text-amber-500/50" />
                                            </div>
                                            <span className="text-sm font-medium">Gerät in Reparatur/Wartung</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center py-6">
                                        <div className="text-center text-slate-500">
                                            <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                                                <CheckCircle size={24} className="text-emerald-500/50" />
                                            </div>
                                            <span className="text-sm font-medium">Bereit zum Verleih</span>
                                        </div>
                                    </div>
                                )}

                                {loaner.notes && (
                                    <div className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-white/5 flex items-start gap-2 shadow-inner">
                                        <FileText size={14} className="shrink-0 mt-0.5 text-blue-400" />
                                        <span className="italic leading-relaxed">{loaner.notes}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/5 flex gap-2 bg-slate-950/50 mt-auto">
                                {loaner.status === 'Available' && (
                                    <button
                                        onClick={() => setIsLendModalOpen({ open: true, loaner })}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
                                    >
                                        Gerät verleihen
                                    </button>
                                )}
                                {loaner.status === 'Lent' && (
                                    <button
                                        onClick={() => handleReturnPhone(loaner._id)}
                                        className="flex-1 bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 py-2.5 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Zurücknehmen
                                    </button>
                                )}
                                {loaner.status === 'Maintenance' && (
                                    <button
                                        onClick={() => handleReturnPhone(loaner._id)}
                                        className="flex-1 bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 py-2.5 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Wartung beenden
                                    </button>
                                )}
                                {loaner.status === 'Available' && (
                                    <button
                                        onClick={() => handleReturnPhone(loaner._id, true)}
                                        className="px-3 py-2 text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-white border border-amber-500/20 rounded-xl transition-all"
                                        title="In Wartung setzen"
                                        aria-label="In Wartung setzen"
                                    >
                                        <Wrench size={18} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDelete(loaner._id)} 
                                    className="px-3 py-2 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all opacity-0 group-hover:opacity-100" 
                                    title="Gerät löschen"
                                    aria-label="Gerät löschen"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )})
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-between px-6 py-4 mt-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg">
                    <div className="text-sm font-medium text-slate-400">
                        Seite <span className="text-white">{page}</span> von <span className="text-white">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            title="Vorherige Seite"
                            aria-label="Vorherige Seite"
                            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1 hidden sm:flex">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                if (totalPages > 7 && Math.abs(page - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                    if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="text-slate-500 px-2">...</span>;
                                    return null;
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === pageNum ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-white/5'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            title="Nächste Seite"
                            aria-label="Nächste Seite"
                            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ADD DEVICE MODAL */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                            
                            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-xl"><Smartphone className="w-5 h-5 text-blue-400" /></div>
                                    Neues Leihgerät anlegen
                                </h2>
                            </div>

                            <form onSubmit={handleAddLoaner} className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Marke</label>
                                        <input required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="z.B. Apple" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Modell</label>
                                        <input required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="z.B. iPhone 13" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">IMEI (15-stellig)</label>
                                    <input required value={formData.imei} onChange={e => setFormData({ ...formData, imei: e.target.value })} placeholder="35..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Initiale Notizen / Zustand</label>
                                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="z.B. Kratzer auf der Rückseite" rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white resize-none focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors">Abbrechen</button>
                                    <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3.5 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-900/20">Gerät speichern</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEND MODAL */}
            <AnimatePresence>
                {isLendModalOpen.open && isLendModalOpen.loaner && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                            
                            <div className="p-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
                                <h2 className="text-xl font-black text-white flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl"><PhoneForwarded className="w-5 h-5 text-emerald-400" /></div>
                                    Gerät verleihen
                                </h2>
                                <p className="text-sm text-slate-400 font-mono bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
                                    {isLendModalOpen.loaner.brand} {isLendModalOpen.loaner.model} <br/>
                                    <span className="text-xs text-slate-500">IMEI: {isLendModalOpen.loaner.imei}</span>
                                </p>
                            </div>

                            <form onSubmit={handleLendPhone} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Kundenname <span className="text-red-400">*</span></label>
                                    <input required value={lendFormData.customerName} onChange={e => setLendFormData({ ...lendFormData, customerName: e.target.value })} placeholder="Max Mustermann" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Telefon <span className="text-red-400">*</span></label>
                                        <input required value={lendFormData.customerPhone} onChange={e => setLendFormData({ ...lendFormData, customerPhone: e.target.value })} placeholder="+49 170..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Rückgabe bis <span className="text-red-400">*</span></label>
                                        <input type="date" required title="Rückgabe bis" value={lendFormData.dueDate} onChange={e => setLendFormData({ ...lendFormData, dueDate: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Übergabeprotokoll</label>
                                    <textarea value={lendFormData.notes} onChange={e => setLendFormData({ ...lendFormData, notes: e.target.value })} placeholder="Mängel, fehlendes Ladekabel..." rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white resize-none focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                                    <button type="button" onClick={() => setIsLendModalOpen({ open: false, loaner: null })} className="px-6 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors">Abbrechen</button>
                                    <button type="submit" className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3.5 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-900/20">Ausleihe bestätigen</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoanerManager;
