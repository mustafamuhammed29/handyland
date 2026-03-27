import React, { useRef, useState } from 'react';
import { User, Mail, Phone, Check, AlertCircle, Save, Loader2, Pencil, Camera, Trash2 } from 'lucide-react';
import { User as UserType } from '../../../types';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import { getImageUrl } from '../../../utils/imageUrl';

interface ProfileFormState {
    name: string;
    email: string;
    phone: string;
    preferredLanguage: string;
}

interface ProfileMsgState {
    type: 'ok' | 'err';
    text: string;
}

interface ProfileTabProps {
    user: UserType;
    profileForm: ProfileFormState;
    setProfileForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
    profileEditing: boolean;
    setProfileEditing: React.Dispatch<React.SetStateAction<boolean>>;
    profileSaving: boolean;
    profileMsg: ProfileMsgState | null;
    saveProfile: () => void;
    setProfileMsg: React.Dispatch<React.SetStateAction<ProfileMsgState | null>>;
    onUpdateProfile: (data: Partial<UserType>) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
    user,
    profileForm,
    setProfileForm,
    profileEditing,
    setProfileEditing,
    profileSaving,
    profileMsg,
    saveProfile,
    setProfileMsg,
    onUpdateProfile,
}) => {
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Bitte lade ein gültiges Bild hoch.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Das Bild darf maximal 5MB groß sein.');
            return;
        }

        setIsUploadingAvatar(true);
        const loadingToast = toast.loading('Profilbild wird hochgeladen...');

        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const uploadRes = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const data = (uploadRes as any)?.data || uploadRes;

            if (data.success && data.imageUrl) {
                // Call parent's onUpdateProfile to make the PUT request and refetch
                onUpdateProfile({ avatar: data.imageUrl });
                toast.success('Profilbild erfolgreich aktualisiert!', { id: loadingToast });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Fehler beim Hochladen des Profilbilds.', { id: loadingToast });
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        const loadingToast = toast.loading('Profilbild wird entfernt...');
        try {
            onUpdateProfile({ avatar: '' });
            toast.success('Profilbild erfolgreich entfernt!', { id: loadingToast });
        } catch (error) {
            toast.error('Fehler beim Entfernen des Profilbilds.', { id: loadingToast });
        }
    };

    return (
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
                        <button onClick={() => {
                            setProfileEditing(false);
                            setProfileForm({
                                name: user.name || '',
                                email: user.email || '',
                                phone: (user as any).phone || '',
                                preferredLanguage: user.preferredLanguage || 'de'
                            });
                            setProfileMsg(null);
                        }}
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
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            title="Upload Profile Picture"
                            aria-label="Upload Profile Picture"
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/jpeg, image/png, image/webp"
                            onChange={handleAvatarUpload}
                        />
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-900/20 select-none overflow-hidden relative ${isUploadingAvatar ? 'opacity-50' : ''}`}>
                            {user.avatar ? (
                                <img src={getImageUrl(user.avatar)} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                (profileForm.name || user.name || '?').charAt(0).toUpperCase()
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-white font-bold">{user.name}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-blue-400/70 text-xs">Member since {new Date((user as any).createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            {user.avatar && (
                                <button 
                                    onClick={handleRemoveAvatar}
                                    className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-2 py-0.5 rounded-md transition-colors border border-red-400/20"
                                >
                                    <Trash2 className="w-3 h-3" /> Remove Photo
                                </button>
                            )}
                        </div>
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
                    { id: 'email', label: 'Email Address', icon: <Mail className="w-4 h-4" />, type: 'email', key: 'email' as const, placeholder: 'john@example.com', disabled: true },
                    { id: 'phone', label: 'Phone Number', icon: <Phone className="w-4 h-4" />, type: 'tel', key: 'phone' as const, placeholder: '+1 234 567 890' },
                ].map(f => (
                    <div key={f.id}>
                        <label htmlFor={`profile-${f.id}`} className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-2">
                            <span className="text-slate-500">{f.icon}</span> {f.label}
                        </label>
                        <input
                            id={`profile-${f.id}`}
                            type={f.type}
                            value={profileForm[f.key as keyof typeof profileForm]}
                            onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                            disabled={!profileEditing || f.disabled}
                            placeholder={f.placeholder}
                            className={`w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all ${profileEditing && !f.disabled
                                ? 'bg-slate-800 border border-slate-600 focus:border-blue-500 cursor-text'
                                : 'bg-slate-800/40 border border-slate-800 cursor-default text-slate-300'}`}
                        />
                    </div>
                ))}

                <div>
                    <label htmlFor="profile-language" className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-2">
                        <span className="text-slate-500">🌍</span> Preferred Language
                    </label>
                    <select
                        id="profile-language"
                        value={profileForm.preferredLanguage}
                        onChange={(e) => setProfileForm(p => ({ ...p, preferredLanguage: e.target.value }))}
                        disabled={!profileEditing}
                        className={`w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all ${profileEditing
                            ? 'bg-slate-800 border border-slate-600 focus:border-blue-500 cursor-pointer'
                            : 'bg-slate-800/40 border border-slate-800 cursor-default text-slate-300 opacity-80'}`}
                    >
                        <option value="de">German (Deutsch)</option>
                        <option value="en">English</option>
                        <option value="ar">Arabic (العربية)</option>
                        <option value="tr">Turkish (Türkçe)</option>
                        <option value="ru">Russian (Русский)</option>
                        <option value="fa">Persian (فارسی)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">This language will be used across the interface and for your personalized notifications.</p>
                </div>
            </div>
        </div>
    );
};
