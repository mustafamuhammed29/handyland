import React, { useRef, useState } from 'react';
import { User, Mail, Phone, Check, AlertCircle, Save, Loader2, Pencil, Camera, Trash2 } from 'lucide-react';
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

    const handleSendOtp = async () => {
        if (!profileForm.phone) {
            toast.error(t('settings.profile.phone.required', 'Bitte gib eine gültige Telefonnummer ein.'));
            return;
        }

        setIsSendingOtp(true);
        try {
            const res = await api.post('/api/auth/phone/send-otp', { phone: profileForm.phone });
            const data = (res as any)?.data || res;
            if (data.success) {
                setShowOtpInput(true);
                setResendCooldown(60);
                toast.success(t('settings.profile.phone.otpSent', 'Verifizierungscode wurde gesendet! Bitte überprüfe dein Handy.'));
                // In dev mode, let user know the code is in terminal
                if (data.devCode) {
                    console.log(`[Dev Mode] Verification code is: ${data.devCode}`);
                }
            } else {
                toast.error(data.message || t('settings.profile.phone.sendFailed', 'Fehler beim Senden des Codes.'));
            }
        } catch (error: any) {
            console.error('Error sending phone verification OTP:', error);
            const errMsg = error.response?.data?.message || t('settings.profile.phone.sendError', 'Senden des Verifizierungscodes fehlgeschlagen.');
            toast.error(errMsg);
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
            const res = await api.post('/api/auth/phone/verify-otp', { phone: profileForm.phone, otp: otpCode });
            const data = (res as any)?.data || res;
            if (data.success) {
                setShowOtpInput(false);
                setOtpCode('');
                toast.success(t('settings.profile.phone.verifiedSuccess', 'Telefonnummer erfolgreich verifiziert!'));
                
                // Instantly update local profile state
                onUpdateProfile({ phone: profileForm.phone, is_verified: true });
            } else {
                toast.error(data.message || t('settings.profile.phone.verifyFailed', 'Ungültiger Code. Bitte versuche es erneut.'));
            }
        } catch (error: any) {
            console.error('Error verifying phone OTP:', error);
            const errMsg = error.response?.data?.message || t('settings.profile.phone.verifyError', 'Fehler beim Verifizieren des Codes.');
            toast.error(errMsg);
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error(t('settings.profile.avatar.invalidType', 'Bitte lade ein gültiges Bild hoch.'));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('settings.profile.avatar.tooLarge', 'Das Bild darf maximal 5MB groß sein.'));
            return;
        }

        setIsUploadingAvatar(true);
        const loadingToast = toast.loading(t('settings.profile.avatar.uploading', 'Profilbild wird hochgeladen...'));

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
                toast.success(t('settings.profile.avatar.updated', 'Profilbild erfolgreich aktualisiert!'), { id: loadingToast });
            } else {
                throw new Error('Upload failed');
            }
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
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">{t('settings.profile.title', 'Profile Information')}</h3>
                    <p className="text-slate-400 text-sm mt-0.5">{t('settings.profile.subtitle', 'Update your personal details')}</p>
                </div>
                {!profileEditing ? (
                    <button onClick={() => setProfileEditing(true)}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-400/5 hover:bg-blue-400/10 px-3 py-1.5 rounded-xl transition-colors border border-blue-400/20">
                        <Pencil className="w-3.5 h-3.5" /> {t('common.edit', 'Edit')}
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
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button onClick={saveProfile} disabled={profileSaving}
                            className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50 transition-colors">
                            {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {t('common.save', 'Save')}
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
                            <p className="text-blue-400/70 text-xs">{t('settings.profile.memberSince', 'Member since')} {new Date((user as any).createdAt || Date.now()).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}</p>
                            {user.avatar && (
                                <button 
                                    onClick={handleRemoveAvatar}
                                    className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-2 py-0.5 rounded-md transition-colors border border-red-400/20"
                                >
                                    <Trash2 className="w-3 h-3" /> {t('settings.profile.avatar.remove', 'Remove Photo')}
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
                    { id: 'name', label: t('settings.profile.fullName', 'Full Name'), icon: <User className="w-4 h-4" />, type: 'text', key: 'name' as const, placeholder: 'John Doe' },
                    { id: 'email', label: t('settings.profile.email', 'Email Address'), icon: <Mail className="w-4 h-4" />, type: 'email', key: 'email' as const, placeholder: 'john@example.com', disabled: true },
                    { id: 'phone', label: t('settings.profile.phoneNumber', 'Phone Number'), icon: <Phone className="w-4 h-4" />, type: 'tel', key: 'phone' as const, placeholder: '+1 234 567 890' },
                ].map(f => (
                    <div key={f.id}>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor={`profile-${f.id}`} className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                                <span className="text-slate-500">{f.icon}</span> {f.label}
                            </label>
                            {f.id === 'phone' && user.is_verified && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none">
                                    <Check className="w-3 h-3" /> {t('settings.profile.phone.verified', 'Verifiziert')}
                                </span>
                            )}
                        </div>
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
                        
                        {f.id === 'phone' && !user.is_verified && profileForm.phone && !profileEditing && (
                            <div className="mt-2.5 flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                        {t('settings.profile.phone.notVerified', 'Telefonnummer ist noch nicht verifiziert.')}
                                    </span>
                                    {!showOtpInput ? (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={isSendingOtp || resendCooldown > 0}
                                            className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {isSendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                            {resendCooldown > 0 
                                                ? `${t('settings.profile.phone.resendIn', 'Erneut in')} ${resendCooldown}s`
                                                : t('settings.profile.phone.verifyNow', 'Jetzt verifizieren')}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={isSendingOtp || resendCooldown > 0}
                                                className="text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {isSendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                {resendCooldown > 0 
                                                    ? `${t('settings.profile.phone.resendIn', 'Erneut in')} ${resendCooldown}s`
                                                    : t('settings.profile.phone.resendCode', 'Code erneut senden')}
                                            </button>
                                            <span className="text-slate-700">|</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowOtpInput(false)}
                                                className="text-xs text-slate-500 hover:text-slate-400 font-medium"
                                            >
                                                {t('common.cancel', 'Abbrechen')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {showOtpInput && (
                                    <div className="mt-2 pt-2.5 border-t border-slate-800/80 space-y-3">
                                        <p className="text-[11px] text-slate-400">
                                            {t('settings.profile.phone.otpSentDesc', 'Wir haben dir einen 6-stelligen Verifizierungscode per WhatsApp/SMS gesendet. Bitte gib ihn unten ein:')}
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="123456"
                                                className="flex-1 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-center tracking-[0.2em] text-sm focus:border-blue-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyOtp}
                                                disabled={isVerifyingOtp || otpCode.length !== 6}
                                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {isVerifyingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                {t('common.confirm', 'Bestätigen')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <div>
                    <label htmlFor="profile-language" className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-2">
                        <span className="text-slate-500">🌍</span> {t('settings.profile.language.title', 'Preferred Language')}
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
                    <p className="text-xs text-slate-500 mt-2">{t('settings.profile.language.description', 'This language will be used across the interface and for your personalized notifications.')}</p>
                </div>
            </div>
        </div>
    );
};
