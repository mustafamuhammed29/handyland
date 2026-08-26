import { Input } from '../SettingsManager';
import { Type, Smartphone, Activity, Palette, ShieldCheck, Gamepad2, Video, Sparkles, HelpCircle } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import { HeroVideoUpload } from '../../components/HeroVideoUpload';

export const HeroSettingsTab = ({ settings, handleChange }: any) => {
    const heroMedia = settings.hero?.media || {
        mode: 'content',
        videoUrl: '',
        posterUrl: '',
        altText: ''
    };

    const updateMedia = (updates: Record<string, any>) => {
        handleChange('hero', 'media', {
            ...heroMedia,
            ...updates,
            updatedAt: new Date().toISOString()
        });
    };

    const isVideoMode = heroMedia.mode === 'video';

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-fuchsia-500/10 rounded-xl">
                    <Gamepad2 className="text-fuchsia-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Hero Section Configuration</h3>
                    <p className="text-slate-400 text-sm">Control the interactive header showcase (3D device card or video showcase) seen by all landing page visitors.</p>
                </div>
            </div>

            {/* Media Mode Selector */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-4 bg-slate-900/60 shadow-lg">
                <div className="flex items-center justify-between">
                    <h4 className="text-cyan-400 font-bold flex items-center gap-2 px-1">
                        <Sparkles size={18} /> Hero Visual Display Mode
                    </h4>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-cyan-400 border border-cyan-500/20">
                        Current: {isVideoMode ? 'Video Mode' : 'Content Mode'}
                    </span>
                </div>
                <p className="text-xs text-slate-400 px-1">Choose whether the right side of the landing page hero displays the interactive 3D phone mockup or a video showcase.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Content Mode Card */}
                    <button
                        type="button"
                        onClick={() => updateMedia({ mode: 'content' })}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                            !isVideoMode
                                ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/30'
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                    >
                        <div className={`p-3 rounded-xl ${!isVideoMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Smartphone size={22} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">Content Mode</span>
                                {!isVideoMode && <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">Active</span>}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Interactive 3D phone mockup with parallax mouse rotation, promoted device card, and floating statistics badges.
                            </p>
                        </div>
                    </button>

                    {/* Video Mode Card */}
                    <button
                        type="button"
                        onClick={() => updateMedia({ mode: 'video' })}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                            isVideoMode
                                ? 'bg-fuchsia-950/40 border-fuchsia-500 shadow-md shadow-fuchsia-950/30'
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                    >
                        <div className={`p-3 rounded-xl ${isVideoMode ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Video size={22} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">Video Mode</span>
                                {isVideoMode && <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-bold">Active</span>}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Upload a video showcase (MP4/WebM) with auto-play, accessible play controls, poster fallback, and reduced-motion support.
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Video Mode Configuration Section */}
            {isVideoMode && (
                <div className="p-5 border border-fuchsia-500/40 rounded-xl space-y-6 bg-slate-900/70 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="text-fuchsia-400 font-bold flex items-center gap-2 px-1">
                            <Video size={18} /> Hero Video Settings & Asset
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <HelpCircle size={14} />
                            <span>Fallback to Content Mode if video is missing or fails</span>
                        </div>
                    </div>

                    <div className="space-y-5 px-1">
                        <HeroVideoUpload
                            value={heroMedia.videoUrl}
                            onChange={(url: string) => updateMedia({ videoUrl: url })}
                            posterUrl={heroMedia.posterUrl || settings.hero?.heroImage}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <ImageUpload
                                    label="Video Poster / Fallback Image (Optional)"
                                    value={heroMedia.posterUrl || ''}
                                    onChange={(url: string) => updateMedia({ posterUrl: url })}
                                />
                                <p className="text-[11px] text-slate-500 mt-1">Displayed while video is loading or if user prefers reduced motion.</p>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label="Video Accessibility Description (Alt Text)"
                                    value={heroMedia.altText || ''}
                                    onChange={(v: string) => updateMedia({ altText: v })}
                                    placeholder="HandyLand high-tech repair showcase"
                                />
                                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                                    <span className="font-bold text-slate-200 block">Accessibility & Performance Rules:</span>
                                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                                        <li>Videos start muted and loop smoothly.</li>
                                        <li>Users with <code>prefers-reduced-motion</code> will see the video paused by default.</li>
                                        <li>Interactive play/pause toggle is provided on customer UI.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Typography & Messaging */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-fuchsia-400 font-bold mb-2 flex items-center gap-2 px-1">
                    <Type size={18} /> Typography & Messaging
                </h4>
                <div className="space-y-4 px-1">
                    <Input label="Main Impact Headline" value={settings.hero?.headline} onChange={(v: string) => handleChange('hero', 'headline', v)} textarea />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Subheadline (English)" value={settings.hero?.subheadline} onChange={(v: string) => handleChange('hero', 'subheadline', v)} />
                        <Input label="Subheadline (Arabic)" value={settings.hero?.subheadlineAr} onChange={(v: string) => handleChange('hero', 'subheadlineAr', v)} />
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                    <h5 className="text-slate-300 text-sm font-bold mb-3">Call to Action Buttons</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Primary Button Text (Market)" value={settings.hero?.buttonMarket} onChange={(v: string) => handleChange('hero', 'buttonMarket', v)} placeholder="Shop Now" />
                        <Input label="Secondary Button Text (Valuation)" value={settings.hero?.buttonValuation} onChange={(v: string) => handleChange('hero', 'buttonValuation', v)} placeholder="Sell Device" />
                    </div>
                </div>
            </div>

            {/* 3D Mockup Screen content (Shown in Content Mode, or as secondary config in Video Mode) */}
            <div className={`p-5 border rounded-xl space-y-5 transition-all ${
                !isVideoMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800 bg-slate-900/30'
            }`}>
                <div className="flex items-center justify-between">
                    <h4 className="text-blue-400 font-bold flex items-center gap-2 px-1">
                        <Smartphone size={18} /> 3D Device Screen Preview & Promoted Item
                    </h4>
                    {isVideoMode && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Used as Content fallback</span>
                    )}
                </div>
                <p className="text-xs text-slate-500 mb-4 px-1">
                    {!isVideoMode
                        ? 'This fills the interactive floating phone mockup on the right side of the screen.'
                        : 'Configures the fallback 3D phone mockup used if video is removed or unavailable.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
                    <div>
                        <ImageUpload 
                            label="App Screen Background" 
                            value={settings.hero?.heroImage} 
                            onChange={(v: string) => handleChange('hero', 'heroImage', v)} 
                        />
                    </div>
                    <div className="space-y-4">
                        <Input label="Promoted Product Name" value={settings.hero?.productName} onChange={(v: string) => handleChange('hero', 'productName', v)} placeholder="iPhone 15 Pro Max" />
                        <Input label="Promoted Product Price" value={settings.hero?.productPrice} onChange={(v: string) => handleChange('hero', 'productPrice', v)} placeholder="€1199" />
                        <Input label="Offer Label (e.g. FLASH SALE)" value={settings.hero?.productLabel} onChange={(v: string) => handleChange('hero', 'productLabel', v)} placeholder="HOT DEAL" />
                    </div>
                </div>
            </div>

            {/* Floating Statistics & Trust */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2 px-1">
                    <Activity size={18} /> Floating Elements & Badges
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-4 border border-slate-800 rounded-lg">
                    <div>
                        <h5 className="text-slate-400 text-xs font-bold uppercase mb-3">Floating Stat Box (Right)</h5>
                        <Input label="Stat Title" value={settings.hero?.stat1Title} onChange={(v: string) => handleChange('hero', 'stat1Title', v)} placeholder="Device Sold" />
                        <div className="mt-2"><Input label="Stat Value" value={settings.hero?.stat1Value} onChange={(v: string) => handleChange('hero', 'stat1Value', v)} placeholder="+24% this week" /></div>
                    </div>
                    <div>
                        <h5 className="text-slate-400 text-xs font-bold uppercase mb-3">Floating Stat Box (Left)</h5>
                        <Input label="Stat Title" value={settings.hero?.stat2Title} onChange={(v: string) => handleChange('hero', 'stat2Title', v)} placeholder="Customer Rating" />
                        <div className="mt-2"><Input label="Stat Value" value={settings.hero?.stat2Value} onChange={(v: string) => handleChange('hero', 'stat2Value', v)} placeholder="4.9/5 Excellent" /></div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 px-1">
                    <h5 className="text-slate-300 text-sm font-bold mb-3 flex items-center gap-2"><ShieldCheck size={16}/> Trust Indicators</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Badge 1" value={settings.hero?.trustBadge1} onChange={(v: string) => handleChange('hero', 'trustBadge1', v)} placeholder="VERIFIED SELLERS" />
                        <Input label="Badge 2" value={settings.hero?.trustBadge2} onChange={(v: string) => handleChange('hero', 'trustBadge2', v)} placeholder="24/7 SUPPORT" />
                        <Input label="Badge 3" value={settings.hero?.trustBadge3} onChange={(v: string) => handleChange('hero', 'trustBadge3', v)} placeholder="4.9 RATED" />
                    </div>
                </div>
            </div>

            {/* Colors */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2 px-1">
                    <Palette size={18} /> Atmospheric Colors
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Accent Color</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={settings.hero?.accentColor || '#0ea5e9'} onChange={(e) => handleChange('hero', 'accentColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-none p-0" title="Accent Color" />
                            <span className="text-slate-300">{settings.hero?.accentColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Dark Mode Bg Start</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={settings.hero?.bgStart || '#0f172a'} onChange={(e) => handleChange('hero', 'bgStart', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-none p-0" title="Dark Mode Background Start" />
                            <span className="text-slate-300">{settings.hero?.bgStart}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Dark Mode Bg End</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={settings.hero?.bgEnd || '#020617'} onChange={(e) => handleChange('hero', 'bgEnd', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-none p-0" title="Dark Mode Background End" />
                            <span className="text-slate-300">{settings.hero?.bgEnd}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
