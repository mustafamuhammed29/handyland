import { Input } from '../SettingsManager';
import { MessageSquare } from 'lucide-react';

export const ContactSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Contact & Footer Configuration</h3>

            <div className="p-4 border border-slate-700 rounded-xl mb-6">
                <h4 className="text-blue-400 font-bold mb-4">Contact Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Address / HQ" value={settings.contactSection?.address} onChange={(v: string) => handleChange('contactSection', 'address', v)} />
                    <Input label="Phone Number" value={settings.contactSection?.phone} onChange={(v: string) => handleChange('contactSection', 'phone', v)} />
                    <Input label="Email Address" value={settings.contactSection?.email} onChange={(v: string) => handleChange('contactSection', 'email', v)} />
                    <Input label="Map URL (Embed)" value={settings.contactSection?.mapUrl} onChange={(v: string) => handleChange('contactSection', 'mapUrl', v)} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input label="Form Title" value={settings.contactSection?.formTitle} onChange={(v: string) => handleChange('contactSection', 'formTitle', v)} />
                    <Input label="Form Button Text" value={settings.contactSection?.formButton} onChange={(v: string) => handleChange('contactSection', 'formButton', v)} />
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-green-500 font-bold mb-4 flex items-center gap-2"><MessageSquare size={18} /> WhatsApp Widget Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="WhatsApp Number (e.g. 4915123456789)" value={settings.contactSection?.whatsappPhone} onChange={(v: string) => handleChange('contactSection', 'whatsappPhone', v)} placeholder="4915123456789" />
                        <Input label="Default Welcome Message" value={settings.contactSection?.whatsappMessage} onChange={(v: string) => handleChange('contactSection', 'whatsappMessage', v)} placeholder="Hello, I need help" />
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-blue-400 font-bold mb-4 text-sm uppercase">Social Media Links</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Facebook URL" value={settings.contactSection?.socialLinks?.facebook} onChange={(v: string) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, facebook: v })} />
                        <Input label="Instagram URL" value={settings.contactSection?.socialLinks?.instagram} onChange={(v: string) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, instagram: v })} />
                        <Input label="Twitter (X) URL" value={settings.contactSection?.socialLinks?.twitter} onChange={(v: string) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, twitter: v })} />
                        <Input label="LinkedIn URL" value={settings.contactSection?.socialLinks?.linkedin} onChange={(v: string) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, linkedin: v })} />
                        <Input label="YouTube URL" value={settings.contactSection?.socialLinks?.youtube} onChange={(v: string) => handleChange('contactSection', 'socialLinks', { ...settings.contactSection.socialLinks, youtube: v })} />
                    </div>
                </div>
            </div>

            <div className="p-4 border border-slate-700 rounded-xl">
                <h4 className="text-blue-400 font-bold mb-4">Footer Settings</h4>
                <Input label="Footer Tagline" value={settings.footerSection?.tagline} onChange={(v: string) => handleChange('footerSection', 'tagline', v)} />
                <Input label="Copyright Text" value={settings.footerSection?.copyright} onChange={(v: string) => handleChange('footerSection', 'copyright', v)} />
            </div>
        </div>
    );
};
