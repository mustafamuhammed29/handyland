import { Bell } from 'lucide-react';

export const BannerSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                    <Bell className="text-amber-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Announcement Banner</h3>
                    <p className="text-slate-400 text-sm">Shows a dismissible banner at the top of every page for all visitors.</p>
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl space-y-5">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between py-3 border border-slate-700 rounded-xl px-4">
                    <span className="text-white font-bold">Enable Banner</span>
                    <button
                        type="button"
                        aria-label={settings.announcementBanner?.enabled ? 'Disable Banner' : 'Enable Banner'}
                        onClick={() => handleChange('announcementBanner', 'enabled', !settings.announcementBanner?.enabled)}
                        className={`relative w-12 h-6 rounded-full transition-all ${settings.announcementBanner?.enabled ? 'bg-blue-500' : 'bg-slate-700'
                            }`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.announcementBanner?.enabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Banner Text */}
                <div>
                    <label className="block text-slate-400 text-sm font-bold mb-2">Banner Text</label>
                    <input
                        type="text"
                        value={settings.announcementBanner?.text || ''}
                        onChange={e => handleChange('announcementBanner', 'text', e.target.value)}
                        placeholder="🎉 Free shipping on orders over €100!"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Banner Color */}
                <div>
                    <label className="block text-slate-400 text-sm font-bold mb-3">Banner Color</label>
                    <div className="flex gap-3">
                        {['blue', 'green', 'orange', 'red', 'purple', 'teal'].map(color => {
                            const colorMap: Record<string, string> = {
                                blue: 'bg-blue-600', green: 'bg-green-600',
                                orange: 'bg-orange-500', red: 'bg-red-600',
                                purple: 'bg-purple-600', teal: 'bg-teal-500'
                            };
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    aria-label={`Select ${color} color`}
                                    onClick={() => handleChange('announcementBanner', 'color', color)}
                                    className={`w-9 h-9 rounded-full ${colorMap[color]} transition-all ${settings.announcementBanner?.color === color
                                        ? 'ring-4 ring-offset-2 ring-offset-slate-900 ring-white scale-110'
                                        : 'opacity-70 hover:opacity-100'
                                        }`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Link */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Link URL (optional)</label>
                        <input
                            type="url"
                            value={settings.announcementBanner?.link || ''}
                            onChange={e => handleChange('announcementBanner', 'link', e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Link Text</label>
                        <input
                            type="text"
                            value={settings.announcementBanner?.linkText || ''}
                            onChange={e => handleChange('announcementBanner', 'linkText', e.target.value)}
                            placeholder="Shop Now →"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Dismissible */}
                <div className="flex items-center justify-between py-3 border border-slate-700 rounded-xl px-4">
                    <span className="text-white font-bold">Allow users to dismiss banner</span>
                    <button
                        type="button"
                        aria-label={settings.announcementBanner?.dismissible ? 'Disable dismiss' : 'Enable dismiss'}
                        onClick={() => handleChange('announcementBanner', 'dismissible', !settings.announcementBanner?.dismissible)}
                        className={`relative w-12 h-6 rounded-full transition-all ${settings.announcementBanner?.dismissible ? 'bg-blue-500' : 'bg-slate-700'
                            }`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.announcementBanner?.dismissible ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Live Preview */}
            {settings.announcementBanner?.text && (
                <div className="mt-4">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Live Preview</p>
                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-white text-sm font-medium ${settings.announcementBanner.color === 'green' ? 'bg-green-600' :
                        settings.announcementBanner.color === 'orange' ? 'bg-orange-500' :
                            settings.announcementBanner.color === 'red' ? 'bg-red-600' :
                                settings.announcementBanner.color === 'purple' ? 'bg-purple-600' :
                                    settings.announcementBanner.color === 'teal' ? 'bg-teal-500' : 'bg-blue-600'
                        }`}>
                        <span>{settings.announcementBanner.text}</span>
                        {settings.announcementBanner.link && (
                            <span className="underline opacity-80">{settings.announcementBanner.linkText || 'Learn More'}</span>
                        )}
                        {settings.announcementBanner.dismissible && (
                            <span className="opacity-60 text-xs ml-2">[×]</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
