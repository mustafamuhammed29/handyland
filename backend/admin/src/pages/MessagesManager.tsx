import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { formatDate, formatDateTime } from '../utils/formatDate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { api } from '../utils/api';
import {
    Loader2, Send, Clock, MessageSquare, Search,
    SquarePen, X, Users, CheckSquare, Megaphone, Lock, 
    AlertCircle, Info, ChevronDown, Flag, UserPlus, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

type ComposeMode = 'single' | 'bulk';
type Priority = 'low' | 'normal' | 'high';

interface UserGroup {
    email: string;
    name: string;
    threads: any[];
    lastActivity: string;
    hasUnread: boolean;
    assignedToMe: boolean;
    hasHighPriority: boolean;
}

export default function MessagesManager() {
    const queryClient = useQueryClient();
    
    // --- STATE ---
    const [selectedUser, setSelectedUser] = useState<UserGroup | null>(null);
    const { confirm } = useConfirm();
    const [selectedThread, setSelectedThread] = useState<any | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [filter, setFilter] = useState('all'); // all, assigned, unassigned, unread, closed
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Current logged in admin info
    const adminUserStr = localStorage.getItem('userInfo');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isAdmin = adminUser?.role === 'admin';
    const myId = adminUser?._id || adminUser?.id;

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
            const rawMessages = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
            return rawMessages.map((m: any) => ({
                ...m,
                replies: m.replies || m.message_replies || []
            }));
        }
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const res = await api.get('/api/users/admin/all?limit=200') as any;
            const raw = res?.data;
            return raw?.users || raw?.data || (Array.isArray(raw) ? raw : []);
        },
        // We always want to fetch users so we can resolve assigned_to names
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

    const adminsAndStaff = useMemo(() => {
        return allUsers.filter((u: any) => u.role === 'admin' || u.role === 'staff');
    }, [allUsers]);

    // --- MUTATIONS ---
    const replyMutation = useMutation({
        mutationFn: async (payload: { id: string, message: string, is_internal_note: boolean }) => {
            const res = await api.post(`/api/messages/${payload.id}/reply`, { 
                message: payload.message,
                is_internal_note: payload.is_internal_note
            }) as any;
            return res?.data?.data || res?.data || res;
        },
        onSuccess: (updatedThread) => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            setSelectedThread((prev: any) => ({ ...prev, replies: [...(prev?.replies || []), updatedThread] }));
            setReplyText('');
            setIsInternalNote(false);
        }
    });

    const updateTicketMutation = useMutation({
        mutationFn: async (payload: { id: string, status?: string, assigned_to?: string | null, priority?: string }) => {
            const res = await api.put(`/api/messages/${payload.id}`, payload) as any;
            return res?.data?.data || res?.data || res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            toast.success('Ticket updated successfully!');
        }
    });

    const sendSingleMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/api/messages/admin/send', payload) as any;
            return res?.data?.data || res?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            setShowCompose(false);
            toast.success('Message sent!');
        }
    });

    const sendBulkMutation = useMutation({
        mutationFn: async (payload: any) => {
            return await api.post('/api/messages/admin/bulk', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            toast.success('Messages sent to selected customers!');
            setShowCompose(false);
        }
    });

    const toggleBulkUser = (id: string) => {
        setSelectedBulkUsers(prev => { 
            const n = new Set(prev); 
            n.has(id) ? n.delete(id) : n.add(id); 
            return n; 
        });
    };

    useEffect(() => {
        if (selectedThread) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [selectedThread?.replies?.length]);

    // Sync selected user/thread with new messages array
    useEffect(() => {
        if (selectedThread) {
            const updated = messages.find((m: any) => m._id === selectedThread._id);
            if (updated) setSelectedThread(updated);
        }
        if (selectedUser) {
            const map = new Map<string, UserGroup>();
            messages.forEach((msg: any) => {
                const key = msg.email?.toLowerCase() || msg._id;
                if (key === selectedUser.email) {
                    if (!map.has(key)) map.set(key, { email: key, name: msg.name, threads: [], lastActivity: msg.createdAt, hasUnread: false, assignedToMe: false, hasHighPriority: false });
                    const g = map.get(key)!;
                    g.threads.push(msg);
                }
            });
            const updatedGroup = map.get(selectedUser.email);
            if (updatedGroup) setSelectedUser(updatedGroup);
        }
    }, [messages]);

    // Group messages by user email
    const userGroups: UserGroup[] = useMemo(() => {
        const map = new Map<string, UserGroup>();
        messages.forEach((msg: any) => {
            const key = msg.email?.toLowerCase() || msg._id;
            if (!map.has(key)) {
                map.set(key, { 
                    email: key, 
                    name: msg.name, 
                    threads: [], 
                    lastActivity: msg.createdAt, 
                    hasUnread: false,
                    assignedToMe: false,
                    hasHighPriority: false
                });
            }
            const group = map.get(key)!;
            group.threads.push(msg);
            if (msg.status === 'unread') group.hasUnread = true;
            if (msg.priority === 'high') group.hasHighPriority = true;
            if (msg.assigned_to === myId) group.assignedToMe = true;
            if (new Date(msg.createdAt) > new Date(group.lastActivity)) group.lastActivity = msg.createdAt;
        });
        map.forEach(g => g.threads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return Array.from(map.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    }, [messages, myId]);

    const filteredGroups = useMemo(() => {
        return userGroups
            .filter(g => {
                if (filter === 'unread') return g.hasUnread;
                if (filter === 'closed') return g.threads.every(t => t.status === 'closed');
                if (filter === 'assigned') return g.assignedToMe;
                if (filter === 'unassigned') return g.threads.some(t => !t.assigned_to);
                return true;
            })
            .filter(g => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q);
            });
    }, [userGroups, filter, searchQuery]);

    // Handle Deep Linking
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const threadId = queryParams.get('id');
        if (threadId && messages.length > 0 && userGroups.length > 0) {
            const foundThread = messages.find((m: any) => m._id === threadId);
            if (foundThread) {
                setSelectedThread(foundThread);
                const userKey = foundThread.email?.toLowerCase() || foundThread._id;
                const group = userGroups.find(g => g.email === userKey);
                if (group) setSelectedUser(group);
            }
            // Clean URL
            window.history.replaceState({}, '', '/messages');
        }
    }, [messages, userGroups]);

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedThread) return;
        replyMutation.mutate({ id: selectedThread._id, message: replyText, is_internal_note: isInternalNote });
    };

    const handleCloseTicket = async () => {
        if (!selectedThread) return;
        const ok = await confirm({ message: 'Mark this ticket as resolved & close it?', variant: "danger" });
        if (!ok) return;
        updateTicketMutation.mutate({ id: selectedThread._id, status: 'closed' });
    };

    const handleAssign = (userId: string) => {
        if (!selectedThread) return;
        updateTicketMutation.mutate({ id: selectedThread._id, assigned_to: userId || null });
    };

    const handlePriorityChange = (priority: Priority) => {
        if (!selectedThread) return;
        updateTicketMutation.mutate({ id: selectedThread._id, priority });
    };
    
    const handleSelectThread = (thread: any) => {
        setSelectedThread(thread);
        if (thread.status === 'unread') {
            updateTicketMutation.mutate({ id: thread._id, status: 'read' });
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

    const getPriorityColor = (priority: string) => {
        switch(priority) {
            case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'low': return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch(priority) {
            case 'high': return <AlertCircle className="w-3.5 h-3.5" />;
            case 'low': return <ChevronDown className="w-3.5 h-3.5" />;
            default: return <Flag className="w-3.5 h-3.5" />;
        }
    };

    const statusBadge = (status: string) => {
        if (status === 'replied') return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">REPLIED</span>;
        if (status === 'closed') return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-600">CLOSED</span>;
        if (status === 'unread') return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">UNREAD</span>;
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">PENDING</span>;
    };

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
            {/* ── HEADER ── */}
            <div className="flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Tickets & Messages</h1>
                    <p className="text-slate-400 text-sm">Advanced Ticketing System & Customer Support Hub</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openComposeModal('single')} title="Send to one customer"
                        className="flex items-center gap-2 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-sm border border-blue-400/50">
                        <SquarePen className="w-4 h-4" /> Direct Message
                    </button>
                    {isAdmin && (
                        <button onClick={() => openComposeModal('bulk')} title="Send bulk message"
                            className="flex items-center gap-2 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 text-sm border border-purple-400/50">
                            <Megaphone className="w-4 h-4" /> Bulk Message
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                
                {/* ── COLUMN 1: FILTERS & USERS (Span 3) ── */}
                <div className="lg:col-span-3 glass-panel border border-slate-700/50 bg-[#0B1120]/80 rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl relative">
                    <div className="absolute top-0 left-0 w-full h-32 bg-blue-500/10 blur-[80px] pointer-events-none" />
                    
                    <div className="p-5 border-b border-slate-700/50 space-y-4 relative z-10">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search users or emails..."
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-8 py-2.5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-900/80 outline-none placeholder:text-slate-500 transition-all shadow-inner" />
                            {searchQuery && (
                                <button title="Clear search" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        
                        {/* Filter Chips */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'All' }, 
                                { id: 'assigned', label: 'Assigned to Me' }, 
                                { id: 'unassigned', label: 'Unassigned' }, 
                                { id: 'unread', label: 'Unread' }
                            ].map(f => (
                                <button key={f.id} onClick={() => setFilter(f.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${filter === f.id
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                        : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 relative z-10">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500 h-full">
                                <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-sm font-medium">Inbox is empty.</p>
                            </div>
                        ) : (
                            filteredGroups.map(group => (
                                <button key={group.email} onClick={() => { setSelectedUser(group); setSelectedThread(null); }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden ${selectedUser?.email === group.email
                                        ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/20 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                        : 'bg-transparent border-transparent hover:border-slate-700/50 hover:bg-slate-800/40'}`}
                                >
                                    {group.hasUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner
                                                ${selectedUser?.email === group.email ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'}
                                            `}>
                                                {group.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className={`font-bold text-sm truncate pr-2 transition-colors ${selectedUser?.email === group.email ? 'text-white' : 'text-slate-200'}`}>
                                                    {group.name}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-[11px] text-slate-400 truncate pr-2">{group.email}</div>
                                                <span className="text-[10px] text-slate-500 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800 font-medium">
                                                    {group.threads.length} Ticket{group.threads.length !== 1 && 's'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Badges row */}
                                    <div className="flex gap-1.5 mt-2 ml-13 pl-13">
                                        {group.hasHighPriority && (
                                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                                <AlertCircle className="w-2.5 h-2.5" /> HIGH
                                            </span>
                                        )}
                                        {group.assignedToMe && (
                                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                ASSIGNED TO ME
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── COLUMN 2: TICKETS LIST (Span 4) ── */}
                <div className="lg:col-span-4 glass-panel border border-slate-700/50 bg-[#0B1120]/80 rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl relative">
                    {!selectedUser ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <Users className="w-12 h-12 opacity-20 text-slate-400" />
                            <p className="text-sm font-medium">Select a user to view their tickets</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-5 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
                                <h3 className="text-white font-bold tracking-tight mb-1">Customer Tickets</h3>
                                <div className="text-xs text-slate-400">Tickets for <span className="text-blue-400 font-semibold">{selectedUser.name}</span></div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                {selectedUser.threads.map((thread) => {
                                    const isSelected = selectedThread?._id === thread._id;
                                    const assignedToName = thread.assigned_to 
                                        ? adminsAndStaff.find((u: any) => u._id === thread.assigned_to || u.id === thread.assigned_to)?.name || 'Staff'
                                        : 'Unassigned';

                                    return (
                                        <button key={thread._id} onClick={() => handleSelectThread(thread)}
                                            className={`w-full text-left rounded-2xl p-4 transition-all duration-300 relative overflow-hidden border
                                                ${isSelected 
                                                    ? 'bg-blue-900/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                                    : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-700/50 hover:border-slate-500/40 shadow-sm'
                                                }`}>
                                            
                                            {thread.status === 'unread' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
                                            
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${getPriorityColor(thread.priority)}`}>
                                                        {getPriorityIcon(thread.priority)} {thread.priority?.toUpperCase() || 'NORMAL'}
                                                    </span>
                                                    <span className="text-slate-500 text-[10px] font-mono">#{thread._id.substring(0,6)}</span>
                                                </div>
                                                {statusBadge(thread.status)}
                                            </div>

                                            <div className={`text-sm font-semibold line-clamp-2 mb-3 leading-snug ${thread.status === 'unread' ? 'text-white' : 'text-slate-300'}`}>
                                                {thread.message}
                                            </div>

                                            <div className="flex justify-between items-center mt-auto border-t border-slate-700/30 pt-2">
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <UserPlus className="w-3 h-3" />
                                                    <span className={thread.assigned_to === myId ? 'text-purple-400 font-bold' : ''}>{assignedToName}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-600" /> {formatDate(thread.createdAt)}</span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3 text-slate-600" /> {thread.replies?.length || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ── COLUMN 3: TICKET DETAIL & REPLY (Span 5) ── */}
                <div className="lg:col-span-5 glass-panel border border-slate-700/50 bg-[#0B1120]/80 rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl relative">
                    {!selectedThread ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <FileText className="w-16 h-16 opacity-10 text-slate-400" />
                            <p className="text-sm font-medium">Select a ticket to view details and reply</p>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar (Admins can assign, change priority) */}
                            <div className="p-4 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex justify-between items-center z-20 shadow-sm relative">
                                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
                                <div className="flex flex-col">
                                    <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                        Ticket #{selectedThread._id.substring(0,8)}
                                        {statusBadge(selectedThread.status)}
                                    </h2>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> {formatDateTime(selectedThread.createdAt)}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 items-center">
                                    {isAdmin && (
                                        <>
                                            <select 
                                                value={selectedThread.priority || 'normal'}
                                                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                                                className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 shadow-inner"
                                            >
                                                <option value="low">Low Priority</option>
                                                <option value="normal">Normal Priority</option>
                                                <option value="high">High Priority</option>
                                            </select>

                                            <select 
                                                value={selectedThread.assigned_to || ''}
                                                onChange={(e) => handleAssign(e.target.value)}
                                                className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 shadow-inner"
                                            >
                                                <option value="">Unassigned</option>
                                                {adminsAndStaff.map((u: any) => (
                                                    <option key={u._id || u.id} value={u._id || u.id}>
                                                        Assign to: {u.name} {u.role === 'admin' ? '(Admin)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    )}

                                    {selectedThread.status !== 'closed' && (
                                        <button onClick={handleCloseTicket} disabled={updateTicketMutation.isPending}
                                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border border-emerald-500/30 flex items-center gap-1.5 ml-2 shadow-sm">
                                            {updateTicketMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Conversation Thread */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col bg-[#0B1120]/40">
                                {/* Original message */}
                                <div className={`max-w-[85%] ${selectedThread.initiatedByAdmin ? 'self-end' : 'self-start'}`}>
                                    <div className={`flex items-center gap-2 mb-1.5 ${selectedThread.initiatedByAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <span className={`text-xs font-bold ${selectedThread.initiatedByAdmin ? 'text-blue-400' : 'text-slate-300'}`}>
                                            {selectedThread.initiatedByAdmin ? 'Support Team' : selectedUser?.name || 'Customer'}
                                        </span>
                                        <div className="text-[10px] text-slate-500 font-medium">{formatDateTime(selectedThread.createdAt)}</div>
                                    </div>
                                    <div className={selectedThread.initiatedByAdmin
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-md'
                                        : 'bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm p-4 border border-slate-700/50 shadow-sm backdrop-blur-sm'}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedThread.message}</p>
                                    </div>
                                </div>

                                {/* Replies */}
                                {selectedThread.replies?.map((reply: any) => {
                                    const isInternal = reply.is_internal_note;
                                    const replierName = reply.is_admin ? (reply.user_id === myId ? 'You' : 'Staff') : (selectedUser?.name || 'Customer');
                                    const isMine = reply.is_admin;

                                    return (
                                        <div key={reply._id || reply.id} className={`max-w-[85%] ${isMine ? 'self-end' : 'self-start'} ${isInternal ? 'opacity-90 hover:opacity-100 transition-opacity' : ''}`}>
                                            <div className={`flex items-center gap-2 mb-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                {isInternal && <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">INTERNAL NOTE</span>}
                                                <span className={`text-xs font-bold ${isMine ? (isInternal ? 'text-amber-400' : 'text-blue-400') : 'text-slate-300'}`}>
                                                    {replierName}
                                                </span>
                                                <div className="text-[10px] text-slate-500 font-medium">{formatDateTime(reply.createdAt)}</div>
                                            </div>
                                            
                                            <div className={`rounded-2xl p-4 shadow-md text-sm leading-relaxed whitespace-pre-wrap ${
                                                isMine 
                                                    ? (isInternal 
                                                        ? 'bg-amber-500/10 text-amber-100 border border-amber-500/30 rounded-tr-sm backdrop-blur-md' // Internal Note Style
                                                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm border border-blue-500/20') // Normal Reply Style
                                                    : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/50 backdrop-blur-sm' // Customer Reply Style
                                            }`}>
                                                {reply.message}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>

                            {/* Reply Box */}
                            {selectedThread.status !== 'closed' ? (
                                <div className="border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-xl flex flex-col p-4 relative z-20">
                                    <div className="flex justify-between items-center mb-3">
                                        {/* Internal Note Toggle */}
                                        <button 
                                            type="button" 
                                            onClick={() => setIsInternalNote(!isInternalNote)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                isInternalNote 
                                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                                            }`}
                                        >
                                            <Info className="w-3.5 h-3.5" />
                                            {isInternalNote ? 'Internal Note Mode (Hidden from Customer)' : 'Public Reply'}
                                        </button>

                                        {/* Quick Replies */}
                                        <div className="flex gap-2 overflow-x-auto custom-scrollbar items-center justify-end max-w-[50%]">
                                            {!isInternalNote && quickReplies.map((resp: string, idx: number) => (
                                                <button key={idx} onClick={() => setReplyText(resp)}
                                                    className="shrink-0 px-3 py-1 bg-slate-800/50 hover:bg-blue-900/30 hover:text-blue-300 border border-slate-700/50 rounded-lg text-[10px] font-medium text-slate-300 transition-colors whitespace-nowrap shadow-sm hover:border-blue-500/30">
                                                    {resp.length > 25 ? resp.substring(0, 25) + '…' : resp}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <form onSubmit={handleReply} className="flex gap-3 relative">
                                        <textarea 
                                            value={replyText} 
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder={isInternalNote ? "Write a private note for the team..." : "Write a reply to the customer..."}
                                            rows={3}
                                            className={`flex-1 bg-slate-950/60 border rounded-2xl pl-4 pr-16 py-3 text-white focus:outline-none transition-all text-sm shadow-inner resize-none
                                                ${isInternalNote 
                                                    ? 'border-amber-500/50 focus:border-amber-400 focus:bg-amber-900/10 placeholder:text-amber-700/50' 
                                                    : 'border-slate-700/50 focus:border-blue-500/60 focus:bg-slate-900/80 placeholder:text-slate-500'
                                                }`} 
                                        />
                                        <button disabled={replyMutation.isPending || !replyText.trim()} title="Send"
                                            className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0 shadow-lg
                                                ${isInternalNote 
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-900/30' 
                                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                                                }`}>
                                            {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-5 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center gap-2 text-slate-400 font-medium text-sm">
                                    <Lock className="w-4 h-4" /> This ticket is closed. Reopen to reply.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Compose Modal (Retained with glassmorphism) ── */}
            {/* (Omitted to keep file size reasonable, it is already implemented well, I will keep it same but ensure its there) */}
            {showCompose && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060B19]/80 backdrop-blur-md">
                    <div className="glass-panel bg-[#0B1120]/95 border border-slate-700/60 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/60">
                            <h2 className="text-white font-bold text-lg">{composeMode === 'single' ? 'Direct Message' : 'Bulk Broadcast'}</h2>
                            <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                    placeholder="Search customer..." autoFocus
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none" />
                            </div>
                            
                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 border border-slate-700/50 rounded-xl p-2 bg-slate-950/30">
                                {allUsers.filter((u:any) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).map((u: any) => (
                                    <button key={u._id} onClick={() => composeMode === 'single' ? setSelectedComposeUser(selectedComposeUser?._id === u._id ? null : u) : toggleBulkUser(u._id)}
                                        className={`w-full text-left p-2.5 rounded-lg border flex items-center gap-3 ${
                                            (composeMode === 'single' && selectedComposeUser?._id === u._id) || (composeMode === 'bulk' && selectedBulkUsers.has(u._id))
                                                ? 'border-blue-500/40 bg-blue-500/10' : 'border-transparent hover:bg-slate-800/60'
                                        }`}>
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">{u.name?.charAt(0)}</div>
                                        <div>
                                            <div className="text-slate-200 text-sm font-bold">{u.name}</div>
                                            <div className="text-slate-500 text-xs">{u.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <textarea value={composeText} onChange={e => setComposeText(e.target.value)}
                                placeholder="Message..." rows={4}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-white text-sm focus:border-blue-500/50 outline-none resize-none" />
                            
                            <button onClick={handleComposeSend}
                                disabled={sendSingleMutation.isPending || sendBulkMutation.isPending || !composeText.trim()}
                                className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
