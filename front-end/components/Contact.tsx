import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { translations } from '../i18n';
import { Send, MapPin, Phone, Mail, Globe, MessageSquare, User, AtSign, Radio, CheckCircle2, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

import { useSettings } from '../context/SettingsContext';
import { api } from '../utils/api';

interface ContactProps {
    lang: LanguageCode;
}

export const Contact: React.FC<ContactProps> = ({ lang }) => {
    const t = translations[lang];
    const { settings: globalSettings } = useSettings();
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
            name: 'Agent Name...',
            email: 'Secure Frequency...',
            message: 'Enter your query parameters here...'
        },
        buttonText: globalSettings?.contactSection?.formButton || 'Protokoll senden',
        socialLinks: [
            { icon: Facebook, url: globalSettings?.contactSection?.socialLinks?.facebook, color: 'hover:text-blue-500' },
            { icon: Instagram, url: globalSettings?.contactSection?.socialLinks?.instagram, color: 'hover:text-pink-500' },
            { icon: Twitter, url: globalSettings?.contactSection?.socialLinks?.twitter, color: 'hover:text-sky-400' },
            { icon: Linkedin, url: globalSettings?.contactSection?.socialLinks?.linkedin, color: 'hover:text-blue-700' },
            { icon: Youtube, url: globalSettings?.contactSection?.socialLinks?.youtube, color: 'hover:text-red-500' }
        ].filter(link => link.url) // Only show links that exist
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
            form.reset();
            setTimeout(() => setFormState('idle'), 3000);
        } catch (error) {
            console.error("Message sending failed:", error);
            setFormState('idle');
            // Ideally show an error toast here
        }
    };

    if (loading) {
        return (
            <section className="relative py-24 bg-black">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative py-24 bg-black overflow-hidden border-t border-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-black pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4 animate-pulse">
                        <Radio className="w-3 h-3" />
                        <span>SIGNAL_STRENGTH: 100%</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                        {t.contactTitle}
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        {t.contactSubtitle}
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">

                    <div className="space-y-6">
                        {/* Map Visual - Google Maps or Fallback */}
                        <div className="relative h-64 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50 group">
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
                                ></iframe>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent w-full h-[50%] animate-[scan_3s_linear_infinite]"></div>
                                </>
                            )}

                            <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
                                <div className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-mono">HQ COORDINATES</div>
                                    <div className="text-white font-bold text-lg">{settings.location.name}</div>
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 transition-colors group">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">{t.callUs}</div>
                                <div className="text-white font-mono text-lg">{settings.phone}</div>
                            </div>

                            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 transition-colors group">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">{t.emailUs}</div>
                                <div className="text-white font-mono text-sm">{settings.email}</div>
                            </div>
                        </div>



                        {/* Social Media Icons */}
                        {settings.socialLinks.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Social Connect</h4>
                                <div className="flex gap-4">
                                    {settings.socialLinks.map((social: any, index: number) => (
                                        <a
                                            key={index}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-all hover:scale-110 hover:border-slate-600 ${social.color}`}
                                        >
                                            <social.icon size={20} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Contact Form */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2rem] opacity-20 blur-xl"></div>
                        <div className="relative glass-modern p-8 rounded-[2rem] border border-slate-700/50">

                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-cyan-400" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{settings.title}</span>
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold ml-1 uppercase">{t.fullName}</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder={settings.labels.name}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold ml-1 uppercase">{t.email}</label>
                                    <div className="relative group">
                                        <AtSign className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder={settings.labels.email}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold ml-1 uppercase">{t.yourMessage}</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={4}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                                        placeholder={settings.labels.message}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={formState !== 'idle'}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${formState === 'success'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20'
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
                                            <span>{t.sending}</span>
                                        </>
                                    )}
                                    {formState === 'success' && (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>{t.successMsg}</span>
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
