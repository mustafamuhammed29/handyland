import { Input } from '../SettingsManager';
import { Type, Smartphone, Activity, Palette, ShieldCheck, Gamepad2 } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

export const HeroSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-fuchsia-500/10 rounded-xl">
                    <Gamepad2 className="text-fuchsia-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Hero 3D Section Configuration</h3>
                    <p className="text-slate-400 text-sm">Control the interactive Wow-Effect header showcased to all visitors on the home page.</p>
                </div>
            </div>

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

            {/* 3D Mockup Screen content */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2 px-1">
                    <Smartphone size={18} /> 3D Device Screen Preview
                </h4>
                <p className="text-xs text-slate-500 mb-4 px-1">This fills the interactive floating phone mockup on the right side of the screen.</p>
                
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
