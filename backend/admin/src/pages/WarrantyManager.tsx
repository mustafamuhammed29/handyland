import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Search, Trash2, FileText, Clock } from 'lucide-react';
import { api } from '../utils/api';

interface Warranty {
    _id: string;
    warrantyCode: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    itemType: 'Repair' | 'Product' | 'Accessory';
    itemName: string;
    imeiOrSerial: string;
    supplierName: string;
    startDate: string;
    durationDays: number;
    endDate: string;
    status: 'Active' | 'Expired' | 'Claimed' | 'Voided';
    notes: string;
    createdAt: string;
}

const WarrantyManager = () => {
    const [warranties, setWarranties] = useState<Warranty[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Forms
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        itemType: 'Product',
        itemName: '',
        imeiOrSerial: '',
        supplierName: '',
        durationDays: 90,
        notes: ''
    });

    useEffect(() => {
        fetchWarranties();
    }, []);

    const fetchWarranties = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/warranties');
            setWarranties(data);
        } catch (error) {
            console.error('Failed to fetch warranties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWarranty = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/warranties', formData);
            fetchWarranties();
            setIsAddModalOpen(false);
            setFormData({ customerName: '', customerPhone: '', itemType: 'Product', itemName: '', imeiOrSerial: '', supplierName: '', durationDays: 90, notes: '' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error adding warranty');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Garantie wirklich löschen?')) return;
        try {
            await api.delete(`/api/warranties/${id}`);
            fetchWarranties();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Fehler beim Löschen');
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await api.put(`/api/warranties/${id}`, { status: newStatus });
            fetchWarranties();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Fehler beim Update');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            'Active': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            'Expired': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
            'Claimed': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            'Voided': 'bg-red-500/10 text-red-400 border border-red-500/20'
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${styles[status] || 'bg-slate-700 text-slate-300'}`}>
                {status === 'Active' ? 'Aktiv' : status === 'Expired' ? 'Abgelaufen' : status === 'Claimed' ? 'Eingelöst' : 'Nichtig'}
            </span>
        );
    };

    const filteredWarranties = warranties.filter(w => {
        const matchesSearch = (w.warrantyCode + w.customerPhone + w.imeiOrSerial + w.customerName).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || w.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const calculateDaysLeft = (endDateStr: string) => {
        const end = new Date(endDateStr);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-emerald-500" size={32} />
                        Garantie <span className="text-emerald-500">Tracker</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Verwalte Garantien für Reparaturen, Produkte und Zubehör.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus size={20} /> Neue Garantie
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Suchen nach Code, IMEI, Telefonnummer oder Kunde..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'Active', 'Expired', 'Claimed', 'Voided'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterStatus === f ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'}`}
                        >
                            {f === 'All' ? 'Alle' : f === 'Active' ? 'Aktiv' : f === 'Expired' ? 'Abgelaufen' : f === 'Claimed' ? 'Eingelöst' : 'Nichtig'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Garantien werden geladen...</div>
                ) : filteredWarranties.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">Keine Garantien gefunden.</div>
                ) : (
                    filteredWarranties.map(warranty => {
                        const daysLeft = calculateDaysLeft(warranty.endDate);

                        return (
                            <motion.div
                                layout
                                key={warranty._id}
                                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-colors flex flex-col ${warranty.status === 'Active' ? 'border-emerald-500/30' : 'border-slate-700'}`}
                            >
                                <div className="p-5 border-b border-slate-800 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            <ShieldCheck size={18} className={warranty.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'} />
                                            {warranty.warrantyCode}
                                        </h3>
                                        <span className="font-mono text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">{warranty.itemType}</span>
                                    </div>
                                    <StatusBadge status={warranty.status} />
                                </div>

                                <div className="p-5 flex-1 space-y-4">
                                    <div className="space-y-1">
                                        <div className="text-white font-medium">{warranty.itemName}</div>
                                        {warranty.imeiOrSerial && <div className="text-xs text-slate-400 font-mono">IMEI/SN: {warranty.imeiOrSerial}</div>}
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-4 space-y-2 text-sm">
                                        <div className="flex justify-between border-b border-slate-700/50 pb-2 mb-2">
                                            <span className="text-slate-400">Kunde:</span>
                                            <span className="text-white font-medium">{warranty.customerName}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700/50 pb-2 mb-2">
                                            <span className="text-slate-400">Telefon:</span>
                                            <span className="text-white font-medium">{warranty.customerPhone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Lieferant:</span>
                                            <span className="text-white font-medium">{warranty.supplierName || '-'}</span>
                                        </div>
                                    </div>

                                    {warranty.status === 'Active' ? (
                                        <div className={`p-3 rounded-xl border flex items-center justify-between ${daysLeft <= 14 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                <Clock size={16} /> Verbleibend
                                            </div>
                                            <div className="font-bold">{daysLeft} Tage</div>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl border bg-slate-800/50 border-slate-700 text-slate-400 text-sm flex justify-between">
                                            <span>Gültig bis:</span>
                                            <span>{new Date(warranty.endDate).toLocaleDateString('de-DE')}</span>
                                        </div>
                                    )}

                                    {warranty.notes && (
                                        <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg flex items-start gap-2">
                                            <FileText size={14} className="shrink-0 mt-0.5" />
                                            <span className="italic">{warranty.notes}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900/50 mt-auto">
                                    {warranty.status === 'Active' && (
                                        <button
                                            onClick={() => handleUpdateStatus(warranty._id, 'Claimed')}
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Als eingelöst mark.
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(warranty._id)} className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0" title="Löschen">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* ADD WARRANTY MODAL */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ShieldCheck className="text-emerald-500" /> Neue Garantie erstellen</h2>
                            <form onSubmit={handleAddWarranty} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-slate-400 mb-1 block">Kundenname <span className="text-red-400">*</span></label><input aria-label="Kundenname" title="Kundenname" placeholder="Name" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                    <div><label className="text-xs text-slate-400 mb-1 block">Telefonnummer <span className="text-red-400">*</span></label><input aria-label="Telefonnummer" title="Telefonnummer" placeholder="Nummer" required value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Typ <span className="text-red-400">*</span></label>
                                        <select aria-label="Typ" title="Typ" required value={formData.itemType} onChange={e => setFormData({ ...formData, itemType: e.target.value as any })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white">
                                            <option value="Repair">Reparatur (Ersatzteil)</option>
                                            <option value="Product">Gerät (Smartphone etc.)</option>
                                            <option value="Accessory">Zubehör</option>
                                        </select>
                                    </div>
                                    <div><label className="text-xs text-slate-400 mb-1 block">Artikelbezeichnung <span className="text-red-400">*</span></label><input aria-label="Artikelbezeichnung" title="Artikelbezeichnung" placeholder="z.B. iPhone 13 Display" required value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-slate-400 mb-1 block">IMEI / S.N.</label><input aria-label="IMEI" title="IMEI" placeholder="Geräte-IMEI falls vorh." value={formData.imeiOrSerial} onChange={e => setFormData({ ...formData, imeiOrSerial: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white font-mono" /></div>
                                    <div><label className="text-xs text-slate-400 mb-1 block">Zulieferer / Händler</label><input aria-label="Zulieferer" title="Zulieferer" placeholder="Woher stammt das Teil?" value={formData.supplierName} onChange={e => setFormData({ ...formData, supplierName: e.target.value })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                </div>
                                <div><label className="text-xs text-slate-400 mb-1 block">Garantiedauer (Tage) <span className="text-red-400">*</span></label><input aria-label="Garantiedauer" title="Garantiedauer" type="number" required value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>
                                <div><label className="text-xs text-slate-400 mb-1 block">Notizen</label><textarea aria-label="Notizen" title="Notizen" placeholder="Zusatzinfos..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2 text-white" /></div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors">Garantie erstellen</button>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors">Abbrechen</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WarrantyManager;
