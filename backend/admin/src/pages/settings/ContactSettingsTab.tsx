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
                    <h3 className="text-xl font-bold text-white">Kontakt & Social Media</h3>
                    <p className="text-slate-400 text-sm">Verwalten Sie Ihre Kontaktdaten, Fußzeilen-Texte und Social-Media-Links.</p>
                </div>
            </div>

            {/* Social Media Array Configuration */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-brand-primary font-bold text-lg flex items-center gap-2">
                            <LinkIcon size={20} /> Social-Media-Profile
                        </h4>
                        <p className="text-xs text-slate-400">Fügen Sie Ihre Social-Media-Seiten hinzu, damit Kunden Sie leichter finden können.</p>
                    </div>
                    <button 
                        onClick={addSocialLink}
                        className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={16} /> Link hinzufügen
                    </button>
                </div>

                {socialLinks.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/50 rounded-lg border border-dashed border-slate-800">
                        <p className="text-slate-500">Noch keine Links hinzugefügt. Klicken Sie auf "Link hinzufügen", um zu beginnen.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {socialLinks.map((link: any, index: number) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-lg border border-slate-800 relative group">
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Plattform</label>
                                    <input 
                                        type="text"
                                        title="Plattform"
                                        value={link.platform || ''}
                                        onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-brand-primary outline-none"
                                        placeholder="z.B. Instagram"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Profil-URL</label>
                                    <input 
                                        type="text"
                                        title="Profil-URL"
                                        value={link.url || ''}
                                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-brand-primary outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Icon-Stil</label>
                                    <select 
                                        value={link.iconName || 'Facebook'}
                                        onChange={(e) => updateSocialLink(index, 'iconName', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-brand-primary outline-none"
                                        title="Icon-Stil"
                                    >
                                        {AVAILABLE_ICONS.map(icon => (
                                            <option key={icon.id} value={icon.id}>{icon.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Hover-Farbe</label>
                                    <input 
                                        type="text"
                                        title="Hover-Farbe"
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
                                        title="Link entfernen"
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
                <h4 className="text-blue-400 font-bold mb-2">Hauptsitz & Kontaktdaten (HQ)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Adresse" value={contactSection.address} onChange={(v: string) => handleChange('contactSection', 'address', v)} placeholder="Musterstraße 1, 10115 Berlin" />
                    <Input label="Telefonnummer" value={contactSection.phone} onChange={(v: string) => handleChange('contactSection', 'phone', v)} placeholder="+49 30 1234 5678" />
                    <Input label="E-Mail-Adresse" value={contactSection.email} onChange={(v: string) => handleChange('contactSection', 'email', v)} placeholder="info@handyland.de" />
                    <Input label="Google Maps Link (Embed-URL)" value={contactSection.mapUrl} onChange={(v: string) => handleChange('contactSection', 'mapUrl', v)} placeholder="https://www.google.com/maps/embed?..." />
                </div>
            </div>

            {/* WhatsApp Integration */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-green-500 font-bold mb-2 flex items-center gap-2"><MessageSquare size={18} /> WhatsApp-Integration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="WhatsApp-Nummer (mit Ländercode)" value={contactSection.whatsappPhone} onChange={(v: string) => handleChange('contactSection', 'whatsappPhone', v)} placeholder="4915123456789" />
                    <Input label="Standard-Willkommensnachricht" value={contactSection.whatsappMessage} onChange={(v: string) => handleChange('contactSection', 'whatsappMessage', v)} placeholder="Hallo! Ich benötige Hilfe bei einer Reparatur." />
                </div>
            </div>

            {/* Contact Form Overrides */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-2">Kontaktformular-Texte</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Titel der Kontaktbox" value={contactSection.formTitle} onChange={(v: string) => handleChange('contactSection', 'formTitle', v)} placeholder="Schreiben Sie uns eine Nachricht" />
                    <Input label="Button-Text (Senden)" value={contactSection.formButton} onChange={(v: string) => handleChange('contactSection', 'formButton', v)} placeholder="Nachricht senden" />
                </div>
            </div>

            {/* Footer Text */}
            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-2">Globale Fußzeile (Footer)</h4>
                <Input label="Slogan (Tagline)" value={settings.footerSection?.tagline} onChange={(v: string) => handleChange('footerSection', 'tagline', v)} placeholder="Der globale Standard für Premium-Geräte und Reparaturen." />
                <Input label="Copyright-Hinweis" value={settings.footerSection?.copyright} onChange={(v: string) => handleChange('footerSection', 'copyright', v)} placeholder="© 2026 HANDYLAND. Alle Rechte vorbehalten." />
            </div>

        </div>
    );
};
