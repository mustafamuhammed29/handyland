import React, { useState, useEffect } from 'react';
import { Search, Trash2, CheckSquare, Square } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

const UsersManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = `${API_URL}/users/admin/all${roleFilter ? `?role=${roleFilter}` : ''}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/users/admin/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            const data = await response.json();
            if (data.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    };

    const changeUserRole = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/users/admin/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            const data = await response.json();
            if (data.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/users/admin/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                fetchUsers();
                setSelectedUsers(selectedUsers.filter(id => id !== userId));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedUsers.length} selected users?`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            // Execute deletions concurrently
            await Promise.all(selectedUsers.map(userId =>
                fetch(`${API_URL}/users/admin/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            ));

            fetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Error performing bulk delete:', error);
        }
    };

    const handleBulkRoleChange = async (newRole: string) => {
        if (!newRole) return;
        if (!confirm(`Are you sure you want to change the role of ${selectedUsers.length} users to ${newRole}?`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            await Promise.all(selectedUsers.map(userId =>
                fetch(`${API_URL}/users/admin/${userId}/role`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: newRole })
                })
            ));

            fetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Error performing bulk role change:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u._id));
        }
    };

    const toggleSelectUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-white mb-2">User Management</h1>
                <p className="text-slate-400">Manage all platform users</p>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter Users by Role"
                    >
                        <option value="">All Roles</option>
                        <option value="user">Users</option>
                        <option value="seller">Sellers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold">{selectedUsers.length}</span>
                        <span className="text-slate-300">users selected</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            onChange={(e) => handleBulkRoleChange(e.target.value)}
                            value=""
                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Bulk Change Role"
                        >
                            <option value="" disabled>Change Role To...</option>
                            <option value="user">User</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-6 py-4 text-left">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-slate-400 hover:text-white transition-colors flex items-center"
                                        aria-label={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? "Deselect All" : "Select All"}
                                        title={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? "Deselect All" : "Select All"}
                                    >
                                        {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-blue-500" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">User</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Joined</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user._id}
                                        className={`border-b border-slate-800/50 transition-colors ${selectedUsers.includes(user._id) ? 'bg-blue-900/20' : 'hover:bg-slate-800/30'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleSelectUser(user._id)}
                                                className="text-slate-400 hover:text-white transition-colors flex items-center"
                                                aria-label={selectedUsers.includes(user._id) ? "Deselect User" : "Select User"}
                                            >
                                                {selectedUsers.includes(user._id) ? (
                                                    <CheckSquare className="w-5 h-5 text-blue-500" />
                                                ) : (
                                                    <Square className="w-5 h-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-white">{user.name}</p>
                                                <p className="text-sm text-slate-400">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => changeUserRole(user._id, e.target.value)}
                                                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                aria-label="Change User Role"
                                            >
                                                <option value="user">User</option>
                                                <option value="seller">Seller</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleUserStatus(user._id, user.isActive)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive
                                                    ? 'bg-green-600/20 text-green-400'
                                                    : 'bg-red-600/20 text-red-400'
                                                    }`}
                                            >
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => deleteUser(user._id)}
                                                    className="p-2 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <div className="flex items-center gap-4">
                    <p>Total Users: {filteredUsers.length}</p>
                    {selectedUsers.length > 0 && (
                        <p className="text-blue-400 font-medium">{selectedUsers.length} users selected</p>
                    )}
                </div>
                <p>Showing {filteredUsers.length} results</p>
            </div>
        </div>
    );
};

export default UsersManager;
