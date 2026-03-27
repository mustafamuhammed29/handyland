import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';

import { Send, MapPin, Phone, Mail, Globe, MessageSquare, User, AtSign, Radio, CheckCircle2, Facebook, Instagram, Twitter, Linkedin, Youtube, Twitch, Github, Video } from 'lucide-react';

import { useSettings } from '../context/SettingsContext';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

interface ContactProps {}

export const Contact: React.FC<ContactProps> = () => {
    const { t } = useTranslation();
    const { settings: globalSettings } = useSettings();
    const { addToast } = useToast();
    const [formState, setFormState] = useState<'idle' | 'sending' | 'success'>('idle');

    // Merge global settings with defaults if necessary, or just use them directly
    const settings = {
        location: { name: globalSettings?.contactSection?.address || 'Berlin, HQ', coordinates: 'Europe' },
        phone: globalSettings?.contactSection?.phone || '+49 30 1234 5678',
        email: globalSettings?.contactSection?.email || 'support@handyland.de',
        mapUrl: globalSettings?.contactSection?.mapUrl || '',
        formspreeEndpoint: '',
        title: globalSettings?.contactSection?.formTitle || 'Secure Message Channel',
        labels: {
            name: 'Your full name...',
            email: 'Your email address...',
            message: 'How can we help you?'
        },
        buttonText: globalSettings?.contactSection?.formButton || 'Protokoll senden',
        socialLinks: Array.isArray(globalSettings?.contactSection?.socialLinks) 
            ? globalSettings.contactSection.socialLinks 
            : []
    };

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Mock fetch
        setLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormState('sending');
        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            await api.post('/api/messages', data);
            setFormState('success');
            addToast('Nachricht erfolgreich gesendet!', 'success');
            form.reset();
            setTimeout(() => setFormState('idle'), 3000);
        } catch (error) {
            console.error("Message sending failed:", error);
            setFormState('idle');
            addToast('Fehler beim Senden der Nachricht. Bitte versuche es später noch einmal.', 'error');
        }
    };

    if (loading) {
        return (
            <section className="relative py-24 bg-black">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative py-24 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-900 transition-colors duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-blue-100/30 dark:from-blue-900/10 via-white dark:via-slate-950 to-slate-50 dark:to-black pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-brand-primary/30 text-brand-primary text-xs font-mono mb-4 animate-pulse">
                        <Radio className="w-3 h-3" />
                        <span>SIGNAL_STRENGTH: 100%</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        {t('contactTitle', 'Contact Us')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        {t('contactSubtitle', "We're here to help")}
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">

                    <div className="space-y-6">
                        {/* Map Visual - Google Maps or Fallback */}
                        <div className="relative h-64 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 group">
                            {settings.mapUrl ? (
                                <iframe
                                    src={settings.mapUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="absolute inset-0"
                                    title="Google Maps Location"
                                ></iframe>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent w-full h-[50%] animate-[scan_3s_linear_infinite]"></div>
                                </>
                            )}

                            <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
                                <div className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 text-brand-primary shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-300 dark:text-slate-400 font-mono">HQ COORDINATES</div>
                                    <div className="text-white font-bold text-lg">{settings.location.name}</div>
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="p-4 md:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-brand-primary/50 transition-colors group flex flex-col items-center text-center">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-2 md:mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                                    <Phone className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase font-bold mb-1">{t('callUs', 'Call Us')}</div>
                                <div className="text-slate-800 dark:text-white font-mono text-xs md:text-lg break-all">{settings.phone}</div>
                            </div>

                            <div className="p-4 md:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-brand-primary/50 transition-colors group flex flex-col items-center text-center">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-2 md:mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Mail className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase font-bold mb-1">{t('emailUs', 'Email Us')}</div>
                                <div className="text-slate-800 dark:text-white font-mono text-xs md:text-sm break-all">{settings.email}</div>
                            </div>
                        </div>



                        {/* Social Media Icons */}
                        {settings.socialLinks.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Social Connect</h4>
                                <div className="flex flex-wrap gap-4">
                                    {settings.socialLinks.map((social: any, index: number) => {
                                        const iconMap: Record<string, React.ElementType> = {
                                            'Facebook': Facebook,
                                            'Instagram': Instagram,
                                            'Twitter': Twitter,
                                            'Linkedin': Linkedin,
                                            'Youtube': Youtube,
                                            'Twitch': Twitch,
                                            'Github': Github,
                                            'MessageCircle': MessageSquare,
                                            'Send': Send,
                                            'Video': Video,
                                        };
                                        const IconComponent = iconMap[social.iconName] || Globe;
                                        
                                        return (
                                            <a
                                                key={index}
                                                href={social.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all hover:scale-110 hover:border-slate-400 dark:hover:border-slate-600 ${social.colorClass || 'hover:text-brand-primary'}`}
                                                title={`Visit our ${social.platform || 'social media'} page`}
                                                aria-label={`Visit our ${social.platform || 'social media'} page`}
                                            >
                                                <IconComponent size={20} />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Contact Form */}
                    <div className="relative z-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-[2rem] opacity-20 blur-xl pointer-events-none" style={{isolation: 'isolate', zIndex: -1}}></div>
                        <div className="relative glass-modern p-8 rounded-[2rem] border border-slate-700/50">

                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-brand-primary" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{settings.title}</span>
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold ml-1 uppercase">{t('fullName', 'Full Name')}</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                            placeholder={settings.labels.name}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold ml-1 uppercase">{t('email', 'Email Address')}</label>
                                    <div className="relative group">
                                        <AtSign className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                            placeholder={settings.labels.email}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold ml-1 uppercase">{t('yourMessage', 'Your Message')}</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={4}
                                        className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                                        placeholder={settings.labels.message}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={formState !== 'idle'}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${formState === 'success'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white shadow-lg shadow-cyan-900/20'
                                        }`}
                                >
                                    {formState === 'idle' && (
                                        <>
                                            <span>{settings.buttonText}</span>
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                    {formState === 'sending' && (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('sending', 'Sending...')}</span>
                                        </>
                                    )}
                                    {formState === 'success' && (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>{t('successMsg', 'Successfully sent!')}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
