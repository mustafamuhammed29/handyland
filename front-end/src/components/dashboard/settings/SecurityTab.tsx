import React from 'react';
import { Shield, Lock, EyeOff, Eye, AlertCircle, Check, Loader2, X } from 'lucide-react';

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

interface SecurityTabProps {
    pwForm: { current: string; newPw: string; confirm: string };
    setPwForm: React.Dispatch<React.SetStateAction<{ current: string; newPw: string; confirm: string }>>;
    savePassword: (e: React.FormEvent) => Promise<void>;
    pwSaving: boolean;
    pwMsg: { type: 'ok' | 'err'; text: string } | null;
    showPw: { current: boolean; new: boolean; confirm: boolean };
    setShowPw: React.Dispatch<React.SetStateAction<{ current: boolean; new: boolean; confirm: boolean }>>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
    pwForm,
    setPwForm,
    savePassword,
    pwSaving,
    pwMsg,
    showPw,
    setShowPw,
}) => {
    return (
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
    );
};
