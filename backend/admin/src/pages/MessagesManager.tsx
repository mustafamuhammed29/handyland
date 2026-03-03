import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import {
    Loader2, Send, Clock, MessageSquare, Settings2, Search,
    SquarePen, X, Users, CheckSquare, Square, Megaphone, ChevronRight, Lock
} from 'lucide-react';

type ComposeMode = 'single' | 'bulk';

interface UserGroup {
    email: string;
    name: string;
    threads: any[];
    lastActivity: string;
    hasUnread: boolean;
}

export default function MessagesManager() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserGroup | null>(null);
    const [selectedThread, setSelectedThread] = useState<any | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [quickReplies, setQuickReplies] = useState<string[]>([
        "Thank you for reaching out. We are looking into this right away.",
        "Could you please provide your order reference number so we can investigate?"
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Compose modal
    const [showCompose, setShowCompose] = useState(false);
    const [composeMode, setComposeMode] = useState<ComposeMode>('single');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [selectedComposeUser, setSelectedComposeUser] = useState<any | null>(null);
    const [selectedBulkUsers, setSelectedBulkUsers] = useState<Set<string>>(new Set());
    const [composeText, setComposeText] = useState('');
    const [composeSending, setComposeSending] = useState(false);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/api/messages`) as any;
            const raw = res?.data;
            const msgs = Array.isArray(raw) ? raw : (raw?.data || []);
            setMessages(msgs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/api/settings') as any;
            const data = res?.data || res;
            if (data?.quickReplies?.length > 0) setQuickReplies(data.quickReplies);
        } catch { /* silent */ }
    };

    const fetchAllUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await api.get('/api/users/admin/all?limit=200') as any;
            const raw = res?.data;
            const userList = raw?.users || raw?.data || (Array.isArray(raw) ? raw : []);
            setAllUsers(userList);
        } catch (err) { console.error('Failed to load users', err); }
        finally { setUsersLoading(false); }
    };

    useEffect(() => { fetchMessages(); fetchSettings(); }, []);

    useEffect(() => {
        if (selectedThread) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [selectedThread]);

    // Group messages by user email
    const userGroups: UserGroup[] = React.useMemo(() => {
        const map = new Map<string, UserGroup>();
        messages.forEach(msg => {
            const key = msg.email?.toLowerCase() || msg._id;
            if (!map.has(key)) {
                map.set(key, { email: key, name: msg.name, threads: [], lastActivity: msg.createdAt, hasUnread: false });
            }
            const group = map.get(key)!;
            group.threads.push(msg);
            if (msg.status === 'unread') group.hasUnread = true;
            if (new Date(msg.createdAt) > new Date(group.lastActivity)) group.lastActivity = msg.createdAt;
        });
        // Sort threads within each group newest first
        map.forEach(g => g.threads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        // Sort groups by last activity
        return Array.from(map.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    }, [messages]);

    const filteredGroups = userGroups
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

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedThread) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/api/messages/${selectedThread._id}/reply`, { message: replyText }) as any;
            const updated = res?.data?.data || res?.data || res;
            setSelectedThread(updated);
            // update in messages array
            setMessages(prev => prev.map(m => m._id === selectedThread._id ? updated : m));
            setReplyText('');
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    const handleCloseTicket = async () => {
        if (!selectedThread) return;
        if (!window.confirm('Mark this ticket as resolved & close it?')) return;
        try {
            const res = await api.put(`/api/messages/${selectedThread._id}`, { status: 'closed' }) as any;
            const updated = res?.data || res;
            setSelectedThread(updated);
            setMessages(prev => prev.map(m => m._id === selectedThread._id ? updated : m));
        } catch { alert('Failed to close ticket'); }
    };

    const openComposeModal = (mode: ComposeMode = 'single') => {
        setShowCompose(true);
        setComposeMode(mode);
        setSelectedComposeUser(null);
        setSelectedBulkUsers(new Set());
        setComposeText('');
        setUserSearch('');
        fetchAllUsers();
    };

    const handleComposeSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeText.trim()) return;
        setComposeSending(true);
        try {
            if (composeMode === 'single') {
                if (!selectedComposeUser) return;
                const res = await api.post('/api/messages/admin/send', {
                    userId: selectedComposeUser._id,
                    name: selectedComposeUser.name,
                    email: selectedComposeUser.email,
                    message: composeText
                }) as any;
                const newMsg = res?.data?.data || res?.data;
                if (newMsg) setMessages(prev => [newMsg, ...prev]);
            } else {
                const recipients = allUsers
                    .filter(u => selectedBulkUsers.has(u._id))
                    .map(u => ({ userId: u._id, name: u.name, email: u.email }));
                await api.post('/api/messages/admin/bulk', { recipients, message: composeText });
                await fetchMessages();
                alert(`✅ Message sent to ${recipients.length} customers!`);
            }
            setShowCompose(false);
        } catch { alert('Failed to send message'); }
        finally { setComposeSending(false); }
    };

    const toggleBulkUser = (id: string) => {
        setSelectedBulkUsers(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const filteredComposeUsers = allUsers.filter((u: any) => {
        if (!userSearch.trim()) return true;
        const q = userSearch.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    // When messages change, refresh selectedThread and selectedUser
    useEffect(() => {
        if (selectedThread) {
            const updated = messages.find(m => m._id === selectedThread._id);
            if (updated) setSelectedThread(updated);
        }
        if (selectedUser) {
            const updatedGroup = userGroups.find(g => g.email === selectedUser.email);
            if (updatedGroup) setSelectedUser(updatedGroup);
        }
    }, [messages]);

    const statusBadge = (status: string) => {
        if (status === 'replied') return <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">REPLIED</span>;
        if (status === 'closed') return <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-700 text-slate-400 border border-slate-600">CLOSED</span>;
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">PENDING</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Messages & Inbox</h1>
                    <p className="text-slate-400">Manage customer inquiries grouped by user.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openComposeModal('single')} title="Send to one customer"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20 text-sm">
                        <SquarePen className="w-4 h-4" /> Send to Customer
                    </button>
                    <button onClick={() => openComposeModal('bulk')} title="Send bulk message"
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-purple-900/20 text-sm">
                        <Megaphone className="w-4 h-4" /> Bulk Message
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '720px' }}>
                {/* ── COLUMN 1: User List ── */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-800 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-white text-sm focus:border-blue-500 outline-none placeholder:text-slate-500 transition-colors" />
                            {searchQuery && (
                                <button title="Clear search" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1.5">
                            {[{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'closed', label: 'Closed' }].map(f => (
                                <button key={f.id} onClick={() => setFilter(f.id)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.id
                                        ? f.id === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                            : f.id === 'unread' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-slate-800 text-slate-300 border border-slate-600'
                                        : 'text-slate-500 hover:bg-slate-800 border border-transparent'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="text-center p-8 text-slate-500">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{searchQuery ? 'No results found.' : 'No messages found.'}</p>
                            </div>
                        ) : (
                            filteredGroups.map(group => (
                                <button key={group.email} onClick={() => { setSelectedUser(group); setSelectedThread(null); }}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${selectedUser?.email === group.email
                                        ? 'bg-blue-900/20 border-blue-800/50 ring-1 ring-blue-500'
                                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                                            {group.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className="font-bold text-white text-sm truncate">{group.name}</div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {group.hasUnread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono">{group.threads.length}</span>
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-blue-400/70 truncate mb-1">{group.email}</div>
                                            <div className="text-[11px] text-slate-500">{new Date(group.lastActivity).toLocaleDateString()}</div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── COLUMN 2+3: Threads or Thread Detail ── */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    {!selectedUser ? (
                        // Empty state
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3">
                            <Users className="w-14 h-14 opacity-20" />
                            <p className="text-sm">Select a user to view their conversations</p>
                        </div>
                    ) : !selectedThread ? (
                        // ── Thread List for selected user ──
                        <>
                            <div className="p-5 border-b border-slate-800 flex items-center gap-4 bg-slate-950/40">
                                <div className="w-11 h-11 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg flex-shrink-0">
                                    {selectedUser.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-white font-bold text-base">{selectedUser.name}</h2>
                                    <p className="text-blue-400 text-xs">{selectedUser.email}</p>
                                </div>
                                <span className="text-slate-400 text-sm">{selectedUser.threads.length} conversation{selectedUser.threads.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                {selectedUser.threads.map((thread, idx) => (
                                    <button key={thread._id} onClick={() => setSelectedThread(thread)}
                                        className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 text-xs font-mono">#{selectedUser.threads.length - idx}</span>
                                                <span className="text-white text-sm font-semibold line-clamp-1">{thread.message.substring(0, 60)}{thread.message.length > 60 ? '…' : ''}</span>
                                            </div>
                                            {statusBadge(thread.status)}
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                                            <span>{new Date(thread.createdAt).toLocaleString()}</span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" /> {thread.replies?.length || 0} messages
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        // ── Thread Detail ──
                        <>
                            {/* Thread Header */}
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedThread(null)} title="Back to threads"
                                        className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className="text-sm font-bold text-white">{selectedUser.name}</h2>
                                        <p className="text-blue-400 text-xs">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${selectedThread.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : selectedThread.status === 'closed' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {selectedThread.status.toUpperCase()}
                                    </span>
                                    {selectedThread.status !== 'closed' && (
                                        <button onClick={handleCloseTicket} className="px-3 py-1.5 text-[10px] font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700">
                                            Resolve & Close
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 flex flex-col">
                                {/* Original message */}
                                <div className={`max-w-[80%] ${selectedThread.initiatedByAdmin ? 'self-start' : 'self-end'}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${selectedThread.initiatedByAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" /> {new Date(selectedThread.createdAt).toLocaleString()}
                                        </span>
                                        {selectedThread.initiatedByAdmin && <span className="text-xs font-bold text-slate-300">Support Team</span>}
                                        {!selectedThread.initiatedByAdmin && <span className="text-xs font-bold text-slate-300">Customer</span>}
                                    </div>
                                    <div className={selectedThread.initiatedByAdmin
                                        ? 'bg-slate-700/70 text-slate-100 rounded-2xl rounded-tl-sm p-4 border border-slate-600/50 shadow-sm'
                                        : 'bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-md shadow-blue-900/20'}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedThread.message}</p>
                                    </div>
                                </div>

                                {/* Replies */}
                                {selectedThread.replies?.map((reply: any) => (
                                    <div key={reply._id} className={`max-w-[80%] ${reply.isAdmin ? 'self-end' : 'self-start'}`}>
                                        <div className={`flex items-center gap-2 mb-1 ${reply.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            {!reply.isAdmin && <span className="text-xs font-bold text-slate-300">Customer</span>}
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" /> {new Date(reply.createdAt).toLocaleString()}
                                            </span>
                                            {reply.isAdmin && <span className="text-xs font-bold text-slate-300">You</span>}
                                        </div>
                                        <div className={reply.isAdmin
                                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-md shadow-blue-900/20'
                                            : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700/40 p-4'}>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.message}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply area */}
                            {selectedThread.status !== 'closed' ? (
                                <div className="border-t border-slate-800 bg-slate-950/50 flex flex-col">
                                    <div className="px-4 py-2.5 flex gap-2 overflow-x-auto custom-scrollbar border-b border-slate-800/50 items-center">
                                        <span className="text-[10px] font-bold text-slate-500 flex items-center shrink-0 mr-2">
                                            <Settings2 className="w-3 h-3 mr-1" /> Quick:
                                        </span>
                                        {quickReplies.map((resp, idx) => (
                                            <button key={idx} onClick={() => setReplyText(resp)}
                                                className="shrink-0 px-3 py-1 bg-slate-800 hover:bg-blue-900/30 hover:border-blue-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors whitespace-nowrap">
                                                {resp.length > 32 ? resp.substring(0, 32) + '…' : resp}
                                            </button>
                                        ))}
                                    </div>
                                    <form onSubmit={handleReply} className="flex gap-3 p-3.5">
                                        <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                            placeholder="Reply to customer..."
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-blue-500 outline-none transition-colors text-sm placeholder:text-slate-500" />
                                        <button disabled={submitting || !replyText.trim()} title="Send reply"
                                            className="bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-center gap-2 text-slate-500 text-sm">
                                    <Lock className="w-4 h-4" /> This ticket is closed.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Compose Modal ── */}
            {showCompose && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '88vh' }}>
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
                            <div className="flex items-center gap-3">
                                {composeMode === 'single' ? <SquarePen className="w-5 h-5 text-blue-400" /> : <Megaphone className="w-5 h-5 text-purple-400" />}
                                <h2 className="text-white font-bold">{composeMode === 'single' ? 'Send to Customer' : 'Bulk Message'}</h2>
                                {composeMode === 'bulk' && selectedBulkUsers.size > 0 && (
                                    <span className="bg-purple-600/20 text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full border border-purple-500/30">{selectedBulkUsers.size} selected</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-bold">
                                    <button onClick={() => setComposeMode('single')} className={`px-3 py-1 rounded-md transition-all ${composeMode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Single</button>
                                    <button onClick={() => setComposeMode('bulk')} className={`px-3 py-1 rounded-md transition-all ${composeMode === 'bulk' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Bulk</button>
                                </div>
                                <button title="Close" onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                    placeholder="Search customers..." autoFocus
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none placeholder:text-slate-500" />
                            </div>

                            {composeMode === 'bulk' && filteredComposeUsers.length > 0 && (
                                <button onClick={() => selectedBulkUsers.size === filteredComposeUsers.length
                                    ? setSelectedBulkUsers(new Set())
                                    : setSelectedBulkUsers(new Set(filteredComposeUsers.map((u: any) => u._id)))}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 transition-colors">
                                    {selectedBulkUsers.size === filteredComposeUsers.length ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                                    {selectedBulkUsers.size === filteredComposeUsers.length ? 'Deselect All' : `Select All (${filteredComposeUsers.length})`}
                                </button>
                            )}

                            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1 rounded-xl border border-slate-800 bg-slate-950/50 p-2">
                                {usersLoading ? (
                                    <div className="flex flex-col items-center py-6 gap-2"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /><p className="text-slate-500 text-xs">Loading...</p></div>
                                ) : filteredComposeUsers.length === 0 ? (
                                    <div className="text-center py-6 text-slate-500 text-sm">No customers found.</div>
                                ) : (
                                    filteredComposeUsers.map((u: any) => {
                                        const singleSel = composeMode === 'single' && selectedComposeUser?._id === u._id;
                                        const bulkSel = composeMode === 'bulk' && selectedBulkUsers.has(u._id);
                                        return (
                                            <button key={u._id}
                                                onClick={() => composeMode === 'single' ? setSelectedComposeUser(singleSel ? null : u) : toggleBulkUser(u._id)}
                                                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${singleSel || bulkSel
                                                    ? composeMode === 'single' ? 'border-blue-600/50 bg-blue-900/20' : 'border-purple-600/50 bg-purple-900/20'
                                                    : 'border-transparent hover:bg-slate-800'}`}
                                            >
                                                {composeMode === 'bulk' && (bulkSel ? <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />)}
                                                <div className="w-8 h-8 rounded-full bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                                                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-white text-sm font-bold truncate">{u.name}</div>
                                                    <div className="text-slate-400 text-xs truncate">{u.email}</div>
                                                </div>
                                                {u.role === 'admin' && <span className="ml-auto text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold flex-shrink-0">ADMIN</span>}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {((composeMode === 'single' && selectedComposeUser) || composeMode === 'bulk') && (
                                <form onSubmit={handleComposeSend} className="space-y-4 border-t border-slate-800 pt-4">
                                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${composeMode === 'single' ? 'bg-blue-900/15 border-blue-700/30' : 'bg-purple-900/15 border-purple-700/30'}`}>
                                        <span className="text-slate-400">To:</span>
                                        <span className={`font-bold ${composeMode === 'single' ? 'text-blue-400' : 'text-purple-400'}`}>
                                            {composeMode === 'single' ? selectedComposeUser?.name : `${selectedBulkUsers.size} customer${selectedBulkUsers.size !== 1 ? 's' : ''}`}
                                        </span>
                                    </div>
                                    <textarea value={composeText} onChange={e => setComposeText(e.target.value)}
                                        placeholder="Write your message..." rows={4} required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-blue-500 outline-none resize-none placeholder:text-slate-500" />
                                    <button type="submit"
                                        disabled={composeSending || !composeText.trim() || (composeMode === 'single' && !selectedComposeUser) || (composeMode === 'bulk' && selectedBulkUsers.size === 0)}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-40 shadow-md ${composeMode === 'single' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white`}>
                                        {composeSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {composeMode === 'single' ? 'Send Message' : `Send to ${selectedBulkUsers.size} Customer${selectedBulkUsers.size !== 1 ? 's' : ''}`}
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
