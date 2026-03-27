import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, MapPin } from 'lucide-react';
import { User as UserType, Address } from '../../types';
import { api } from '../../utils/api';

import { ProfileTab } from './settings/ProfileTab';
import { SecurityTab } from './settings/SecurityTab';
import { NotificationsTab, NotifKey } from './settings/NotificationsTab';
import { AddressesTab } from './settings/AddressesTab';
import { AddressModal } from './settings/AddressModal';

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
    const [profileForm, setProfileForm] = useState({ 
        name: user.name || '', 
        email: user.email || '', 
        phone: (user as any).phone || '',
        preferredLanguage: user.preferredLanguage || 'de'
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [profileEditing, setProfileEditing] = useState(false);

    useEffect(() => {
        setProfileForm({ 
            name: user.name || '', 
            email: user.email || '', 
            phone: (user as any).phone || '',
            preferredLanguage: user.preferredLanguage || 'de'
        });
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
                <ProfileTab
                    user={user}
                    profileForm={profileForm}
                    setProfileForm={setProfileForm}
                    profileEditing={profileEditing}
                    setProfileEditing={setProfileEditing}
                    profileSaving={profileSaving}
                    profileMsg={profileMsg}
                    saveProfile={saveProfile}
                    setProfileMsg={setProfileMsg}
                    onUpdateProfile={onUpdateProfile}
                />
            )}

            {/* ──────────── SECURITY ──────────── */}
            {tab === 'security' && (
                <SecurityTab
                    pwForm={pwForm}
                    setPwForm={setPwForm}
                    savePassword={savePassword}
                    pwSaving={pwSaving}
                    pwMsg={pwMsg}
                    showPw={showPw}
                    setShowPw={setShowPw}
                />
            )}

            {/* ──────────── NOTIFICATIONS ──────────── */}
            {tab === 'notifications' && (
                <NotificationsTab
                    notifs={notifs}
                    toggleNotif={toggleNotif}
                    notifLoading={notifLoading}
                    notifSaving={notifSaving}
                    notifSaved={notifSaved}
                    notifError={notifError}
                />
            )}

            {/* ──────────── ADDRESSES ──────────── */}
            {tab === 'addresses' && (
                <AddressesTab
                    addresses={addresses}
                    openAddAddr={openAddAddr}
                    openEditAddr={openEditAddr}
                    deleteAddr={deleteAddr}
                />
            )}

            {/* ──────────── ADDRESS MODAL ──────────── */}
            <AddressModal
                showAddrModal={showAddrModal}
                editingAddr={editingAddr}
                closeAddrModal={closeAddrModal}
                addrForm={addrForm}
                setAddrForm={setAddrForm}
                submitAddr={submitAddr}
                addrSaving={addrSaving}
            />
        </div>
    );
};
