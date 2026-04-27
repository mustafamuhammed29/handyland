import React, { useState, useEffect } from 'react';
import { Search, Trash2, CheckCircle, AlertCircle, Lock, Unlock, Users, Shield, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    loginAttempts?: number;
    lockUntil?: string | null;
    avatar?: string;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: Record<string, number>;
}

// Helper to get initials avatar with a consistent pseudo-random color based on name
const Avatar = ({ name, url }: { name: string, url?: string }) => {
    if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-700/50 shadow-sm" />;
    
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const bgColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    const colorIndex = name ? name.length % bgColors.length : 0;
    
    return (
        <div className={`w-10 h-10 rounded-full ${bgColors[colorIndex]} text-white flex items-center justify-center font-bold text-lg shadow-[0_2px_10px_rgba(0,0,0,0.2)] border-2 border-slate-700/50`}>
            {initial}
        </div>
    );
};

// Pagination Controls Component
const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, setPage }: any) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-900/60 border-t border-slate-800 backdrop-blur-md gap-4">
            <div className="text-sm font-medium text-slate-400">
                Showing <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-white font-bold">{totalItems}</span> users
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    title="Previous page"
                    aria-label="Go to previous page"
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="px-4 py-1 text-sm font-bold text-slate-200">
                    Page {currentPage} of {totalPages}
                </div>
                <button
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    title="Next page"
                    aria-label="Go to next page"
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

const UsersManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search States
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsersCount, setTotalUsersCount] = useState(0);

    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    // Fetch Stats once
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/users/admin/stats');
                const data = (response as any)?.data || response;
                if (data.success) setStats(data.stats);
            } catch (error) {
                console.error('Error fetching user stats:', error);
            }
        };
        fetchStats();
    }, []);

    // Fetch Users when parameters change
    useEffect(() => {
        fetchUsers();
    }, [page, limit, roleFilter, statusFilter, debouncedSearch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(roleFilter && { role: roleFilter }),
                ...(statusFilter && { status: statusFilter === 'active' ? 'active' : 'inactive' })
            });
            const url = `/api/users/admin/all?${queryParams.toString()}`;
            const response = await api.get(url);
            const data = (response as any)?.data || response;
            if (data.success) {
                setUsers(data.users);
                setTotalPages(data.totalPages);
                setTotalUsersCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Action Handlers
    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const response = await api.put(`/api/users/admin/${userId}/status`, { isActive: !currentStatus });
            const data = (response as any)?.data || response;
            if (data.success) { 
                setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
                toast.success(`User account ${!currentStatus ? 'activated' : 'deactivated'}`); 
            }
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const changeUserRole = async (userId: string, newRole: string) => {
        try {
            const response = await api.put(`/api/users/admin/${userId}/role`, { role: newRole });
            const data = (response as any)?.data || response;
            if (data.success) { 
                setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
                toast.success(`User role upgraded to ${newRole}`); 
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const deleteUser = async (userId: string) => {
        if (!window.confirm('Are you absolutely sure you want to delete this user completely?')) return;
        try {
            await api.delete(`/api/users/admin/${userId}`);
            fetchUsers();
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
            toast.success('User account permanently deleted.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const unlockUser = async (userId: string) => {
        try {
            const response = await api.put(`/api/users/admin/${userId}/unlock`, {});
            const data = (response as any)?.data || response;
            if (data.success) { 
                setUsers(users.map(u => u._id === userId ? { ...u, lockUntil: null, loginAttempts: 0 } : u));
                toast.success('Security lock removed successfully.'); 
            }
        } catch (error) {
            toast.error('Failed to unlock account');
        }
    };

    // Bulk Actions
    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedUsers.length} selected users? This action is irreversible.`)) return;
        try {
            await Promise.all(selectedUsers.map(userId => api.delete(`/api/users/admin/${userId}`)));
            fetchUsers();
            setSelectedUsers([]);
            toast.success(`${selectedUsers.length} users successfully deleted`);
        } catch (error) {
            toast.error('Bulk delete failed for some users');
        }
    };

    const handleBulkRoleChange = async (newRole: string) => {
        if (!newRole) return;
        if (!window.confirm(`Change the permissions of ${selectedUsers.length} users to [${newRole.toUpperCase()}]?`)) return;
        try {
            await Promise.all(selectedUsers.map(userId => api.put(`/api/users/admin/${userId}/role`, { role: newRole })));
            fetchUsers();
            setSelectedUsers([]);
            toast.success(`Roles changed successfully`);
        } catch (error) {
            toast.error('Bulk role change failed');
        }
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) setSelectedUsers([]);
        else setSelectedUsers(users.map(u => u._id));
    };

    const toggleSelectUser = (userId: string) => {
        if (selectedUsers.includes(userId)) setSelectedUsers(selectedUsers.filter(id => id !== userId));
        else setSelectedUsers([...selectedUsers, userId]);
    };

    return (
        <div className="p-8 pb-20">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">User Intelligence</h1>
                <p className="text-slate-400 font-medium">Manage accounts, roles, access permissions and security states in one unified hub.</p>
            </div>

            {/* Premium Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    {/* Total Users */}
                    <div className="group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-1">Total Users</p>
                                <h3 className="text-4xl font-black text-white">{stats.totalUsers.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500/20 transition-colors shadow-inner">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Admins & Sellers */}
                    <div className="group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-1">Staff / Admins</p>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-4xl font-black text-white">{stats.usersByRole?.admin || 0}</h3>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">{stats.usersByRole?.seller || 0} Sellers</span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stats.usersByRole?.user || 0} Standard</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500/20 transition-colors shadow-inner">
                                <Shield size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Active */}
                    <div className="group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-emerald-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-1">Active Accounts</p>
                                <h3 className="text-4xl font-black text-emerald-400">{stats.activeUsers.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shadow-inner">
                                <UserCheck size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Disabled */}
                    <div className="group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-red-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-1">Blocked Accounts</p>
                                <h3 className="text-4xl font-black text-red-500">{stats.inactiveUsers.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-2xl text-red-400 group-hover:bg-red-500/20 transition-colors shadow-inner">
                                <UserX size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 bg-slate-900/40 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-lg">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400/70" />
                    <input
                        type="text"
                        placeholder="Search by name, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                    <select
                        title="Filter by Role"
                        value={roleFilter}
                        onChange={(e) => {setRoleFilter(e.target.value); setPage(1);}}
                        className="bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-500 min-w-[140px] shadow-inner transition-all cursor-pointer"
                    >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                    </select>

                    <select
                        title="Filter by Status"
                        value={statusFilter}
                        onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}
                        className="bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-500 min-w-[140px] shadow-inner transition-all cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Disabled</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Context Bar */}
            {selectedUsers.length > 0 && (
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-[0_5px_15px_rgba(59,130,246,0.1)] animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-blue-500 text-white rounded-lg font-black text-sm">{selectedUsers.length}</div>
                        <span className="text-blue-300 font-bold tracking-wide">Users Selected</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            onChange={(e) => handleBulkRoleChange(e.target.value)}
                            value=""
                            title="Change role for selected users"
                            aria-label="Change role for selected users"
                            className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-inner"
                        >
                            <option value="" disabled>Change Role to...</option>
                            <option value="user">User</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-red-900/20"
                        >
                            <Trash2 size={16} /> Delete Forever
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Data Table */}
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
                {loading && (
                    <div className="absolute inset-0 z-20 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-blue-400 font-bold animate-pulse text-lg flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> Loading Data...
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/90 border-b border-slate-700/80 text-slate-300 text-[13px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="p-5 pl-6 w-12">
                                    <input
                                        type="checkbox"
                                        title="Select All"
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 cursor-pointer focus:ring-0 focus:ring-offset-0"
                                    />
                                </th>
                                <th className="p-5">User Profile</th>
                                <th className="p-5">Role Permission</th>
                                <th className="p-5">Account Status</th>
                                <th className="p-5">Security</th>
                                <th className="p-5">Joined Date</th>
                                <th className="p-5 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 relative">
                            {users.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">No users found matching your search or filters.</td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr
                                        key={user._id}
                                        className={`transition-all duration-200 group ${selectedUsers.includes(user._id) ? 'bg-blue-900/10' : 'hover:bg-slate-800/40'}`}
                                    >
                                        <td className="p-5 pl-6">
                                            <input
                                                type="checkbox"
                                                title="Select User"
                                                checked={selectedUsers.includes(user._id)}
                                                onChange={() => toggleSelectUser(user._id)}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 cursor-pointer focus:ring-0 focus:ring-offset-0"
                                            />
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <Avatar name={user.name} url={user.avatar} />
                                                <div>
                                                    <p className="font-bold text-white text-sm truncate max-w-[200px]">{user.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <select
                                                value={user.role}
                                                onChange={(e) => changeUserRole(user._id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-sm
                                                    ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 
                                                      user.role === 'seller' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 
                                                      'bg-slate-800 text-slate-300 border-slate-700'}`}
                                                aria-label="Change User Role"
                                            >
                                                <option className="bg-slate-900 text-slate-300" value="user">User</option>
                                                <option className="bg-slate-900 text-amber-500" value="seller">Seller</option>
                                                <option className="bg-slate-900 text-purple-400" value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="p-5">
                                            <button
                                                onClick={() => toggleUserStatus(user._id, user.isActive)}
                                                className={`flex items-center justify-center w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${user.isActive ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'}`}
                                                title={`Click to ${user.isActive ? 'Block' : 'Unblock'} user`}
                                            >
                                                {user.isActive ? 'Block User' : 'Unblock User'}
                                            </button>
                                        </td>
                                        <td className="p-5">
                                            {user.lockUntil && new Date(user.lockUntil) > new Date() ? (
                                                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold w-max">
                                                    <Lock size={14} /> Locked Out
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 text-xs font-medium">Clear</span>
                                            )}
                                        </td>
                                        <td className="p-5 text-slate-400 text-xs font-mono font-medium">
                                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-5 pr-6">
                                            <div className="flex items-center justify-end gap-3">
                                                {user.lockUntil && new Date(user.lockUntil) > new Date() && (
                                                    <button
                                                        onClick={() => unlockUser(user._id)}
                                                        className="text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 p-2 rounded-lg transition-colors border border-amber-500/20"
                                                        title="Unlock Security Ban"
                                                    >
                                                        <Unlock size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteUser(user._id)}
                                                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                                    title="Permanently Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Advanced Server-side Pagination Engine */}
                <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    totalItems={totalUsersCount} 
                    itemsPerPage={limit} 
                    setPage={setPage} 
                />
            </div>
        </div>
    );
};

export default UsersManager;
