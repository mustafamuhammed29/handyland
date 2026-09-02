import { Gift, AlertCircle } from 'lucide-react';

export const PromoSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-pink-500/10 rounded-xl">
                    <Gift className="text-pink-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Promo Popup</h3>
                    <p className="text-slate-400 text-sm">Automatically shows your latest active coupon to new visitors.</p>
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl space-y-5">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between py-3 border border-slate-700 rounded-xl px-4">
                    <div>
                        <span className="text-white font-bold block">Enable Promo Popup</span>
                        <span className="text-slate-500 text-xs">When enabled, the newest active coupon from Coupon Manager will be shown automatically.</span>
                    </div>
                    <button
                        type="button"
                        aria-label={settings.promoPopup?.enabled ? 'Disable Popup' : 'Enable Popup'}
                        onClick={() => handleChange('promoPopup', 'enabled', !settings.promoPopup?.enabled)}
                        className={`relative w-12 h-6 rounded-full transition-all shrink-0 ml-4 ${settings.promoPopup?.enabled ? 'bg-pink-500' : 'bg-slate-700'
                            }`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.promoPopup?.enabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Delay */}
                <div>
                    <label className="block text-slate-400 text-sm font-bold mb-2">Delay (seconds)</label>
                    <input
                        type="number"
                        min={0}
                        max={120}
                        placeholder="5"
                        value={settings.promoPopup?.delay ?? 5}
                        onChange={e => handleChange('promoPopup', 'delay', Number(e.target.value))}
                        className="w-full max-w-xs bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-pink-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">How long to wait before showing the popup to a new visitor.</p>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg text-sm text-emerald-300 flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Linked to Coupon Manager</p>
                        <p className="text-emerald-400/80">The popup automatically displays the <strong>newest active coupon</strong> from <strong>Coupon Manager</strong>. Title, message, and discount details are generated automatically — no manual input needed!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
