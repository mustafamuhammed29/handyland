import React, { useEffect, useState } from 'react';
import { Shield, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { api } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const PrivacyPolicy: React.FC = () => {
    const { settings } = useSettings();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const contactEmail = settings?.contactSection?.email || 'datenschutz@handyland.de';
    const companyAddress = settings?.contactSection?.address || 'HandyLand, Deutschland';

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => controller.abort(), 3000);

        const fetchContent = async () => {
            try {
                // Try privacy slug first, then fallback to datenschutz slug
                let res: any = null;
                try {
                    res = await api.get('/api/pages/privacy', {
                        signal: controller.signal,
                        timeout: 3000
                    });
                } catch {
                    res = await api.get('/api/pages/datenschutz', {
                        signal: controller.signal,
                        timeout: 3000
                    });
                }

                if (!isMounted) return;

                const data = res as any;
                if (data && data.data && data.data.content) {
                    setContent(data.data.content);
                } else if (data && data.content) {
                    setContent(data.content);
                }
            } catch (err) {
                console.warn('Using default GDPR Privacy Policy fallback:', err);
            } finally {
                clearTimeout(timeoutTimer);
                if (isMounted) setLoading(false);
            }
        };

        fetchContent();
        return () => {
            isMounted = false;
            controller.abort();
            clearTimeout(timeoutTimer);
        };
    }, []);

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-28 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                <Breadcrumbs items={[
                    { label: 'Startseite', path: '/' },
                    { label: 'Datenschutzerklärung' }
                ]} className="mb-6" />

                <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl min-h-[400px]">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Datenschutzerklärung
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                Informationen nach Art. 13, 14 und 21 der Datenschutz-Grundverordnung (DSGVO)
                            </p>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Datenschutzerklärung wird geladen...</p>
                        </div>
                    ) : content ? (
                        <div className="prose dark:prose-invert max-w-none prose-cyan">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        /* German GDPR Baseline Fallback */
                        <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-5 flex items-start gap-3">
                                <Lock className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">Schutz Ihrer persönlichen Daten</p>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                        Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                                    </p>
                                </div>
                            </div>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-cyan-500 font-mono">1.</span> Verantwortliche Stelle
                                </h2>
                                <p>
                                    Verantwortlicher für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
                                </p>
                                <div className="bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-300 space-y-1">
                                    <p className="font-bold">HandyLand</p>
                                    <p>Anschrift: {companyAddress}</p>
                                    <p>E-Mail: <a href={`mailto:${contactEmail}`} className="text-cyan-500 underline">{contactEmail}</a></p>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-cyan-500 font-mono">2.</span> Erhebung und Speicherung personenbezogener Daten
                                </h2>
                                <p>
                                    Beim Aufrufen unserer Website sowie bei der Nutzung unserer Dienstleistungen (Kauf, Ankaufbewertung, Reparaturauftrag) erheben wir folgende Daten:
                                </p>
                                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                                    <li>Bestandsdaten (z. B. Name, Liefer- und Rechnungsadresse)</li>
                                    <li>Kontaktdaten (z. B. E-Mail-Adresse, Telefonnummer)</li>
                                    <li>Gerätedaten (z. B. IMEI, Modell, Fehlerbeschreibung bei Reparaturaufträgen)</li>
                                    <li>Zahlungsdaten (z. B. gewählte Zahlungsart, Transaktions-IDs)</li>
                                    <li>Nutzungsdaten (z. B. IP-Adresse, Zugriffszeiten, besuchte Seiten)</li>
                                </ul>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung und vorvertragliche Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Betrieb).
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-cyan-500 font-mono">3.</span> Weitergabe von Daten an Dritte
                                </h2>
                                <p>
                                    Eine Weitergabe Ihrer personenbezogenen Daten erfolgt ausschließlich im Rahmen der gesetzlichen Bestimmungen an vertrauenswürdige Dienstleister:
                                </p>
                                <div className="grid sm:grid-cols-2 gap-3 mt-2">
                                    <div className="bg-slate-100/60 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <p className="font-semibold text-slate-900 dark:text-white text-sm">Zahlungsdienstleister</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Zur sicheren Zahlungsabwicklung (z. B. Stripe, PayPal, Klarna) gemäß Art. 6 Abs. 1 lit. b DSGVO.
                                        </p>
                                    </div>
                                    <div className="bg-slate-100/60 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <p className="font-semibold text-slate-900 dark:text-white text-sm">Versandunternehmen</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Zur Zustellung bestellter oder reparierter Geräte (z. B. DHL, UPS, DPD).
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-cyan-500 font-mono">4.</span> Cookies & Einwilligungsverwaltung
                                </h2>
                                <p>
                                    Unsere Internetseiten verwenden Cookies. Technisch notwendige Cookies dienen dem sicheren und funktionsfähigen Betrieb des Shops. Optionale Analyse- und Marketing-Cookies werden nur nach Ihrer ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) über unser Cookie-Banner aktiviert.
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Sie können Ihre Cookie-Einstellungen jederzeit über den Cookie-Banner oder die Browsereinstellungen anpassen und widerrufen.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-cyan-500 font-mono">5.</span> Ihre Rechte als betroffene Person
                                </h2>
                                <p>Sie haben nach der DSGVO jederzeit das Recht auf:</p>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                        <span><strong>Auskunft (Art. 15 DSGVO):</strong> Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                        <span><strong>Berichtigung (Art. 16 DSGVO):</strong> Berichtigung unrichtiger oder Vervollständigung Ihrer Daten.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                        <span><strong>Löschung (Art. 17 DSGVO):</strong> Löschung Ihrer bei uns gespeicherten personenbezogenen Daten.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                        <span><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Erhalt Ihrer Daten in einem strukturierten, maschinenlesbaren Format.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                        <span><strong>Widerspruch (Art. 21 DSGVO):</strong> Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten.</span>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-cyan-500 font-mono">6.</span> SSL-/TLS-Verschlüsselung
                                </h2>
                                <p>
                                    Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, eine SSL-/TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
                                </p>
                            </section>

                            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                                Stand: Februar 2026 • HandyLand Datenschutz
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
