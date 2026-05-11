import { Globe } from 'lucide-react';
import { Input } from '../SettingsManager';
import ImageUpload from '../../components/ImageUpload';

export const SEOTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <Globe className="text-indigo-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">SEO & Meta Settings</h3>
                    <p className="text-slate-400 text-sm">Configure how your site appears on search engines and social media.</p>
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-indigo-400 font-bold mb-4">Site Identity (Favicon & OG Image)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Favicon (Browser Tab Icon)</label>
                        <ImageUpload
                            value={settings.seo?.faviconUrl || ''}
                            onChange={(url: string) => handleChange('seo', 'faviconUrl', url)}
                            placeholder="Upload Favicon"
                            bucket="misc"
                        />
                        <p className="text-xs text-slate-500 mt-2">Recommended: 32x32px or 64x64px square image (.ico or .png).</p>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Default Social Share Image (OG:Image)</label>
                        <ImageUpload
                            value={settings.seo?.defaultOgImage || ''}
                            onChange={(url: string) => handleChange('seo', 'defaultOgImage', url)}
                            placeholder="Upload Social Image"
                            bucket="misc"
                        />
                        <p className="text-xs text-slate-500 mt-2">Recommended: 1200x630px. Used when sharing links on Facebook, Twitter, WhatsApp, etc.</p>
                    </div>
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-indigo-400 font-bold mb-4">Global SEO Metadata</h4>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Default Meta Title"
                        value={settings.seo?.defaultMetaTitle || ''}
                        onChange={(v: string) => handleChange('seo', 'defaultMetaTitle', v)}
                        placeholder="HandyLand - Premium Electronics"
                    />
                    <Input
                        label="Default Meta Description"
                        value={settings.seo?.defaultMetaDescription || ''}
                        onChange={(v: string) => handleChange('seo', 'defaultMetaDescription', v)}
                        textarea
                        placeholder="Welcome to HandyLand. We offer the best repairs and electronics..."
                    />
                    <Input
                        label="Default Keywords"
                        value={settings.seo?.defaultKeywords || ''}
                        onChange={(v: string) => handleChange('seo', 'defaultKeywords', v)}
                        placeholder="handyland, repair, iphone, samsung"
                    />
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-indigo-400 font-bold mb-4">Analytics & Tracking</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Google Analytics ID (G-XXXXXXXXXX)"
                        value={settings.seo?.googleAnalyticsId || ''}
                        onChange={(v: string) => handleChange('seo', 'googleAnalyticsId', v)}
                        placeholder="G-..."
                    />
                    <Input
                        label="Facebook Pixel ID"
                        value={settings.seo?.facebookPixelId || ''}
                        onChange={(v: string) => handleChange('seo', 'facebookPixelId', v)}
                        placeholder="1234567890..."
                    />
                    <Input
                        label="Google Site Verification ID"
                        value={settings.seo?.googleSiteVerificationId || ''}
                        onChange={(v: string) => handleChange('seo', 'googleSiteVerificationId', v)}
                        placeholder="..."
                    />
                </div>
            </div>
        </div>
    );
};
