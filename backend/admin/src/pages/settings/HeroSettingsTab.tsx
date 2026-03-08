import { Input } from '../SettingsManager';

export const HeroSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Hero Section Configuration</h3>
            <Input label="Headline" value={settings.hero?.headline} onChange={(v: string) => handleChange('hero', 'headline', v)} textarea />
            <Input label="Subheadline" value={settings.hero?.subheadline} onChange={(v: string) => handleChange('hero', 'subheadline', v)} />
            {/* FIXED: Added Arabic subheadline field for admin control */}
            <Input label="Subheadline (Arabic)" value={settings.hero?.subheadlineAr} onChange={(v: string) => handleChange('hero', 'subheadlineAr', v)} />

            <div className="grid grid-cols-2 gap-4">
                <Input label="Button 1 (Market)" value={settings.hero?.buttonMarket} onChange={(v: string) => handleChange('hero', 'buttonMarket', v)} />
                <Input label="Button 2 (Valuation)" value={settings.hero?.buttonValuation} onChange={(v: string) => handleChange('hero', 'buttonValuation', v)} />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Input label="Trust Badge 1" value={settings.hero?.trustBadge1} onChange={(v: string) => handleChange('hero', 'trustBadge1', v)} placeholder="VERIFIED SELLERS" />
                <Input label="Trust Badge 2" value={settings.hero?.trustBadge2} onChange={(v: string) => handleChange('hero', 'trustBadge2', v)} placeholder="24/7 SUPPORT" />
                <Input label="Trust Badge 3" value={settings.hero?.trustBadge3} onChange={(v: string) => handleChange('hero', 'trustBadge3', v)} placeholder="4.9 RATED" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Background Start Color" value={settings.hero?.bgStart} onChange={(v: string) => handleChange('hero', 'bgStart', v)} type="color" />
                <Input label="Background End Color" value={settings.hero?.bgEnd} onChange={(v: string) => handleChange('hero', 'bgEnd', v)} type="color" />
            </div>

            <Input label="Accent Color" value={settings.hero?.accentColor} onChange={(v: string) => handleChange('hero', 'accentColor', v)} type="color" />

            <div className="p-4 border border-slate-700 rounded-xl mt-6">
                <h4 className="text-blue-400 font-bold mb-4">Visuals & Product</h4>
                <Input label="Phone Screen Image URL" value={settings.hero?.heroImage} onChange={(v: string) => handleChange('hero', 'heroImage', v)} placeholder="https://..." />
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input label="Product Name" value={settings.hero?.productName} onChange={(v: string) => handleChange('hero', 'productName', v)} placeholder="iPhone 15 Pro" />
                    <Input label="Product Price" value={settings.hero?.productPrice} onChange={(v: string) => handleChange('hero', 'productPrice', v)} placeholder="€950" />
                    <Input label="Label (e.g. Current Offer)" value={settings.hero?.productLabel} onChange={(v: string) => handleChange('hero', 'productLabel', v)} placeholder="CURRENT OFFER" />
                </div>
            </div>

            <div className="p-4 border border-slate-700 rounded-xl mt-6">
                <h4 className="text-blue-400 font-bold mb-4">Floating Stats Cards</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Input label="Stat 1 Title" value={settings.hero?.stat1Title} onChange={(v: string) => handleChange('hero', 'stat1Title', v)} placeholder="Device Sold" />
                        <Input label="Stat 1 Value" value={settings.hero?.stat1Value} onChange={(v: string) => handleChange('hero', 'stat1Value', v)} placeholder="+24% this week" />
                    </div>
                    <div>
                        <Input label="Stat 2 Title" value={settings.hero?.stat2Title} onChange={(v: string) => handleChange('hero', 'stat2Title', v)} placeholder="Customer Rating" />
                        <Input label="Stat 2 Value" value={settings.hero?.stat2Value} onChange={(v: string) => handleChange('hero', 'stat2Value', v)} placeholder="4.9/5.0 Excellent" />
                    </div>
                </div>
            </div>
        </div>
    );
};
