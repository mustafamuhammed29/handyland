import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { api } from '../utils/api';
import {
    Loader2, Send, Clock, MessageSquare, Settings2, Search,
    SquarePen, X, Users, CheckSquare, Square, Megaphone, ChevronRight, Lock
} from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ComposeMode = 'single' | 'bulk';

interface UserGroup {
    email: string;
    name: string;
    threads: any[];
    lastActivity: string;
    hasUnread: boolean;
}

export default function MessagesManager() {
    const queryClient = useQueryClient();
    
    // --- STATE ---
    const [selectedUser, setSelectedUser] = useState<UserGroup | null>(null);
    const [selectedThread, setSelectedThread] = useState<any | null>(null);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Compose modal
    const [showCompose, setShowCompose] = useState(false);
    const [composeMode, setComposeMode] = useState<ComposeMode>('single');
    const [userSearch, setUserSearch] = useState('');
    const [selectedComposeUser, setSelectedComposeUser] = useState<any | null>(null);
    const [selectedBulkUsers, setSelectedBulkUsers] = useState<Set<string>>(new Set());
    const [composeText, setComposeText] = useState('');

    // --- SOCKET.IO FOR REAL-TIME ---
    useEffect(() => {
        const token = sessionStorage.getItem('adminSocketToken');
        if (!token) return;

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: { token }
        });

        socket.on('connect', () => {
            socket.emit('join:admin');
        });

        socket.on('admin:notification', (payload: any) => {
            if (payload.type === 'new_message') {
                queryClient.invalidateQueries({ queryKey: ['messages'] });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    // --- DATA FETCHING (REACT QUERY) ---
    const { data: messages = [], isLoading: loading } = useQuery({
        queryKey: ['messages'],
        queryFn: async () => {
            const res = await api.get('/api/messages') as any;
            return Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        }
    });

    const { data: allUsers = [], isLoading: usersLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const res = await api.get('/api/users/admin/all?limit=200') as any;
            const raw = res?.data;
            return raw?.users || raw?.data || (Array.isArray(raw) ? raw : []);
        },
        enabled: showCompose
    });

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await api.get('/api/settings') as any;
            return res?.data || res;
        }
    });

    const quickReplies = settings?.quickReplies?.length > 0 ? settings.quickReplies : [
        "Thank you for reaching out. We are looking into this right away.",
        "Could you please provide your order reference number so we can investigate?"
    ];

    // --- MUTATIONS ---
    const replyMutation = useMutation({
        mutationFn: async (payload: { id: string, message: string }) => {
            const res = await api.post(`/api/messages/${payload.id}/reply`, { message: payload.message }) as any;
            return res?.data?.data || res?.data || res;
        },
        onSuccess: (updatedThread) => {
            queryClient.setQueryData(['messages'], (old: any[]) => 
                (old || []).map(m => m._id === updatedThread._id ? updatedThread : m)
            );
            setSelectedThread(updatedThread);
            setReplyText('');
        }
    });

    const closeTicketMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.put(`/api/messages/${id}`, { status: 'closed' }) as any;
            return res?.data || res;
        },
        onSuccess: (updatedThread) => {
            queryClient.setQueryData(['messages'], (old: any[]) => 
                (old || []).map(m => m._id === updatedThread._id ? updatedThread : m)
            );
            setSelectedThread(updatedThread);
        }
    });
    
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.put(`/api/messages/${id}`, { status: 'pending' }) as any;
            return res?.data || res;
        },
        onSuccess: (updatedThread) => {
            queryClient.setQueryData(['messages'], (old: any[]) => 
                (old || []).map(m => m._id === updatedThread._id ? updatedThread : m)
            );
            setSelectedThread(updatedThread);
        }
    });

    const sendSingleMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/api/messages/admin/send', payload) as any;
            return res?.data?.data || res?.data;
        },
        onSuccess: (newMsg) => {
            if (newMsg) {
                queryClient.setQueryData(['messages'], (old: any[]) => [newMsg, ...(old || [])]);
            }
            setShowCompose(false);
        }
    });

    const sendBulkMutation = useMutation({
        mutationFn: async (payload: any) => {
            return await api.post('/api/messages/admin/bulk', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            alert('✅ Messages sent to selected customers!');
            setShowCompose(false);
        }
    });

    useEffect(() => {
        if (selectedThread) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [selectedThread?.replies?.length]);

    // Group messages by user email
    const userGroups: UserGroup[] = useMemo(() => {
        const map = new Map<string, UserGroup>();
        messages.forEach((msg: any) => {
            const key = msg.email?.toLowerCase() || msg._id;
            if (!map.has(key)) {
                map.set(key, { email: key, name: msg.name, threads: [], lastActivity: msg.createdAt, hasUnread: false });
            }
            const group = map.get(key)!;
            group.threads.push(msg);
            if (msg.status === 'unread') group.hasUnread = true;
            if (new Date(msg.createdAt) > new Date(group.lastActivity)) group.lastActivity = msg.createdAt;
        });
        map.forEach(g => g.threads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return Array.from(map.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    }, [messages]);

    const filteredGroups = useMemo(() => {
        return userGroups
            .filter(g => {
                if (filter === 'unread') return g.hasUnread;
                if (filter === 'closed') return g.threads.every(t => t.status === 'closed');
                return true;
            })
            .filter(g => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q);
            });
    }, [userGroups, filter, searchQuery]);

    // Sync selected user/thread with new messages array
    useEffect(() => {
        if (selectedThread) {
            const updated = messages.find((m: any) => m._id === selectedThread._id);
            if (updated) setSelectedThread(updated);
        }
        if (selectedUser) {
            const updatedGroup = userGroups.find(g => g.email === selectedUser.email);
            if (updatedGroup) setSelectedUser(updatedGroup);
        }
    }, [messages]);

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedThread) return;
        replyMutation.mutate({ id: selectedThread._id, message: replyText });
    };

    const handleCloseTicket = () => {
        if (!selectedThread) return;
        if (!window.confirm('Mark this ticket as resolved & close it?')) return;
        closeTicketMutation.mutate(selectedThread._id);
    };
    
    const handleSelectThread = (thread: any) => {
        setSelectedThread(thread);
        if (thread.status === 'unread') {
            markAsReadMutation.mutate(thread._id);
        }
    };

    const openComposeModal = (mode: ComposeMode = 'single') => {
        setShowCompose(true);
        setComposeMode(mode);
        setSelectedComposeUser(null);
        setSelectedBulkUsers(new Set());
        setComposeText('');
        setUserSearch('');
    };

    const handleComposeSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeText.trim()) return;
        if (composeMode === 'single') {
            if (!selectedComposeUser) return;
            sendSingleMutation.mutate({
                userId: selectedComposeUser._id,
                name: selectedComposeUser.name,
                email: selectedComposeUser.email,
                message: composeText
            });
        } else {
            const recipients = allUsers
                .filter((u: any) => selectedBulkUsers.has(u._id))
                .map((u: any) => ({ userId: u._id, name: u.name, email: u.email }));
            sendBulkMutation.mutate({ recipients, message: composeText });
        }
    };

    const toggleBulkUser = (id: string) => {
        setSelectedBulkUsers(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const filteredComposeUsers = allUsers.filter((u: any) => {
        if (!userSearch.trim()) return true;
        const q = userSearch.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    const statusBadge = (status: string) => {
        if (status === 'replied') return <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">REPLIED</span>;
        if (status === 'closed') return <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-800/80 text-slate-300 border border-slate-600 backdrop-blur-md">CLOSED</span>;
        if (status === 'unread') return <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md">UNREAD</span>;
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">PENDING</span>;
    };

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight text-white/90">Messages & Inbox</h1>
                    <p className="text-slate-400">Manage customer inquiries grouped by user in real-time.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openComposeModal('single')} title="Send to one customer"
                        className="flex items-center gap-2 bg-blue-600/90 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-sm backdrop-blur-md border border-blue-500/50">
                        <SquarePen className="w-4 h-4" /> Direct Message
                    </button>
                    <button onClick={() => openComposeModal('bulk')} title="Send bulk message"
                        className="flex items-center gap-2 bg-purple-600/90 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 text-sm backdrop-blur-md border border-purple-500/50">
                        <Megaphone className="w-4 h-4" /> Bulk Message
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* ── COLUMN 1: User List ── */}
                <div className="glass-panel border border-slate-700/50 bg-[#0B1120]/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl relative">
                    {/* Ambient glow */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-blue-500/5 blur-[80px] pointer-events-none" />
                    
                    <div className="p-4 border-b border-slate-700/50 space-y-3 relative z-10">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-9 pr-8 py-2.5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-900/80 outline-none placeholder:text-slate-500 transition-all shadow-inner" />
                            {searchQuery && (
                                <button title="Clear search" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 p-1.5 bg-[#0B1120]/60 rounded-xl border border-slate-700/50 shadow-inner">
                            {[{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'closed', label: 'Closed' }].map(f => (
                                <button key={f.id} onClick={() => setFilter(f.id)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${filter === f.id
                                        ? f.id === 'all' ? 'bg-gradient-to-r from-blue-600/40 to-indigo-600/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)] border border-blue-500/30'
                                            : f.id === 'unread' ? 'bg-gradient-to-r from-rose-500/40 to-pink-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)] border border-rose-500/30'
                                                : 'bg-gradient-to-r from-slate-600/40 to-slate-700/40 text-slate-200 shadow-sm border border-slate-500/30'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5 relative z-10">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500 h-full">
                                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium">{searchQuery ? 'No results found.' : 'Inbox is empty.'}</p>
                            </div>
                        ) : (
                            filteredGroups.map(group => (
                                <button key={group.email} onClick={() => { setSelectedUser(group); setSelectedThread(null); }}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${selectedUser?.email === group.email
                                        ? 'bg-blue-900/30 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                        : 'bg-transparent border-transparent hover:border-slate-700/50 hover:bg-slate-800/40'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0 shadow-inner">
                                                {group.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            {group.hasUnread && <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-rose-500 border-2 border-[#0B1120] shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-bold text-slate-200 text-sm truncate pr-2 group-hover:text-blue-400 transition-colors">{group.name}</div>
                                                <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">
                                                    {new Date(group.lastActivity).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-[11px] text-blue-400/80 truncate pr-2">{group.email}</div>
                                                <span className="text-[9px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md font-mono border border-slate-700/50">
                                                    {group.threads.length} {group.threads.length === 1 ? 'thread' : 'threads'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── COLUMN 2+3: Threads or Thread Detail ── */}
                <div className="lg:col-span-2 glass-panel border border-slate-700/50 bg-[#0B1120]/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl relative">
                    {/* Ambient glow */}
                    <div className="absolute top-0 right-0 w-full h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />

                    {!selectedUser ? (
                        // Empty state
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 relative z-10">
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50 shadow-inner">
                                <Users className="w-10 h-10 opacity-40 text-blue-400" />
                            </div>
                            <p className="text-sm font-medium tracking-wide">Select a conversation to view details</p>
                        </div>
                    ) : !selectedThread ? (
                        // ── Thread List for selected user ──
                        <div className="flex flex-col h-full relative z-10">
                            <div className="p-5 border-b border-slate-700/50 flex items-center gap-4 bg-slate-900/40 backdrop-blur-sm shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0 shadow-inner">
                                    {selectedUser.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-white font-bold text-lg tracking-tight">{selectedUser.name}</h2>
                                    <p className="text-blue-400/80 text-sm">{selectedUser.email}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-300 text-sm font-semibold">{selectedUser.threads.length} Tickets</div>
                                    <div className="text-slate-500 text-xs">Customer History</div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                                {selectedUser.threads.map((thread, idx) => (
                                    <button key={thread._id} onClick={() => handleSelectThread(thread)}
                                        className="w-full text-left bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 rounded-2xl p-5 transition-all duration-300 group shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden">
                                        {thread.status === 'unread' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500/70 text-xs font-mono font-bold">#{selectedUser.threads.length - idx}</span>
                                                <span className={`text-sm font-semibold line-clamp-1 ${thread.status === 'unread' ? 'text-white' : 'text-slate-300'}`}>
                                                    {thread.message.substring(0, 80)}{thread.message.length > 80 ? '…' : ''}
                                                </span>
                                            </div>
                                            {statusBadge(thread.status)}
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-600" /> {new Date(thread.createdAt).toLocaleString()}</span>
                                            <span className="flex items-center gap-2 px-2.5 py-1 bg-slate-950/50 rounded-lg border border-slate-800">
                                                <MessageSquare className="w-3.5 h-3.5 text-blue-400/70" /> 
                                                <span className="text-slate-300">{thread.replies?.length || 0}</span> messages
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors ml-1" />
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // ── Thread Detail ──
                        <div className="flex flex-col h-full relative z-10">
                            {/* Thread Header */}
                            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/60 backdrop-blur-md shadow-sm">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedThread(null)} title="Back to tickets"
                                        className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-2 rounded-xl transition-colors border border-slate-700/50">
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-100">{selectedUser.name}</h2>
                                        <p className="text-blue-400/80 text-xs">Ticket Details</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    {statusBadge(selectedThread.status)}
                                    {selectedThread.status !== 'closed' && (
                                        <button onClick={handleCloseTicket} disabled={closeTicketMutation.isPending}
                                            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors border border-slate-700 hover:border-rose-500/30 flex items-center gap-1.5">
                                            {closeTicketMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col bg-[#0B1120]/40">
                                {/* Original message */}
                                <div className={`max-w-[85%] ${selectedThread.initiatedByAdmin ? 'self-end' : 'self-start'}`}>
                                    <div className={`flex items-center gap-2 mb-1.5 ${selectedThread.initiatedByAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className="text-[10px] text-slate-500 font-medium">{new Date(selectedThread.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</div>
                                        <span className={`text-xs font-bold ${selectedThread.initiatedByAdmin ? 'text-blue-400' : 'text-slate-300'}`}>
                                            {selectedThread.initiatedByAdmin ? 'Support Team' : 'Customer'}
                                        </span>
                                    </div>
                                    <div className={selectedThread.initiatedByAdmin
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-[0_4px_15px_rgba(59,130,246,0.2)] border border-blue-500/20'
                                        : 'bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm p-4 border border-slate-700/50 shadow-sm backdrop-blur-sm'}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedThread.message}</p>
                                    </div>
                                </div>

                                {/* Replies */}
                                {selectedThread.replies?.map((reply: any) => (
                                    <div key={reply._id} className={`max-w-[85%] ${reply.isAdmin ? 'self-end' : 'self-start'}`}>
                                        <div className={`flex items-center gap-2 mb-1.5 ${reply.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <span className={`text-xs font-bold ${reply.isAdmin ? 'text-blue-400' : 'text-slate-300'}`}>
                                                {reply.isAdmin ? 'You' : 'Customer'}
                                            </span>
                                            <div className="text-[10px] text-slate-500 font-medium">{new Date(reply.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</div>
                                        </div>
                                        <div className={reply.isAdmin
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-[0_4px_15px_rgba(59,130,246,0.2)] border border-blue-500/20'
                                            : 'bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700/50 p-4 shadow-sm backdrop-blur-sm'}>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.message}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>

                            {/* Reply area */}
                            {selectedThread.status !== 'closed' ? (
                                <div className="border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex flex-col p-3">
                                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-1 items-center px-2">
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center shrink-0 mr-1 uppercase tracking-wider">
                                            <Settings2 className="w-3 h-3 mr-1" /> Quick:
                                        </span>
                                        {quickReplies.map((resp: string, idx: number) => (
                                            <button key={idx} onClick={() => setReplyText(resp)}
                                                className="shrink-0 px-3.5 py-1.5 bg-slate-800/50 hover:bg-blue-900/30 hover:text-blue-300 border border-slate-700/50 rounded-full text-xs font-medium text-slate-300 transition-colors whitespace-nowrap shadow-sm hover:border-blue-500/30">
                                                {resp.length > 40 ? resp.substring(0, 40) + '…' : resp}
                                            </button>
                                        ))}
                                    </div>
                                    <form onSubmit={handleReply} className="flex gap-3 px-2 pb-1 relative">
                                        <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-2xl pl-5 pr-14 py-4 text-white focus:border-blue-500/60 focus:bg-slate-900/80 outline-none transition-all text-sm placeholder:text-slate-500 shadow-inner" />
                                        <button disabled={replyMutation.isPending || !replyText.trim()} title="Send reply"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:hover:bg-blue-600 transition-all flex-shrink-0 shadow-lg shadow-blue-900/30">
                                            {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-5 border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center gap-2 text-slate-400 font-medium text-sm">
                                    <Lock className="w-4 h-4" /> This ticket was marked as resolved and closed.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Compose Modal (Glassmorphism) ── */}
            {showCompose && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060B19]/80 backdrop-blur-md">
                    <div className="glass-panel bg-[#0B1120]/90 border border-slate-700/60 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" style={{ maxHeight: '85vh' }}>
                        <div className="px-6 py-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px]" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`p-2 rounded-xl ${composeMode === 'single' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {composeMode === 'single' ? <SquarePen className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                                </div>
                                <h2 className="text-white font-bold text-lg tracking-tight">{composeMode === 'single' ? 'Direct Message' : 'Bulk Broadcast'}</h2>
                                {composeMode === 'bulk' && selectedBulkUsers.size > 0 && (
                                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-1 rounded-md border border-purple-500/30 ml-2">{selectedBulkUsers.size} selected</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="flex bg-slate-950/50 rounded-lg p-1 text-xs font-bold border border-slate-800">
                                    <button onClick={() => setComposeMode('single')} className={`px-4 py-1.5 rounded-md transition-all ${composeMode === 'single' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Single</button>
                                    <button onClick={() => setComposeMode('bulk')} className={`px-4 py-1.5 rounded-md transition-all ${composeMode === 'bulk' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Bulk</button>
                                </div>
                                <button title="Close" onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 p-2 rounded-xl transition-colors border border-slate-700/50">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5 relative z-10">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                    placeholder="Search by customer name or email..." autoFocus
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-blue-500/50 focus:bg-slate-900/80 outline-none placeholder:text-slate-500 shadow-inner transition-all" />
                            </div>

                            {composeMode === 'bulk' && filteredComposeUsers.length > 0 && (
                                <button onClick={() => selectedBulkUsers.size === filteredComposeUsers.length
                                    ? setSelectedBulkUsers(new Set())
                                    : setSelectedBulkUsers(new Set(filteredComposeUsers.map((u: any) => u._id)))}
                                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-300 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 transition-all shadow-sm">
                                    {selectedBulkUsers.size === filteredComposeUsers.length ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                                    {selectedBulkUsers.size === filteredComposeUsers.length ? 'Deselect All Customers' : `Select All Customers (${filteredComposeUsers.length})`}
                                </button>
                            )}

                            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1.5 rounded-xl border border-slate-700/50 bg-slate-950/40 p-2 shadow-inner">
                                {usersLoading ? (
                                    <div className="flex flex-col items-center py-8 gap-3"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /><p className="text-slate-500 text-xs font-medium">Loading customers...</p></div>
                                ) : filteredComposeUsers.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm font-medium">No customers found matching search.</div>
                                ) : (
                                    filteredComposeUsers.map((u: any) => {
                                        const singleSel = composeMode === 'single' && selectedComposeUser?._id === u._id;
                                        const bulkSel = composeMode === 'bulk' && selectedBulkUsers.has(u._id);
                                        return (
                                            <button key={u._id}
                                                onClick={() => composeMode === 'single' ? setSelectedComposeUser(singleSel ? null : u) : toggleBulkUser(u._id)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${singleSel || bulkSel
                                                    ? composeMode === 'single' ? 'border-blue-500/40 bg-blue-500/10 shadow-sm' : 'border-purple-500/40 bg-purple-500/10 shadow-sm'
                                                    : 'border-transparent hover:bg-slate-800/60'}`}
                                            >
                                                {composeMode === 'bulk' && (bulkSel ? <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />)}
                                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0 shadow-inner">
                                                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-slate-200 text-sm font-bold truncate">{u.name}</div>
                                                    <div className="text-slate-500 text-xs truncate">{u.email}</div>
                                                </div>
                                                {u.role === 'admin' && <span className="ml-auto text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold flex-shrink-0 tracking-wider">ADMIN</span>}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {((composeMode === 'single' && selectedComposeUser) || composeMode === 'bulk') && (
                                <form onSubmit={handleComposeSend} className="space-y-4 border-t border-slate-700/50 pt-5">
                                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border shadow-sm ${composeMode === 'single' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-purple-500/5 border-purple-500/20'}`}>
                                        <span className="text-slate-400 font-medium">To:</span>
                                        <span className={`font-bold ${composeMode === 'single' ? 'text-blue-400' : 'text-purple-400'}`}>
                                            {composeMode === 'single' ? selectedComposeUser?.name : `${selectedBulkUsers.size} customer${selectedBulkUsers.size !== 1 ? 's' : ''}`}
                                        </span>
                                    </div>
                                    <textarea value={composeText} onChange={e => setComposeText(e.target.value)}
                                        placeholder="Write your message here..." rows={4} required
                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-white text-sm focus:border-blue-500/50 outline-none resize-none placeholder:text-slate-500 shadow-inner transition-all" />
                                    <button type="submit"
                                        disabled={sendSingleMutation.isPending || sendBulkMutation.isPending || !composeText.trim() || (composeMode === 'single' && !selectedComposeUser) || (composeMode === 'bulk' && selectedBulkUsers.size === 0)}
                                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${composeMode === 'single' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'} text-white`}>
                                        {sendSingleMutation.isPending || sendBulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {composeMode === 'single' ? 'Send Message Now' : `Broadcast to ${selectedBulkUsers.size} Customer${selectedBulkUsers.size !== 1 ? 's' : ''}`}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
