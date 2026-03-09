import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, CheckCircle, XCircle, Clock, CheckSquare, Square, Plus, Wrench, Smartphone, FileText, Send, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Clock className="w-4 h-4" />, description: 'Ticket created, waiting for device.' },
    received: { label: 'Received', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: <CheckCircle className="w-4 h-4" />, description: 'Device received at the shop.' },
    diagnosing: { label: 'Diagnosing', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <Search className="w-4 h-4" />, description: 'Technician is checking the device.' },
    waiting_parts: { label: 'Waiting Parts', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: <Clock className="w-4 h-4" />, description: 'Waiting for replacement parts.' },
    repairing: { label: 'Repairing', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Wrench className="w-4 h-4" />, description: 'Device is currently being repaired.' },
    testing: { label: 'Testing', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <Smartphone className="w-4 h-4" />, description: 'Repair done, testing device.' },
    ready: { label: 'Ready for Pickup', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <CheckCircle className="w-4 h-4" />, description: 'Device ready for customer to collect.' },
    completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <CheckCircle className="w-4 h-4" />, description: 'Ticket closed, device handed over.' },
    cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <XCircle className="w-4 h-4" />, description: 'Repair was cancelled.' },
};

interface UserRef {
    _id: string;
    name: string;
    email: string;
}

interface RepairTicket {
    _id: string;
    ticketId: string;
    user?: UserRef;
    guestContact?: {
        name: string;
        email: string;
        phone: string;
    };
    device: string;
    issue: string;
    status: string;
    estimatedCost?: number;
    appointmentDate?: string;
    serviceType: string;
    notes?: string;
    timeline: { status: string; timestamp: string; note: string }[];
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    totalTickets: number;
    pendingTickets: number;
    inProgressTickets: number;
    completedTickets: number;
    totalEstimatedRevenue: number;
}

const RepairTicketManager: React.FC = () => {
    const [tickets, setTickets] = useState<RepairTicket[]>([]);
    const [stats, setStats] = useState<Stats>({ totalTickets: 0, pendingTickets: 0, inProgressTickets: 0, completedTickets: 0, totalEstimatedRevenue: 0 });
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Status update modal state
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: '', estimatedCost: '', adminNote: '' });
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Create ticket modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        device: '', issue: '', guestName: '', guestEmail: '', guestPhone: '', serviceType: 'In-Store', notes: ''
    });

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    const calculateStats = (ticketData: RepairTicket[]) => {
        let total = ticketData.length;
        let pending = 0;
        let inProgress = 0;
        let completed = 0;
        let revenue = 0;

        ticketData.forEach(t => {
            if (t.status === 'pending') pending++;
            else if (['completed', 'cancelled'].includes(t.status)) completed++;
            else inProgress++;

            if (t.estimatedCost) revenue += t.estimatedCost;
        });

        setStats({
            totalTickets: total,
            pendingTickets: pending,
            inProgressTickets: inProgress,
            completedTickets: completed,
            totalEstimatedRevenue: revenue
        });
    };

    const fetchTickets = async () => {
        try {
            const response = await api.get('/api/repairs/admin/all');
            if (response.data.success) {
                setTickets(response.data.tickets);
                calculateStats(response.data.tickets);
            }
        } catch (error) {
            console.error('Error fetching repair tickets:', error);
            showToast('error', 'Failed to load repair tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const openStatusModal = (ticket: RepairTicket) => {
        setStatusForm({ status: ticket.status, estimatedCost: ticket.estimatedCost?.toString() || '', adminNote: '' });
        setShowStatusModal(true);
    };

    const handleStatusUpdate = async () => {
        if (!selectedTicket || !statusForm.status) return;
        setUpdatingStatus(true);
        try {
            const response = await api.put(`/api/repairs/tickets/${selectedTicket._id}/status`, {
                status: statusForm.status,
                estimatedCost: statusForm.estimatedCost ? Number(statusForm.estimatedCost) : undefined,
                notes: statusForm.adminNote || undefined,
            });
            if (response.data.success) {
                showToast('success', `Ticket ${selectedTicket.ticketId} status updated!`);
                setShowStatusModal(false);
                setSelectedTicket(null);
                fetchTickets();
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            showToast('error', 'Failed to update ticket status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/repairs/tickets', {
                device: createForm.device,
                issue: createForm.issue,
                serviceType: createForm.serviceType,
                notes: createForm.notes,
                guestContact: {
                    name: createForm.guestName,
                    email: createForm.guestEmail,
                    phone: createForm.guestPhone,
                }
            });
            if (response.data.success) {
                showToast('success', 'Repair ticket created successfully!');
                setShowCreateModal(false);
                setCreateForm({ device: '', issue: '', guestName: '', guestEmail: '', guestPhone: '', serviceType: 'In-Store', notes: '' });
                fetchTickets();
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            showToast('error', 'Failed to create repair ticket.');
        }
    };

    const handleDeleteTicket = async (ticket: RepairTicket) => {
        if (!window.confirm(`Delete ticket ${ticket.ticketId} (${ticket.device})? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/repairs/tickets/${ticket._id}`);
            showToast('success', `Ticket ${ticket.ticketId} deleted.`);
            if (selectedTicket?._id === ticket._id) setSelectedTicket(null);
            setSelectedTickets(prev => prev.filter(id => id !== ticket._id));
            fetchTickets();
        } catch (error) {
            showToast('error', 'Failed to delete ticket.');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Permanently delete ${selectedTickets.length} selected tickets?`)) return;
        try {
            await Promise.all(selectedTickets.map(id => api.delete(`/api/repairs/tickets/${id}`)));
            showToast('success', `${selectedTickets.length} tickets deleted.`);
            setSelectedTickets([]);
            fetchTickets();
        } catch {
            showToast('error', 'Bulk delete failed.');
        }
    };

    const handleSelectAll = () => {
        if (selectedTickets.length === tickets.length && tickets.length > 0) {
            setSelectedTickets([]);
        } else {
            setSelectedTickets(tickets.map(t => t._id));
        }
    };

    const toggleSelectTicket = (id: string) => {
        if (selectedTickets.includes(id)) {
            setSelectedTickets(selectedTickets.filter(tId => tId !== id));
        } else {
            setSelectedTickets([...selectedTickets, id]);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.guestContact?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.device.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === '' || ticket.status === selectedStatus;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getCustomerName = (ticket: RepairTicket) => ticket.user?.name || ticket.guestContact?.name || 'Unknown';
    const getCustomerEmail = (ticket: RepairTicket) => ticket.user?.email || ticket.guestContact?.email || 'Unknown';

    if (loading) return <div className="text-white p-8">Loading tickets...</div>;

    return (
        <div className="p-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right-4 ${toast.type === 'success'
                    ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-900/90 border-red-500/50 text-red-300'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {toast.text}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-black flex items-center gap-3 text-white">
                    <Wrench className="w-8 h-8 text-blue-500" />
                    Repair Tickets
                </h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Create Ticket
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="text-sm text-slate-400">Total Tickets</div>
                    <div className="text-2xl font-black text-white">{stats.totalTickets}</div>
                </div>
                <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30">
                    <div className="text-sm text-yellow-500 font-bold">Pending</div>
                    <div className="text-2xl font-black text-yellow-400">{stats.pendingTickets}</div>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                    <div className="text-sm text-blue-500 font-bold">In Progress</div>
                    <div className="text-2xl font-black text-blue-400">{stats.inProgressTickets}</div>
                </div>
                <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                    <div className="text-sm text-green-500 font-bold">Completed</div>
                    <div className="text-2xl font-black text-green-400">{stats.completedTickets}</div>
                </div>
                <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30">
                    <div className="text-sm text-indigo-400 font-bold">Est. Revenue</div>
                    <div className="text-2xl font-black text-indigo-300">€{stats.totalEstimatedRevenue.toFixed(2)}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by ticket ID, customer, device..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select
                        aria-label="Filter by Status"
                        className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 outline-none"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedTickets.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center justify-between">
                    <span className="text-red-400 font-bold">{selectedTickets.length} ticket(s) selected</span>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Selected
                    </button>
                </div>
            )}

            {/* Tickets Table */}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 w-16">
                                <button onClick={handleSelectAll} className="text-slate-400 hover:text-white transition-colors">
                                    {(selectedTickets.length === tickets.length && tickets.length > 0) ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
                                </button>
                            </th>
                            <th className="px-6 py-4">Ticket ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Device & Issue</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Cost</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredTickets.map((ticket) => {
                            const isSelected = selectedTickets.includes(ticket._id);
                            const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['pending'];
                            return (
                                <tr key={ticket._id} className={`transition-colors ${isSelected ? 'bg-blue-900/10' : 'hover:bg-slate-800/30'}`}>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleSelectTicket(ticket._id)} className="text-slate-400 hover:text-white transition-colors">
                                            {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-white font-mono">{ticket.ticketId}</div>
                                        <div className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{getCustomerName(ticket)}</div>
                                        <div className="text-xs text-slate-400">{ticket.user ? 'Registered User' : 'Guest'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-200">{ticket.device}</div>
                                        <div className="text-sm text-slate-400 w-48 truncate" title={ticket.issue}>{ticket.issue}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                                            {statusCfg.icon} {statusCfg.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-white">{ticket.estimatedCost ? `€${ticket.estimatedCost.toFixed(2)}` : 'TBD'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold text-sm bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" /> View
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTicket(ticket)}
                                                title="Delete Ticket"
                                                className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredTickets.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-500">
                                    No repair tickets found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* View/Update Ticket Modal */}
            {
                selectedTicket && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                                <div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                        Ticket <span className="font-mono text-blue-400">{selectedTicket.ticketId}</span>
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-1">Created on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl">✕</button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {/* Customer Info */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Customer Information</h3>
                                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                            <div className="font-bold text-lg text-white">{getCustomerName(selectedTicket)} {selectedTicket.user ? <span className="ml-2 text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded uppercase">Registered</span> : <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase">Guest</span>}</div>
                                            <div className="text-slate-400 mt-1">{getCustomerEmail(selectedTicket)}</div>
                                            {selectedTicket.guestContact?.phone && <div className="text-slate-400 font-mono text-sm mt-1">{selectedTicket.guestContact.phone}</div>}
                                        </div>
                                    </div>

                                    {/* Repair Details */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Repair Details</h3>
                                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                                            <div>
                                                <div className="text-slate-500 text-xs">Device</div>
                                                <div className="text-xl font-bold text-white">{selectedTicket.device}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 text-xs">Issue Description</div>
                                                <div className="text-slate-300 mt-1 p-3 bg-slate-900 rounded-lg text-sm border border-slate-700/50"><FileText className="inline w-4 h-4 text-emerald-400 mr-2" />{selectedTicket.issue}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <div className="text-slate-500 text-xs">Service Type</div>
                                                    <div className="text-white font-bold">{selectedTicket.serviceType || 'In-Store'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs">Estimated Cost</div>
                                                    <div className="text-emerald-400 font-bold text-lg">{selectedTicket.estimatedCost ? `€${selectedTicket.estimatedCost.toFixed(2)}` : 'To Be Determined'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline & Actions */}
                                <div className="space-y-6 flex flex-col h-full">
                                    <div className="flex-1 min-h-[200px]">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                                            Ticket Timeline
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${STATUS_CONFIG[selectedTicket.status]?.bg} ${STATUS_CONFIG[selectedTicket.status]?.color}`}>Current: {STATUS_CONFIG[selectedTicket.status]?.label}</span>
                                        </h3>
                                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 h-full max-h-64 overflow-y-auto relative">
                                            <div className="absolute left-6 top-8 bottom-8 w-px bg-slate-700"></div>
                                            <div className="space-y-4 relative z-10">
                                                {selectedTicket.timeline?.map((entry, idx) => {
                                                    const iconCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG['pending'];
                                                    return (
                                                        <div key={idx} className="flex gap-4">
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 bg-slate-900 ${iconCfg.color} ${iconCfg.border}`}>
                                                                {React.cloneElement(iconCfg.icon as any, { className: 'w-3 h-3' })}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white text-sm">{iconCfg.label}</span>
                                                                    <span className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</span>
                                                                </div>
                                                                {entry.note && <div className="text-sm text-slate-400 mt-1">{entry.note}</div>}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                                        <button
                                            onClick={() => openStatusModal(selectedTicket)}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                                        >
                                            <Send className="w-5 h-5" /> Update Status / Contact Customer
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTicket(selectedTicket)}
                                            className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 font-bold py-2.5 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete This Ticket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Update Status Modal */}
            {
                showStatusModal && selectedTicket && (() => {
                    const cfg = STATUS_CONFIG[statusForm.status] || STATUS_CONFIG['pending'];
                    return (
                        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
                                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-white">Update Ticket Status</h3>
                                    <button onClick={() => setShowStatusModal(false)} className="text-slate-500 hover:text-white">✕</button>
                                </div>
                                <div className="p-5 space-y-4">
                                    {/* Status Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">New Status</label>
                                        <select
                                            value={statusForm.status}
                                            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
                                        >
                                            {Object.entries(STATUS_CONFIG).map(([key, item]) => (
                                                <option key={key} value={key}>{item.label}</option>
                                            ))}
                                        </select>
                                        <p className={`text-xs mt-2 ${cfg.color}`}>→ {cfg.description}</p>
                                    </div>

                                    {/* Estimated Cost */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Estimated Cost (€)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={statusForm.estimatedCost}
                                            onChange={(e) => setStatusForm({ ...statusForm, estimatedCost: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Leave empty if unknown. Updating cost triggers a notification.</p>
                                    </div>

                                    {/* Admin Note */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Note (Sent to Customer)</label>
                                        <textarea
                                            value={statusForm.adminNote}
                                            onChange={(e) => setStatusForm({ ...statusForm, adminNote: e.target.value })}
                                            placeholder="e.g. We need to order the screen, ETA 2 days."
                                            rows={3}
                                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="p-5 border-t border-slate-800 flex gap-3">
                                    <button onClick={() => setShowStatusModal(false)} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl">Cancel</button>
                                    <button onClick={handleStatusUpdate} disabled={updatingStatus} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center">
                                        {updatingStatus ? 'Updating...' : 'Save & Notify'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

            {/* Create Manual Ticket Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                                <h3 className="font-bold text-xl text-white">Create New Repair Ticket</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-xl">✕</button>
                            </div>
                            <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><div className="w-full h-px bg-slate-800"></div> Customer Info <div className="w-full h-px bg-slate-800"></div></h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name *</label>
                                        <input required type="text" value={createForm.guestName} onChange={e => setCreateForm({ ...createForm, guestName: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="John Doe" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                                            <input required type="email" value={createForm.guestEmail} onChange={e => setCreateForm({ ...createForm, guestEmail: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="john@example.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                                            <input type="text" value={createForm.guestPhone} onChange={e => setCreateForm({ ...createForm, guestPhone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="+49..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><div className="w-full h-px bg-slate-800"></div> Device & Issue <div className="w-full h-px bg-slate-800"></div></h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Device Model *</label>
                                        <input required type="text" value={createForm.device} onChange={e => setCreateForm({ ...createForm, device: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="iPhone 13 Pro" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Issue Description *</label>
                                        <textarea required rows={3} value={createForm.issue} onChange={e => setCreateForm({ ...createForm, issue: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none" placeholder="Screen is completely shattered." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Internal Notes</label>
                                        <textarea rows={2} value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none" placeholder="Frame bent, missing sim tray." />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-lg shadow-lg shadow-emerald-900/20 transition-transform active:scale-[0.98]">
                                    ✓ Create Ticket
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RepairTicketManager;
