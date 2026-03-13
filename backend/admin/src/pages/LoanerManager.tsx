import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneForwarded, Plus, Search, Trash2, Smartphone, FileText, CheckCircle, Clock } from 'lucide-react';
import { api } from '../utils/api';

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

const LoanerManager = () => {
    const [loaners, setLoaners] = useState<Loaner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLendModalOpen, setIsLendModalOpen] = useState<{ open: boolean, loaner: Loaner | null }>({ open: false, loaner: null });

    // Forms
    const [formData, setFormData] = useState({ brand: '', model: '', imei: '', status: 'Available', notes: '' });
    const [lendFormData, setLendFormData] = useState({ customerName: '', customerPhone: '', customerEmail: '', dueDate: '', notes: '' });

    useEffect(() => {
        fetchLoaners();
    }, []);

    const fetchLoaners = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/loaners');
            setLoaners(data);
        } catch (error) {
            console.error('Failed to fetch loaners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLoaner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/loaners', formData);
            fetchLoaners();
            setIsAddModalOpen(false);
            setFormData({ brand: '', model: '', imei: '', status: 'Available', notes: '' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error adding loaner');
        }
    };

    const handleLendPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLendModalOpen.loaner) return;
        try {
            await api.post(`/api/loaners/${isLendModalOpen.loaner._id}/lend`, lendFormData);
            fetchLoaners();
            setIsLendModalOpen({ open: false, loaner: null });
            setLendFormData({ customerName: '', customerPhone: '', customerEmail: '', dueDate: '', notes: '' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error lending phone');
        }
    };

    const handleReturnPhone = async (id: string) => {
        if (!window.confirm('Ist das Gerät wirklich zurückgegeben worden?')) return;
        try {
            await api.post(`/api/loaners/${id}/return`, { status: 'Available' });
            fetchLoaners();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Fehler bei der Rückgabe');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Leihtelefon wirklich löschen?')) return;
        try {
            await api.delete(`/api/loaners/${id}`);
            fetchLoaners();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Fehler beim Löschen');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            'Available': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            'Lent': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            'Maintenance': 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${styles[status] || 'bg-slate-700 text-slate-300'}`}>
                {status === 'Available' ? 'Verfügbar' : status === 'Lent' ? 'Ausgeliehen' : 'In Wartung'}
            </span>
        );
    };

    const filteredLoaners = loaners.filter(l => {
        const matchesSearch = (l.model + l.imei + l.currentCustomer?.name).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <PhoneForwarded className="text-blue-500" size={32} />
                        Leihgeräte <span className="text-blue-500">Manager</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Verwalte Ersatzhandys für Kunden während der Reparatur.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus size={20} /> Neues Leihgerät
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Suchen nach Modell, IMEI oder Kundenname..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'Available', 'Lent', 'Maintenance'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterStatus === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'}`}
                        >
                            {f === 'All' ? 'Alle' : f === 'Available' ? 'Verfügbar' : f === 'Lent' ? 'Ausgeliehen' : 'Wartung'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Geräte werden geladen...</div>
                ) : filteredLoaners.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">Keine Leihgeräte gefunden.</div>
                ) : (
                    filteredLoaners.map(loaner => (
                        <motion.div
                            layout
                            key={loaner._id}
                            className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors flex flex-col"
                        >
                            <div className="p-5 border-b border-slate-800 flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                        <Smartphone size={16} className="text-slate-400" />
                                        {loaner.brand} {loaner.model}
                                    </h3>
                                    <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">IMEI: {loaner.imei}</span>
                                </div>
                                <StatusBadge status={loaner.status} />
                            </div>

                            <div className="p-5 flex-1 space-y-4">
                                {loaner.status === 'Lent' ? (
                                    <div className="bg-blue-500/5 rounded-xl border border-blue-500/10 p-4 space-y-2">
                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Clock size={14} /> Ausgeliehen an</div>
                                        <div><span className="text-slate-400 text-xs">Name:</span> <span className="text-white text-sm font-medium">{loaner.currentCustomer?.name}</span></div>
                                        <div><span className="text-slate-400 text-xs">Tel:</span> <span className="text-slate-300 text-sm">{loaner.currentCustomer?.phone}</span></div>
                                        <div className="pt-2 mt-2 border-t border-blue-500/10">
                                            <span className="text-slate-400 text-xs mt-1 block">Rückgabe bis: <span className="text-amber-400 font-bold">{new Date(loaner.dueDate).toLocaleDateString('de-DE')}</span></span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center py-6">
                                        <div className="text-center text-slate-500">
                                            <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                                            <span className="text-sm font-medium">Bereit zum Verleih</span>
                                        </div>
                                    </div>
                                )}

                                {loaner.notes && (
                                    <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg flex items-start gap-2">
                                        <FileText size={14} className="shrink-0 mt-0.5" />
                                        <span className="italic">{loaner.notes}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900/50 mt-auto">
                                {loaner.status === 'Available' && (
                                    <button
                                        onClick={() => setIsLendModalOpen({ open: true, loaner })}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Gerät verleihen
                                    </button>
                                )}
                                {loaner.status === 'Lent' && (
                                    <button
                                        onClick={() => handleReturnPhone(loaner._id)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Gerät zurücknehmen
                                    </button>
                                )}
                                <button onClick={() => handleDelete(loaner._id)} className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0" title="Gerät löschen">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* ADD DEVICE MODAL */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Smartphone className="text-blue-500" /> Neues Leihgerät</h2>
                            <form onSubmit={handleAddLoaner} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-slate-400 mb-1 block">Marke</label><input aria-label="Marke" title="Marke" placeholder="z.B. Apple" required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                    <div><label className="text-xs text-slate-400 mb-1 block">Modell</label><input aria-label="Modell" title="Modell" placeholder="z.B. iPhone 13" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                </div>
                                <div><label className="text-xs text-slate-400 mb-1 block">IMEI</label><input aria-label="IMEI" title="IMEI" placeholder="15-stellige IMEI..." required value={formData.imei} onChange={e => setFormData({ ...formData, imei: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white font-mono" /></div>
                                <div><label className="text-xs text-slate-400 mb-1 block">Zustand / Notizen</label><textarea aria-label="Notizen" title="Notizen" placeholder="Kratzer am Display..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>

                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors">Hinzufügen</button>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors">Abbrechen</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEND MODAL */}
            <AnimatePresence>
                {isLendModalOpen.open && isLendModalOpen.loaner && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><PhoneForwarded className="text-blue-500" /> Gerät verleihen</h2>
                            <p className="text-sm text-slate-400 mb-6 font-mono bg-slate-800 px-3 py-2 rounded-lg">{isLendModalOpen.loaner.brand} {isLendModalOpen.loaner.model} (IMEI: {isLendModalOpen.loaner.imei})</p>

                            <form onSubmit={handleLendPhone} className="space-y-4">
                                <div><label className="text-xs text-slate-400 mb-1 block">Kundenname <span className="text-red-400">*</span></label><input aria-label="Kundenname" title="Kundenname" placeholder="Max Mustermann" required value={lendFormData.customerName} onChange={e => setLendFormData({ ...lendFormData, customerName: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-slate-400 mb-1 block">Telefon <span className="text-red-400">*</span></label><input aria-label="Telefon" title="Telefon" placeholder="+43 664..." required value={lendFormData.customerPhone} onChange={e => setLendFormData({ ...lendFormData, customerPhone: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                    <div><label className="text-xs text-slate-400 mb-1 block">Frist (Rückgabe am) <span className="text-red-400">*</span></label><input type="date" title="Frist" placeholder="Frist" required value={lendFormData.dueDate} onChange={e => setLendFormData({ ...lendFormData, dueDate: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                </div>
                                <div><label className="text-xs text-slate-400 mb-1 block">Übergabeprotokoll (Mängel, Kratzer etc.)</label><textarea title="Übergabeprotokoll" placeholder="Übergabeprotokoll" value={lendFormData.notes} onChange={e => setLendFormData({ ...lendFormData, notes: e.target.value })} rows={2} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>

                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors">Verleihen bestätigen</button>
                                    <button type="button" onClick={() => setIsLendModalOpen({ open: false, loaner: null })} className="px-6 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors">Abbrechen</button>
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
