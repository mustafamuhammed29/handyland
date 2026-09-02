import React, { useRef, useState } from 'react';
import { User, Mail, Phone, Check, AlertCircle, Save, Loader2, Pencil, Camera, Trash2, Globe, ShieldCheck, Zap } from 'lucide-react';
import { User as UserType } from '../../../types';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import { getImageUrl } from '../../../utils/imageUrl';
import { useTranslation } from 'react-i18next';

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
    const { t, i18n } = useTranslation();
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Phone Verification States
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    React.useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown(c => c - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    interface OtpResponse {
        success: boolean;
        message?: string;
        devCode?: string;
        data?: {
            success?: boolean;
            message?: string;
            devCode?: string;
        };
    }

    const handleSendOtp = async () => {
        if (!profileForm.phone) {
            toast.error(t('settings.profile.phone.required', 'Bitte gib eine gültige Telefonnummer ein.'));
            return;
        }

        setIsSendingOtp(true);
        try {
            const res = await api.post<OtpResponse>('/api/auth/phone/send-otp', { phone: profileForm.phone });
            const data = (res as OtpResponse)?.data || res;
            if (data.success) {
                setShowOtpInput(true);
                setResendCooldown(60);
                if (data.devCode) {
                    toast.success(`[Dev Mode] Code: ${data.devCode} (SMS Gateway not configured)`, { duration: 10000 });
                } else {
                    toast.success(t('settings.profile.phone.otpSent', 'Verifizierungscode wurde gesendet! Bitte überprüfe dein Handy.'));
                }
            } else {
                toast.error(data.message || t('settings.profile.phone.sendFailed', 'Fehler beim Senden des Codes.'));
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || t('settings.profile.phone.sendError', 'Senden des Verifizierungscodes fehlgeschlagen.'));
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length !== 6) {
            toast.error(t('settings.profile.phone.otpInvalidLength', 'Bitte gib den 6-stelligen Code ein.'));
            return;
        }

        setIsVerifyingOtp(true);
        try {
            const res = await api.post<OtpResponse>('/api/auth/phone/verify-otp', { phone: profileForm.phone, otp: otpCode });
            const data = (res as OtpResponse)?.data || res;
            if (data.success) {
                setShowOtpInput(false);
                setOtpCode('');
                toast.success(t('settings.profile.phone.verifiedSuccess', 'Telefonnummer erfolgreich verifiziert!'));
                onUpdateProfile({ phone: profileForm.phone, is_verified: true });
            } else {
                toast.error(data.message || t('settings.profile.phone.verifyFailed', 'Ungültiger Code. Bitte versuche es erneut.'));
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || t('settings.profile.phone.verifyError', 'Fehler beim Verifizieren des Codes.'));
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    interface UploadResponse {
        success?: boolean;
        imageUrl?: string;
        data?: {
            success?: boolean;
            imageUrl?: string;
        };
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error(t('settings.profile.avatar.invalidType', 'Bitte lade ein gültiges Bild hoch.')); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error(t('settings.profile.avatar.tooLarge', 'Das Bild darf maximal 5MB groß sein.')); return; }

        setIsUploadingAvatar(true);
        const loadingToast = toast.loading(t('settings.profile.avatar.uploading', 'Profilbild wird hochgeladen...'));
        try {
            const formData = new FormData(); formData.append('image', file);
            const uploadRes = await api.post<UploadResponse>('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const data = (uploadRes as UploadResponse)?.data || uploadRes;
            if (data.success && data.imageUrl) {
                onUpdateProfile({ avatar: data.imageUrl });
                toast.success(t('settings.profile.avatar.updated', 'Profilbild erfolgreich aktualisiert!'), { id: loadingToast });
            } else throw new Error('Upload failed');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error(t('settings.profile.avatar.uploadError', 'Fehler beim Hochladen des Profilbilds.'), { id: loadingToast });
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        const loadingToast = toast.loading(t('settings.profile.avatar.removing', 'Profilbild wird entfernt...'));
        try {
            onUpdateProfile({ avatar: '' });
            toast.success(t('settings.profile.avatar.removed', 'Profilbild erfolgreich entfernt!'), { id: loadingToast });
        } catch (error) {
            toast.error(t('settings.profile.avatar.removeError', 'Fehler beim Entfernen des Profilbilds.'), { id: loadingToast });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
            {/* Banner Area */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-brand-primary via-blue-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                
                {/* Edit Controls Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {!profileEditing ? (
                        <button onClick={() => setProfileEditing(true)}
                            className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl transition-all shadow-sm border border-white/20">
                            <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.edit', 'Edit Profile')}</span>
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => {
                                setProfileEditing(false);
                                setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', preferredLanguage: user.preferredLanguage || 'de' });
                                setProfileMsg(null);
                            }}
                                className="px-4 py-2 text-sm rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all">
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button onClick={saveProfile} disabled={profileSaving}
                                className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-white text-brand-primary hover:bg-slate-50 font-bold disabled:opacity-70 transition-all shadow-md">
                                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {t('common.save', 'Save')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 sm:px-10 pb-10 relative">
                {/* Avatar Overlaying Banner */}
                <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-12 sm:-mt-16 mb-8 relative z-10">
                    <div className="relative group cursor-pointer inline-block" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} className={t('hidden')} accept="image/jpeg, image/png, image/webp" onChange={handleAvatarUpload} />
                        <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-xl select-none overflow-hidden relative ${isUploadingAvatar ? 'opacity-50' : ''}`}>
                            {user.avatar ? (
                                <img src={getImageUrl(user.avatar)} alt={t('profile')} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                (profileForm.name || user.name || '?').charAt(0).toUpperCase()
                            )}
                            
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isUploadingAvatar ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 pb-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {user.name}
                            {user.is_verified && (
                                <span title="Verified User" className="flex items-center">
                                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                </span>
                            )}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4" /> {user.email}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-800/50">
                                <Zap className="w-3.5 h-3.5" /> Level {user.membershipLevel || 1} Member
                            </span>
                            <span className="text-xs text-slate-400">
                                {t('settings.profile.memberSince', 'Member since')} {new Date(user.createdAt || Date.now()).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
                            </span>
                            {user.avatar && profileEditing && (
                                <button onClick={handleRemoveAvatar} className="text-xs text-red-500 hover:text-red-600 font-medium ml-auto flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> {t('settings.profile.avatar.remove', 'Remove Photo')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {profileMsg && (
                    <div className={`flex items-center gap-3 p-4 mb-8 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${profileMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                        {profileMsg.type === 'ok' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        {profileMsg.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <User className="w-4 h-4 text-brand-primary" /> {t('settings.profile.fullName', 'Full Name')}
                        </label>
                        <input
                            type="text"
                            value={profileForm.name}
                            onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                            disabled={!profileEditing}
                            className={`w-full px-4 py-3.5 rounded-xl text-slate-900 dark:text-white font-medium outline-none transition-all ${profileEditing
                                ? 'bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-brand-primary dark:focus:border-brand-primary'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-2 border-transparent text-slate-500 dark:text-slate-400 cursor-default'}`}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-primary" /> {t('settings.profile.email', 'Email Address')}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-slate-400"/> Primary</span>
                        </label>
                        <input
                            type={t('email')}
                            value={profileForm.email}
                            disabled
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border-2 border-transparent text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <label className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-primary" /> {t('settings.profile.phoneNumber', 'Phone Number')}</span>
                            {user.is_verified ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" /> {t('settings.profile.phone.verified', 'Verifiziert')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3" /> Unverified
                                </span>
                            )}
                        </label>
                        <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                            disabled={!profileEditing}
                            placeholder="+49 123 456789"
                            className={`w-full px-4 py-3.5 rounded-xl text-slate-900 dark:text-white font-medium outline-none transition-all ${profileEditing
                                ? 'bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-brand-primary dark:focus:border-brand-primary'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-2 border-transparent text-slate-500 dark:text-slate-400 cursor-default'}`}
                        />
                        
                        {/* OTP Verification Block */}
                        {!user.is_verified && profileForm.phone && !profileEditing && (
                            <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300 font-medium">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                                        <p>{t('settings.profile.phone.notVerified', 'Dein Konto ist sicherer mit einer verifizierten Telefonnummer.')}</p>
                                    </div>
                                    {!showOtpInput ? (
                                        <button onClick={handleSendOtp} disabled={isSendingOtp || resendCooldown > 0}
                                            className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                                            {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                            {resendCooldown > 0 ? `${t('settings.profile.phone.resendIn', 'Erneut in')} ${resendCooldown}s` : t('settings.profile.phone.verifyNow', 'Jetzt verifizieren')}
                                        </button>
                                    ) : (
                                        <button onClick={() => setShowOtpInput(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                            {t('common.cancel', 'Abbrechen')}
                                        </button>
                                    )}
                                </div>

                                {showOtpInput && (
                                    <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-800/50">
                                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">
                                            {t('settings.profile.phone.otpSentDesc', '6-stelligen Code eingeben:')}
                                        </p>
                                        <div className="flex gap-2">
                                            <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="••••••"
                                                className="flex-1 max-w-[200px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white font-mono text-center tracking-[0.5em] text-lg focus:border-brand-primary outline-none shadow-inner"
                                            />
                                            <button onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpCode.length !== 6}
                                                className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-cyan-600 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md">
                                                {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                {t('common.confirm', 'Bestätigen')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Language Preference */}
                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <Globe className="w-4 h-4 text-brand-primary" /> {t('settings.profile.language.title', 'Preferred Language')}
                        </label>
                        <select
                            value={profileForm.preferredLanguage}
                            onChange={(e) => setProfileForm(p => ({ ...p, preferredLanguage: e.target.value }))}
                            disabled={!profileEditing}
                            className={`w-full px-4 py-3.5 rounded-xl text-slate-900 dark:text-white font-medium outline-none transition-all appearance-none ${profileEditing
                                ? 'bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-brand-primary dark:focus:border-brand-primary cursor-pointer'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-2 border-transparent text-slate-500 dark:text-slate-400 cursor-default'}`}
                            style={{ backgroundImage: profileEditing ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")' : 'none', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
                        >
                            <option value="de">German (Deutsch)</option>
                            <option value="en">English</option>
                            <option value="ar">Arabic (العربية)</option>
                            <option value="tr">Turkish (Türkçe)</option>
                            <option value="ru">Russian (Русский)</option>
                            <option value="fa">Persian (فارسی)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{t('settings.profile.language.description', 'This language will be used across the interface and for your personalized notifications.')}</p>
                    </div>
                </div>

                {/* System Troubleshooting */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-slate-400" />
                                {t('settings.profile.troubleshooting.title', 'System & Fehlersuche')}
                            </h4>
                            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                                {t('settings.profile.troubleshooting.desc', 'Wenn Fehler auftreten oder die Seite nicht aktualisiert wird, kannst du den App-Cache löschen (Hard Refresh).')}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
                                if ('caches' in window) caches.keys().then(n => n.forEach(name => caches.delete(name)));
                                window.location.reload();
                            }}
                            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('settings.profile.troubleshooting.clearCache', 'App-Cache löschen')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
