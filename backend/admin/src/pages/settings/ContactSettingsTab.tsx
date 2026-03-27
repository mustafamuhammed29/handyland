import React from 'react';
import { Input } from '../SettingsManager';
import { MessageSquare, Plus, Trash2, Link as LinkIcon } from 'lucide-react';

const AVAILABLE_ICONS = [
    { id: 'Facebook', label: 'Facebook' },
    { id: 'Instagram', label: 'Instagram' },
    { id: 'Twitter', label: 'X (Twitter)' },
    { id: 'Linkedin', label: 'LinkedIn' },
    { id: 'Youtube', label: 'YouTube' },
    { id: 'Twitch', label: 'Twitch' },
    { id: 'Github', label: 'GitHub' },
    { id: 'Google', label: 'Google / Search' },
    { id: 'GoogleMaps', label: 'Google Maps / Location' },
    { id: 'Star', label: 'Google Reviews / Rating' },
    { id: 'MessageCircle', label: 'WhatsApp / Chat' },
    { id: 'Send', label: 'Telegram' },
    { id: 'Video', label: 'TikTok / Video' },
];

export const ContactSettingsTab = ({ settings, handleChange }: any) => {
    // Ensure contactSection exists
    const contactSection = settings.contactSection || {};
    // Ensure socialLinks is an array. If it's an object from old schema, convert or reset it.
    let socialLinks = contactSection.socialLinks;
    if (!Array.isArray(socialLinks)) {
        socialLinks = [];
    }

    const addSocialLink = () => {
        const newLink = { platform: 'Facebook', url: '', iconName: 'Facebook', colorClass: 'hover:text-blue-500' };
        handleChange('contactSection', 'socialLinks', [...socialLinks, newLink]);
    };

    const updateSocialLink = (index: number, key: string, value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = { ...newLinks[index], [key]: value };
        
        // Auto-assign common colors based on platform selection
        if (key === 'iconName') {
            const colorMap: Record<string, string> = {
                'Facebook': 'hover:text-blue-600',
                'Instagram': 'hover:text-pink-500',
                'Twitter': 'hover:text-slate-300',
                'Linkedin': 'hover:text-blue-500',
                'Youtube': 'hover:text-red-500',
                'Twitch': 'hover:text-purple-500',
                'Google': 'hover:text-amber-500',
                'GoogleMaps': 'hover:text-emerald-500',
                'Star': 'hover:text-yellow-400',
                'MessageCircle': 'hover:text-green-500',
                'Send': 'hover:text-sky-500',
                'Video': 'hover:text-slate-200',
            };
            if (colorMap[value]) {
                newLinks[index].colorClass = colorMap[value];
            }
        }
        
        handleChange('contactSection', 'socialLinks', newLinks);
    };

    const removeSocialLink = (index: number) => {
        const newLinks = socialLinks.filter((_: any, i: number) => i !== index);
        handleChange('contactSection', 'socialLinks', newLinks);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                    <MessageSquare className="text-blue-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Contact & Social Setup</h3>
                    <p className="text-slate-400 text-sm">Configure how customers reach you and your social media presence.</p>
                </div>
            </div>

            {/* Social Media Array Configuration */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-brand-primary font-bold text-lg flex items-center gap-2">
                            <LinkIcon size={20} /> Social Media Links
                        </h4>
                        <p className="text-xs text-slate-400">Add, remove, and sort your social media platforms dynamically.</p>
                    </div>
                    <button 
                        onClick={addSocialLink}
                        className="bg-brand-primary text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-primary/90 transition-colors"
                    >
                        <Plus size={16} /> Add Link
                    </button>
                </div>

                {socialLinks.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/50 rounded-lg border border-dashed border-slate-800">
                        <p className="text-slate-500">No social media links added yet. Click "Add Link" to start.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {socialLinks.map((link: any, index: number) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-lg border border-slate-800 relative group">
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Platform Name</label>
                                    <input 
                                        type="text"
                                        value={link.platform || ''}
                                        onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-brand-primary outline-none"
                                        placeholder="e.g. Instagram"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Profile URL</label>
                                    <input 
                                        type="text"
                                        value={link.url || ''}
                                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-brand-primary outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Icon Style</label>
                                    <select 
                                        value={link.iconName || 'Facebook'}
                                        onChange={(e) => updateSocialLink(index, 'iconName', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-brand-primary outline-none"
                                    >
                                        {AVAILABLE_ICONS.map(icon => (
                                            <option key={icon.id} value={icon.id}>{icon.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Hover Color Class</label>
                                    <input 
                                        type="text"
                                        value={link.colorClass || ''}
                                        onChange={(e) => updateSocialLink(index, 'colorClass', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-brand-primary outline-none"
                                        placeholder="hover:text-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    <button 
                                        onClick={() => removeSocialLink(index)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-4"
                                        title="Remove Link"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* HQ Contact Details */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-2">HQ Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Address / HQ" value={contactSection.address} onChange={(v: string) => handleChange('contactSection', 'address', v)} placeholder="HandyLand HQ, Berlin" />
                    <Input label="Phone Number" value={contactSection.phone} onChange={(v: string) => handleChange('contactSection', 'phone', v)} placeholder="+49 30 1234 5678" />
                    <Input label="Email Address" value={contactSection.email} onChange={(v: string) => handleChange('contactSection', 'email', v)} placeholder="info@handyland.de" />
                    <Input label="Map URL (Google Maps Embed Link)" value={contactSection.mapUrl} onChange={(v: string) => handleChange('contactSection', 'mapUrl', v)} placeholder="https://www.google.com/maps/embed?..." />
                </div>
            </div>

            {/* WhatsApp Integration */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-green-500 font-bold mb-2 flex items-center gap-2"><MessageSquare size={18} /> WhatsApp Integration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="WhatsApp Number" value={contactSection.whatsappPhone} onChange={(v: string) => handleChange('contactSection', 'whatsappPhone', v)} placeholder="4915123456789 (Include country code)" />
                    <Input label="Default Welcome Message" value={contactSection.whatsappMessage} onChange={(v: string) => handleChange('contactSection', 'whatsappMessage', v)} placeholder="Hello! I need help with a repair." />
                </div>
            </div>

            {/* Contact Form Overrides */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-2">Contact Form Text Overrides</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Form Box Title" value={contactSection.formTitle} onChange={(v: string) => handleChange('contactSection', 'formTitle', v)} placeholder="Secure Message Channel" />
                    <Input label="Form Button Text" value={contactSection.formButton} onChange={(v: string) => handleChange('contactSection', 'formButton', v)} placeholder="Send Protocol" />
                </div>
            </div>

            {/* Footer Text */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-2">Global Footer Configuration</h4>
                <Input label="Footer Tagline" value={settings.footerSection?.tagline} onChange={(v: string) => handleChange('footerSection', 'tagline', v)} placeholder="The global standard for premium device trading and repair." />
                <Input label="Copyright Text" value={settings.footerSection?.copyright} onChange={(v: string) => handleChange('footerSection', 'copyright', v)} placeholder="© 2026 HANDYLAND" />
            </div>

        </div>
    );
};
