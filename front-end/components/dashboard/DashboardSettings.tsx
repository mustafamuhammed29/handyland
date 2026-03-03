import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Phone, Bell, Shield, MapPin, Save, Eye, EyeOff,
    Check, X, Loader2, Plus, Pencil, Trash2, Star, AlertCircle,
    ShoppingBag, Wrench, Tag, Newspaper, Lock, ChevronRight
} from 'lucide-react';
import { User as UserType, Address } from '../../types';
import { api } from '../../utils/api';

interface DashboardSettingsProps {
    user: UserType;
    addresses: Address[];
    onUpdateProfile: (data: Partial<UserType>) => void;
    onUpdatePassword: (oldPass: string, newPass: string) => void;
    onAddAddress: (address: Omit<Address, '_id'>) => void;
    onUpdateAddress: (id: string, address: Partial<Address>) => void;
    onDeleteAddress: (id: string) => void;
}

type Tab = 'profile' | 'security' | 'notifications' | 'addresses';

const EMPTY_ADDRESS = { name: '', street: '', city: '', state: '', zipCode: '', country: '', isDefault: false };

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            role="switch"
            title={label}
            aria-checked={checked ? 'true' : 'false'}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
    );
}

function PasswordStrength({ password }: { password: string }) {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };
    const score = Object.values(checks).filter(Boolean).length;
    const bar = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
    const label = ['Weak', 'Fair', 'Good', 'Strong'];
    if (!password) return null;
    return (
        <div className="mt-2 space-y-2">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? bar[score - 1] : 'bg-slate-700'}`} />
                ))}
            </div>
            <div className="flex gap-4 flex-wrap">
                {Object.entries({ '8+ chars': checks.length, 'Uppercase': checks.uppercase, 'Number': checks.number, 'Symbol': checks.special }).map(([k, v]) => (
                    <span key={k} className={`text-[11px] flex items-center gap-1 ${v ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {v ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {k}
                    </span>
                ))}
            </div>
            <p className={`text-xs font-medium ${bar[score - 1]?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                {score > 0 ? label[score - 1] : ''}
            </p>
        </div>
    );
}

export const DashboardSettings: React.FC<DashboardSettingsProps> = ({
    user,
    addresses,
    onUpdateProfile,
    onUpdatePassword,
    onAddAddress,
    onUpdateAddress,
    onDeleteAddress
}) => {
    const [tab, setTab] = useState<Tab>('profile');

    // ── Profile ──
    const [profileForm, setProfileForm] = useState({ name: user.name || '', email: user.email || '', phone: (user as any).phone || '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [profileEditing, setProfileEditing] = useState(false);

    useEffect(() => {
        setProfileForm({ name: user.name || '', email: user.email || '', phone: (user as any).phone || '' });
    }, [user]);

    const saveProfile = async () => {
        setProfileSaving(true);
        setProfileMsg(null);
        try {
            const res = await api.put('/api/users/profile', profileForm) as any;
            onUpdateProfile(res?.user || res?.data || profileForm);
            setProfileMsg({ type: 'ok', text: 'Profile updated successfully!' });
            setProfileEditing(false);
        } catch (err: any) {
            setProfileMsg({ type: 'err', text: err?.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setProfileSaving(false);
        }
    };

    // ── Security ──
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMsg(null);
        if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
        if (pwForm.newPw.length < 8) { setPwMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return; }
        setPwSaving(true);
        try {
            await api.put('/api/users/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
            onUpdatePassword(pwForm.current, pwForm.newPw);
            setPwMsg({ type: 'ok', text: 'Password updated successfully!' });
            setPwForm({ current: '', newPw: '', confirm: '' });
        } catch (err: any) {
            setPwMsg({ type: 'err', text: err?.response?.data?.message || 'Failed to update password.' });
        } finally {
            setPwSaving(false);
        }
    };

    // ── Notifications ──
    const NOTIF_KEYS = ['orderUpdates', 'repairStatus', 'promotions', 'newsletter'] as const;
    type NotifKey = typeof NOTIF_KEYS[number];
    const NOTIF_ITEMS: { key: NotifKey; label: string; desc: string; icon: React.ReactNode; def: boolean }[] = [
        { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified when your order status changes', icon: <ShoppingBag className="w-5 h-5" />, def: true },
        { key: 'repairStatus', label: 'Repair Status', desc: 'Updates on your repair and service tickets', icon: <Wrench className="w-5 h-5" />, def: true },
        { key: 'promotions', label: 'Promotions & Deals', desc: 'Special offers and exclusive discounts', icon: <Tag className="w-5 h-5" />, def: false },
        { key: 'newsletter', label: 'Newsletter', desc: 'Weekly product updates and news', icon: <Newspaper className="w-5 h-5" />, def: false },
    ];

    const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
        orderUpdates: true, repairStatus: true, promotions: false, newsletter: false
    });
    const [notifLoading, setNotifLoading] = useState(true);
    const [notifSaving, setNotifSaving] = useState(false);
    const [notifSaved, setNotifSaved] = useState(false);
    const [notifError, setNotifError] = useState<string | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load from server when notifications tab opens
    useEffect(() => {
        if (tab !== 'notifications') return;
        setNotifLoading(true);
        api.get('/api/users/notifications')
            .then((res: any) => {
                const prefs = res?.data || res;
                setNotifs(prev => ({ ...prev, ...(prefs || {}) }));
            })
            .catch(() => { /* use defaults silently */ })
            .finally(() => setNotifLoading(false));
    }, [tab]);

    const saveNotifsToServer = async (updated: Record<NotifKey, boolean>) => {
        setNotifSaving(true);
        setNotifError(null);
        try {
            await api.put('/api/users/notifications', updated);
            setNotifSaved(true);
            setTimeout(() => setNotifSaved(false), 2500);
        } catch {
            setNotifError('Failed to save. Will retry on next change.');
        } finally {
            setNotifSaving(false);
        }
    };

    const toggleNotif = (key: NotifKey, val: boolean) => {
        const updated = { ...notifs, [key]: val };
        setNotifs(updated);
        // Also keep localStorage as local cache
        localStorage.setItem('notifPrefs', JSON.stringify(updated));
        // Debounce: wait 600ms after last toggle before saving
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => saveNotifsToServer(updated), 600);
    };

    // ── Addresses ──
    const [showAddrModal, setShowAddrModal] = useState(false);
    const [editingAddr, setEditingAddr] = useState<Address | null>(null);
    const [addrForm, setAddrForm] = useState<typeof EMPTY_ADDRESS>({ ...EMPTY_ADDRESS });
    const [addrSaving, setAddrSaving] = useState(false);

    const openAddAddr = () => { setEditingAddr(null); setAddrForm({ ...EMPTY_ADDRESS }); setShowAddrModal(true); };
    const openEditAddr = (a: Address) => {
        setEditingAddr(a);
        setAddrForm({ name: a.name || '', street: a.street || '', city: a.city || '', state: a.state || '', zipCode: a.zipCode || (a as any).postalCode || '', country: a.country || '', isDefault: a.isDefault || false });
        setShowAddrModal(true);
    };
    const closeAddrModal = () => { setShowAddrModal(false); setEditingAddr(null); setAddrForm({ ...EMPTY_ADDRESS }); };

    const submitAddr = async () => {
        setAddrSaving(true);
        try {
            if (editingAddr && editingAddr._id) {
                onUpdateAddress(editingAddr._id, addrForm);
            } else {
                onAddAddress(addrForm);
            }
            closeAddrModal();
        } finally {
            setAddrSaving(false);
        }
    };

    const deleteAddr = (id: string) => { if (window.confirm('Delete this address?')) onDeleteAddress(id); };

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Account Settings</h2>
                <p className="text-slate-400 text-sm mt-1">Manage your profile, security and preferences.</p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === t.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                            : 'bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ──────────── PROFILE ──────────── */}
            {tab === 'profile' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Profile Information</h3>
                            <p className="text-slate-400 text-sm mt-0.5">Update your personal details</p>
                        </div>
                        {!profileEditing ? (
                            <button onClick={() => setProfileEditing(true)}
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-400/5 hover:bg-blue-400/10 px-3 py-1.5 rounded-xl transition-colors border border-blue-400/20">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => { setProfileEditing(false); setProfileForm({ name: user.name || '', email: user.email || '', phone: (user as any).phone || '' }); setProfileMsg(null); }}
                                    className="px-3 py-1.5 text-sm rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={saveProfile} disabled={profileSaving}
                                    className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50 transition-colors">
                                    {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-6 space-y-5">
                        {/* Avatar */}
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-900/20 select-none">
                                {(profileForm.name || user.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-bold">{user.name}</p>
                                <p className="text-slate-400 text-sm">{user.email}</p>
                                <p className="text-blue-400/70 text-xs mt-0.5">Member since {new Date((user as any).createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>

                        {profileMsg && (
                            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${profileMsg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {profileMsg.type === 'ok' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                                {profileMsg.text}
                            </div>
                        )}

                        {[
                            { id: 'name', label: 'Full Name', icon: <User className="w-4 h-4" />, type: 'text', key: 'name' as const, placeholder: 'John Doe' },
                            { id: 'email', label: 'Email Address', icon: <Mail className="w-4 h-4" />, type: 'email', key: 'email' as const, placeholder: 'john@example.com' },
                            { id: 'phone', label: 'Phone Number', icon: <Phone className="w-4 h-4" />, type: 'tel', key: 'phone' as const, placeholder: '+1 234 567 890' },
                        ].map(f => (
                            <div key={f.id}>
                                <label htmlFor={`profile-${f.id}`} className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-2">
                                    <span className="text-slate-500">{f.icon}</span> {f.label}
                                </label>
                                <input
                                    id={`profile-${f.id}`}
                                    type={f.type}
                                    value={profileForm[f.key]}
                                    onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    disabled={!profileEditing}
                                    placeholder={f.placeholder}
                                    className={`w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all ${profileEditing
                                        ? 'bg-slate-800 border border-slate-600 focus:border-blue-500 cursor-text'
                                        : 'bg-slate-800/40 border border-slate-800 cursor-default text-slate-300'}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ──────────── SECURITY ──────────── */}
            {tab === 'security' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800/60">
                        <h3 className="text-lg font-bold text-white">Change Password</h3>
                        <p className="text-slate-400 text-sm mt-0.5">Use a strong, unique password for your account</p>
                    </div>
                    <form onSubmit={savePassword} className="p-6 space-y-5">
                        {pwMsg && (
                            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${pwMsg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {pwMsg.type === 'ok' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                                {pwMsg.text}
                            </div>
                        )}

                        {/* Current password */}
                        <div>
                            <label htmlFor="pw-current" className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-2">
                                <Lock className="w-4 h-4 text-slate-500" /> Current Password
                            </label>
                            <div className="relative">
                                <input id="pw-current" type={showPw.current ? 'text' : 'password'} required value={pwForm.current}
                                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors" />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                                    aria-label="Toggle current password visibility"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New password */}
                        <div>
                            <label htmlFor="pw-new" className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-2">
                                <Lock className="w-4 h-4 text-slate-500" /> New Password
                            </label>
                            <div className="relative">
                                <input id="pw-new" type={showPw.new ? 'text' : 'password'} required value={pwForm.newPw}
                                    onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                                    placeholder="Min. 8 characters"
                                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors" />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                                    aria-label="Toggle new password visibility"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <PasswordStrength password={pwForm.newPw} />
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label htmlFor="pw-confirm" className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-2">
                                <Lock className="w-4 h-4 text-slate-500" /> Confirm New Password
                            </label>
                            <div className="relative">
                                <input id="pw-confirm" type={showPw.confirm ? 'text' : 'password'} required value={pwForm.confirm}
                                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-3 pr-12 bg-slate-800 border rounded-xl text-white text-sm outline-none transition-colors ${pwForm.confirm && pwForm.newPw !== pwForm.confirm ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'}`} />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                                    aria-label="Toggle confirm password visibility"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                                <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><X className="w-3 h-3" /> Passwords do not match</p>
                            )}
                            {pwForm.confirm && pwForm.newPw === pwForm.confirm && pwForm.confirm.length > 0 && (
                                <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
                            )}
                        </div>

                        <button type="submit" disabled={pwSaving || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-900/20">
                            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            Update Password
                        </button>
                    </form>
                </div>
            )}

            {tab === 'notifications' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Notification Preferences</h3>
                            <p className="text-slate-400 text-sm mt-0.5">Choose what you want to be notified about</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {notifSaving && (
                                <span className="flex items-center gap-1 text-slate-400 text-xs">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                                </span>
                            )}
                            {notifSaved && !notifSaving && (
                                <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                    <Check className="w-3.5 h-3.5" /> Saved to account
                                </span>
                            )}
                        </div>
                    </div>

                    {notifError && (
                        <div className="mx-4 mt-4 flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {notifError}
                        </div>
                    )}

                    <div className="divide-y divide-slate-800/60">
                        {notifLoading ? (
                            // Skeleton loader
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="w-28 h-3 bg-slate-800 rounded animate-pulse" />
                                            <div className="w-44 h-2.5 bg-slate-800/60 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="w-11 h-6 bg-slate-800 rounded-full animate-pulse" />
                                </div>
                            ))
                        ) : (
                            NOTIF_ITEMS.map(item => (
                                <div key={item.key} className="flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${notifs[item.key] ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">{item.label}</p>
                                            <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        checked={notifs[item.key]}
                                        onChange={v => toggleNotif(item.key, v)}
                                        label={item.label}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-800/60 bg-slate-950/30">
                        <p className="text-slate-500 text-xs text-center">Changes are saved automatically to your account across all devices.</p>
                    </div>
                </div>
            )}

            {/* ──────────── ADDRESSES ──────────── */}
            {tab === 'addresses' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Saved Addresses</h3>
                            <p className="text-slate-400 text-sm mt-0.5">{addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved</p>
                        </div>
                        <button onClick={openAddAddr}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-md shadow-blue-900/20">
                            <Plus className="w-4 h-4" /> Add Address
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        {addresses.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-slate-500 gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                                    <MapPin className="w-7 h-7 opacity-40" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-slate-400">No saved addresses yet</p>
                                    <p className="text-sm text-slate-500 mt-1">Add a shipping address for faster checkout</p>
                                </div>
                                <button onClick={openAddAddr}
                                    className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 px-4 py-2 rounded-xl transition-colors">
                                    <Plus className="w-4 h-4" /> Add your first address
                                </button>
                            </div>
                        ) : (
                            addresses.map(addr => (
                                <div key={addr._id} className={`relative p-4 rounded-xl border transition-all ${addr.isDefault ? 'border-blue-600/50 bg-blue-900/10' : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'}`}>
                                    {addr.isDefault && (
                                        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                                            <Star className="w-2.5 h-2.5" /> Default
                                        </span>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-16">
                                            <p className="text-white font-bold text-sm">{addr.name}</p>
                                            <p className="text-slate-400 text-sm mt-0.5">
                                                {addr.street}, {addr.city}
                                                {(addr as any).postalCode || addr.zipCode ? `, ${(addr as any).postalCode || addr.zipCode}` : ''}
                                                {addr.country ? `, ${addr.country}` : ''}
                                            </p>
                                            {(addr as any).phone && <p className="text-slate-500 text-xs mt-1">{(addr as any).phone}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 ml-12">
                                        <button onClick={() => openEditAddr(addr)}
                                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/5 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors border border-blue-400/15">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => addr._id && deleteAddr(addr._id)}
                                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-400/5 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors border border-red-400/15">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ──────────── ADDRESS MODAL ──────────── */}
            {showAddrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <h4 className="text-white font-bold">{editingAddr ? 'Edit Address' : 'Add New Address'}</h4>
                            <button onClick={closeAddrModal} aria-label="Close modal" className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-4 flex-1">
                            {[
                                { id: 'addr-name', label: 'Recipient Name', field: 'name' as const, placeholder: 'John Doe' },
                                { id: 'addr-street', label: 'Street Address', field: 'street' as const, placeholder: '123 Main St' },
                            ].map(f => (
                                <div key={f.id}>
                                    <label htmlFor={f.id} className="block text-sm font-medium text-slate-400 mb-1.5">{f.label}</label>
                                    <input id={f.id} type="text" placeholder={f.placeholder} value={(addrForm as any)[f.field]}
                                        onChange={e => setAddrForm(p => ({ ...p, [f.field]: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'addr-city', label: 'City', field: 'city' as const, placeholder: 'Berlin' },
                                    { id: 'addr-state', label: 'State / Region', field: 'state' as const, placeholder: 'BE' },
                                ].map(f => (
                                    <div key={f.id}>
                                        <label htmlFor={f.id} className="block text-sm font-medium text-slate-400 mb-1.5">{f.label}</label>
                                        <input id={f.id} type="text" placeholder={f.placeholder} value={(addrForm as any)[f.field]}
                                            onChange={e => setAddrForm(p => ({ ...p, [f.field]: e.target.value }))}
                                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'addr-zip', label: 'ZIP / Postal Code', field: 'zipCode' as const, placeholder: '10115' },
                                    { id: 'addr-country', label: 'Country', field: 'country' as const, placeholder: 'Germany' },
                                ].map(f => (
                                    <div key={f.id}>
                                        <label htmlFor={f.id} className="block text-sm font-medium text-slate-400 mb-1.5">{f.label}</label>
                                        <input id={f.id} type="text" placeholder={f.placeholder} value={(addrForm as any)[f.field]}
                                            onChange={e => setAddrForm(p => ({ ...p, [f.field]: e.target.value }))}
                                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" />
                                    </div>
                                ))}
                            </div>
                            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-blue-500/40 cursor-pointer transition-colors">
                                <div onClick={() => setAddrForm(p => ({ ...p, isDefault: !p.isDefault }))}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${addrForm.isDefault ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                                    {addrForm.isDefault && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">Set as default address</p>
                                    <p className="text-xs text-slate-400">Used automatically at checkout</p>
                                </div>
                            </label>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
                            <button onClick={closeAddrModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-colors">
                                Cancel
                            </button>
                            <button onClick={submitAddr} disabled={addrSaving || !addrForm.name || !addrForm.street || !addrForm.city}
                                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-900/20">
                                {addrSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAddr ? <><Save className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Save Address</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
