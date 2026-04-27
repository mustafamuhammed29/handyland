import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, CheckCircle, XCircle, Clock, CheckSquare, Square, Plus, Wrench, Smartphone, FileText, Send, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

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
    technicianNotes?: string;
    messages?: {
        _id?: string;
        role: 'customer' | 'admin';
        text: string;
        timestamp: string;
    }[];
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
    
    // Pagination and Search
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 15;
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

    // Status update modal state
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: '', estimatedCost: '', adminNote: '' });
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Support sending a single chat message
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    // Create ticket modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        device: '', issue: '', guestName: '', guestEmail: '', guestPhone: '', serviceType: 'In-Store', notes: ''
    });

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/repairs/tickets/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: debouncedSearch,
                status: selectedStatus
            });
            const response = await api.get(`/api/repairs/admin/all?${queryParams.toString()}`);
            if (response.data.success) {
                setTickets(response.data.tickets);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching repair tickets:', error);
            toast.error('Failed to load repair tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedStatus]);

    useEffect(() => {
        fetchTickets();
    }, [page, debouncedSearch, selectedStatus]);

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
                technicianNotes: statusForm.adminNote || undefined,
            });
            if (response.data.success) {
                toast.success(`Ticket ${selectedTicket.ticketId} status updated!`);
                setShowStatusModal(false);
                setSelectedTicket(null);
                fetchTickets();
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update ticket status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return;
        setSendingMessage(true);
        try {
            const response = await api.put(`/api/repairs/tickets/${selectedTicket._id}/status`, {
                technicianNotes: newMessage,
            });
            if (response.data.success) {
                setSelectedTicket({
                    ...selectedTicket,
                    messages: response.data.ticket.messages
                });
                setNewMessage('');
                fetchTickets();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message.');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/repairs/tickets', {
                device: createForm.device,
                issue: createForm.issue,
                serviceType: createForm.serviceType,
                technicianNotes: createForm.notes,
                guestContact: {
                    name: createForm.guestName,
                    email: createForm.guestEmail,
                    phone: createForm.guestPhone,
                }
            });
            if (response.data.success) {
                toast.success('Repair ticket created successfully!');
                setShowCreateModal(false);
                setCreateForm({ device: '', issue: '', guestName: '', guestEmail: '', guestPhone: '', serviceType: 'In-Store', notes: '' });
                fetchTickets();
                fetchStats();
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create repair ticket.');
        }
    };

    const handleDeleteTicket = async (ticket: RepairTicket) => {
        if (!window.confirm(`Delete ticket ${ticket.ticketId} (${ticket.device})? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/repairs/tickets/${ticket._id}`);
            toast.success(`Ticket ${ticket.ticketId} deleted.`);
            if (selectedTicket?._id === ticket._id) setSelectedTicket(null);
            setSelectedTickets(prev => prev.filter(id => id !== ticket._id));
            fetchTickets();
            fetchStats();
        } catch (error) {
            toast.error('Failed to delete ticket.');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedTickets.length} tickets permanently?`)) return;
        try {
            await Promise.all(selectedTickets.map(id => api.delete(`/api/repairs/admin/tickets/${id}`)));
            toast.success(`${selectedTickets.length} tickets deleted.`);
            fetchTickets();
            fetchStats();
            setSelectedTickets([]);
            setSelectedTicket(null);
        } catch (error) {
            toast.error('Bulk delete failed.');
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

    const getCustomerName = (ticket: RepairTicket) => ticket.user?.name || ticket.guestContact?.name || 'Unknown';
    const getCustomerEmail = (ticket: RepairTicket) => ticket.user?.email || ticket.guestContact?.email || 'Unknown';

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-black flex items-center gap-3 text-white">
                    <div className="p-2.5 bg-blue-500/20 rounded-xl">
                        <Wrench className="w-8 h-8 text-blue-400" />
                    </div>
                    Repair Tickets
                </h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Create Ticket
                </button>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-colors"></div>
                    <div className="text-sm text-slate-400 mb-1 relative z-10">Total Tickets</div>
                    <div className="text-3xl font-black text-white relative z-10">{stats.totalTickets}</div>
                </div>
                <div className="bg-yellow-500/5 backdrop-blur-xl border border-yellow-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors"></div>
                    <div className="text-sm text-yellow-500/80 font-bold mb-1 relative z-10">Pending</div>
                    <div className="text-3xl font-black text-yellow-400 relative z-10">{stats.pendingTickets}</div>
                </div>
                <div className="bg-blue-500/5 backdrop-blur-xl border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="text-sm text-blue-400/80 font-bold mb-1 relative z-10">In Progress</div>
                    <div className="text-3xl font-black text-blue-400 relative z-10">{stats.inProgressTickets}</div>
                </div>
                <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="text-sm text-emerald-400/80 font-bold mb-1 relative z-10">Completed</div>
                    <div className="text-3xl font-black text-emerald-400 relative z-10">{stats.completedTickets}</div>
                </div>
                <div className="bg-indigo-500/5 backdrop-blur-xl border border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
                    <div className="text-sm text-indigo-400/80 font-bold mb-1 relative z-10">Est. Revenue</div>
                    <div className="text-3xl font-black text-indigo-300 relative z-10">€{stats.totalEstimatedRevenue.toFixed(2)}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl mb-6 flex flex-wrap gap-4 shadow-lg">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by ticket ID, customer, device..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-900 outline-none transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select
                        aria-label="Filter by Status"
                        className="px-4 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:border-blue-500 focus:bg-slate-900 outline-none transition-colors"
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
                <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-lg">
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
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-16">
                                    <button aria-label="Select All Tickets" title="Select All" onClick={handleSelectAll} className="text-slate-400 hover:text-white transition-colors">
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
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-400 font-medium">Loading tickets...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <Wrench className="w-12 h-12 text-slate-700" />
                                            <span className="text-slate-500 text-lg">No repair tickets found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => {
                                    const isSelected = selectedTickets.includes(ticket._id);
                                    const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['pending'];
                                    return (
                                        <tr key={ticket._id} className={`transition-colors group ${isSelected ? 'bg-blue-900/10' : 'hover:bg-slate-800/30'}`}>
                                            <td className="px-6 py-4">
                                                <button aria-label="Select Ticket" title="Select Ticket" onClick={() => toggleSelectTicket(ticket._id)} className="text-slate-400 hover:text-white transition-colors">
                                                    {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-white font-mono group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>{ticket.ticketId}</div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{getCustomerName(ticket)}</div>
                                                <div className="text-xs text-slate-400 mt-1">{ticket.user ? 'Registered User' : 'Guest'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-200">{ticket.device}</div>
                                                <div className="text-sm text-slate-400 w-48 truncate mt-1" title={ticket.issue}>{ticket.issue}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                                                    {statusCfg.icon} {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-white">{ticket.estimatedCost ? `€${ticket.estimatedCost.toFixed(2)}` : <span className="text-slate-500 italic">TBD</span>}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedTicket(ticket)}
                                                        className="text-blue-400 hover:text-white flex items-center gap-1 font-bold text-sm bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" /> View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTicket(ticket)}
                                                        title="Delete Ticket"
                                                        aria-label="Delete Ticket"
                                                        className="text-red-400 hover:text-white p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50 bg-slate-900/30">
                        <div className="text-sm text-slate-400">
                            Showing page {page} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                title="Previous Page"
                                aria-label="Previous Page"
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (totalPages > 7 && Math.abs(page - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                        if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="text-slate-500 px-1">...</span>;
                                        return null;
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                title="Next Page"
                                aria-label="Next Page"
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View/Update Ticket Modal */}
            {
                selectedTicket && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95">
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                        <Wrench className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                            Ticket <span className="font-mono text-blue-400">{selectedTicket.ticketId}</span>
                                        </h2>
                                        <p className="text-slate-400 text-sm mt-1">Created on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button title="Close Details" aria-label="Close Details" onClick={() => setSelectedTicket(null)} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                                
                                {/* Left Column: Info */}
                                <div className="p-6 lg:col-span-5 space-y-6 bg-slate-900/30">
                                    {/* Customer Info */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Customer Information</h3>
                                        <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                                            <div className="font-black text-xl text-white flex items-center gap-3">
                                                {getCustomerName(selectedTicket)} 
                                                {selectedTicket.user ? <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase border border-blue-500/30">Registered</span> : <span className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full uppercase border border-slate-600">Guest</span>}
                                            </div>
                                            <div className="text-slate-400 mt-2 font-medium">{getCustomerEmail(selectedTicket)}</div>
                                            {selectedTicket.guestContact?.phone && <div className="text-slate-400 font-mono text-sm mt-1">{selectedTicket.guestContact.phone}</div>}
                                        </div>
                                    </div>

                                    {/* Repair Details */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Repair Details</h3>
                                        <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md space-y-5">
                                            <div>
                                                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Device</div>
                                                <div className="text-xl font-black text-white">{selectedTicket.device}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Issue Description</div>
                                                <div className="text-slate-300 p-4 bg-slate-900/80 rounded-xl text-sm border border-white/5 shadow-inner leading-relaxed">
                                                    <FileText className="inline w-4 h-4 text-emerald-400 mr-2" />
                                                    {selectedTicket.issue}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                                <div>
                                                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Service Type</div>
                                                    <div className="text-white font-bold">{selectedTicket.serviceType || 'In-Store'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Estimated Cost</div>
                                                    <div className="text-emerald-400 font-black text-xl">{selectedTicket.estimatedCost ? `€${selectedTicket.estimatedCost.toFixed(2)}` : 'TBD'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 flex flex-col gap-3">
                                        <button
                                            onClick={() => openStatusModal(selectedTicket)}
                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold py-4 rounded-xl transition-all text-sm shadow-lg"
                                        >
                                            <Wrench className="w-4 h-4" /> Update Ticket Status & Cost
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTicket(selectedTicket)}
                                            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold py-4 rounded-xl transition-all text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete Ticket
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Unified Chat & Timeline */}
                                <div className="p-6 lg:col-span-7 flex flex-col h-[500px] lg:h-auto">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex justify-between items-center shrink-0">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Ticket Chat Log</div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_CONFIG[selectedTicket.status]?.bg} ${STATUS_CONFIG[selectedTicket.status]?.color} ${STATUS_CONFIG[selectedTicket.status]?.border}`}>Status: {STATUS_CONFIG[selectedTicket.status]?.label}</span>
                                    </h3>
                                    
                                    <div className="flex-1 bg-slate-900/60 rounded-2xl p-5 border border-white/5 flex flex-col relative shadow-inner overflow-hidden">
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-5 mb-4 custom-scrollbar">
                                            {/* Legacy Notes Rendering */}
                                            {(!selectedTicket.messages || selectedTicket.messages.length === 0) && selectedTicket.notes && (
                                                <div className="flex justify-start">
                                                    <div className="bg-slate-800 text-white p-4 rounded-2xl rounded-bl-sm max-w-[85%] border border-slate-700 shadow-sm">
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {(!selectedTicket.messages || selectedTicket.messages.length === 0) && selectedTicket.technicianNotes && (
                                                <div className="flex justify-end">
                                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-br-sm max-w-[85%] shadow-md">
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.technicianNotes}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Detailed Messages Array */}
                                            {selectedTicket.messages && selectedTicket.messages.map((msg, index) => (
                                                <div key={msg._id || index} className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="flex flex-col gap-1.5 max-w-[85%]">
                                                        <div className={`p-4 rounded-2xl shadow-md ${msg.role === 'admin' ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm' : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-200 rounded-bl-sm'}`}>
                                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                        </div>
                                                        <span className={`text-[10px] text-slate-500 font-mono font-medium ${msg.role === 'admin' ? 'text-right pr-1' : 'text-left pl-1'} `}>
                                                            {new Date(msg.timestamp).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {(!selectedTicket.messages || selectedTicket.messages.length === 0) && !selectedTicket.notes && !selectedTicket.technicianNotes && (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm italic gap-3">
                                                    <Send className="w-8 h-8 text-slate-700" />
                                                    Start solving the issue by sending a message.
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Reply Area */}
                                        <div className="mt-auto pt-4 border-t border-white/5 relative shrink-0 flex gap-3">
                                            <textarea
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder="Write a message to the customer..."
                                                disabled={sendingMessage}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 pr-16 text-sm text-white focus:border-blue-500 focus:bg-slate-900 outline-none resize-none h-[60px] shadow-inner transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                            />
                                            <button 
                                                onClick={handleSendMessage}
                                                title="Send Message"
                                                aria-label="Send Message"
                                                disabled={!newMessage.trim() || sendingMessage}
                                                className="absolute right-3 top-7 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-blue-500/20"
                                            >
                                                {sendingMessage ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send className="w-5 h-5" /> }
                                            </button>
                                        </div>
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
                        <div className="fixed inset-0 bg-slate-950/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-blue-500"></div>
                                <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
                                    <h3 className="font-black text-xl text-white">Update Ticket Status</h3>
                                    <button title="Close Modal" aria-label="Close Modal" onClick={() => setShowStatusModal(false)} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                        <XCircle size={18} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Status Selector */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">New Status</label>
                                        <select
                                            title="New Status"
                                            value={statusForm.status}
                                            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3.5 focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            {Object.entries(STATUS_CONFIG).map(([key, item]) => (
                                                <option key={key} value={key}>{item.label}</option>
                                            ))}
                                        </select>
                                        <div className={`mt-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border} flex items-center gap-3`}>
                                            <div className={`${cfg.color}`}>{cfg.icon}</div>
                                            <p className={`text-sm font-medium ${cfg.color}`}>{cfg.description}</p>
                                        </div>
                                    </div>

                                    {/* Estimated Cost */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">Estimated Cost (€)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={statusForm.estimatedCost}
                                            onChange={(e) => setStatusForm({ ...statusForm, estimatedCost: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold rounded-xl p-3.5 focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-2 font-medium">Leave empty if unknown. Updating cost triggers a notification to the customer.</p>
                                    </div>

                                    {/* Admin Note */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">Note (Sent to Customer)</label>
                                        <textarea
                                            value={statusForm.adminNote}
                                            onChange={(e) => setStatusForm({ ...statusForm, adminNote: e.target.value })}
                                            placeholder="e.g. We need to order the screen, ETA 2 days."
                                            rows={3}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3.5 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-800/50 flex gap-3 bg-slate-900/50 backdrop-blur-xl">
                                    <button onClick={() => setShowStatusModal(false)} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">Cancel</button>
                                    <button onClick={handleStatusUpdate} disabled={updatingStatus} className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl flex justify-center items-center shadow-lg shadow-blue-500/20 transition-all">
                                        {updatingStatus ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : 'Save & Notify'}
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
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center shrink-0 bg-slate-900/50 backdrop-blur-xl">
                                <h3 className="font-black text-2xl text-white flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl"><Plus className="w-5 h-5 text-emerald-400" /></div>
                                    New Ticket
                                </h3>
                                <button title="Close Modal" aria-label="Close Modal" onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                    <XCircle size={18} />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <form onSubmit={handleCreateTicket} className="p-6 space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-3 tracking-wider"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Customer Information</h4>
                                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Customer Name *</label>
                                                <input required type="text" value={createForm.guestName} onChange={e => setCreateForm({ ...createForm, guestName: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-colors" placeholder="e.g. John Doe" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Email Address *</label>
                                                    <input required type="email" value={createForm.guestEmail} onChange={e => setCreateForm({ ...createForm, guestEmail: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-colors" placeholder="john@example.com" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Phone Number</label>
                                                    <input type="text" value={createForm.guestPhone} onChange={e => setCreateForm({ ...createForm, guestPhone: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-colors" placeholder="+49..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-3 tracking-wider"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Device & Issue</h4>
                                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Device Model *</label>
                                                <input required type="text" value={createForm.device} onChange={e => setCreateForm({ ...createForm, device: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-colors" placeholder="e.g. iPhone 13 Pro" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Issue Description *</label>
                                                <textarea required rows={3} value={createForm.issue} onChange={e => setCreateForm({ ...createForm, issue: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none resize-none transition-colors" placeholder="Detailed description of the problem..." />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Internal Notes (Optional)</label>
                                                <textarea rows={2} value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none resize-none transition-colors" placeholder="Only visible to admins. e.g. Frame is bent." />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shrink-0">
                                <button onClick={handleCreateTicket} type="button" className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl text-lg shadow-lg shadow-emerald-900/20 transition-all flex justify-center items-center gap-2">
                                    <CheckCircle className="w-5 h-5" /> Create Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RepairTicketManager;
