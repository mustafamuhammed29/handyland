import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Scale, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { api } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const TermsAndConditions: React.FC = () => {
    const { settings } = useSettings();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const contactEmail = settings?.contactSection?.email || 'support@handyland.de';
    const companyAddress = settings?.contactSection?.address || 'HandyLand, Deutschland';

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => controller.abort(), 3000);

        const fetchContent = async () => {
            try {
                const res = await api.get<any>('/api/pages/agb', {
                    signal: controller.signal,
                    timeout: 3000
                });
                if (!isMounted) return;

                const data = res as any;
                if (data && data.data && data.data.content) {
                    setContent(data.data.content);
                } else if (data && data.content) {
                    setContent(data.content);
                }
            } catch (err) {
                console.warn('Using default German AGB fallback:', err);
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
                    { label: 'AGB' }
                ]} className="mb-6" />

                <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl min-h-[400px]">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Allgemeine Geschäftsbedingungen
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                HandyLand Online-Shop, Reparatur- & Ankauf-Service
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm">AGB werden geladen...</p>
                        </div>
                    ) : content ? (
                        <div className="prose dark:prose-invert max-w-none prose-indigo">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        /* German AGB Baseline Fallback */
                        <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-2xl p-5 flex items-start gap-3">
                                <Scale className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">Transparente & faire Vertragsbedingungen</p>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                        Die nachfolgenden Geschäftsbedingungen gelten für alle Bestellungen, Reparaturaufträge und Ankaufstransaktionen über HandyLand.
                                    </p>
                                </div>
                            </div>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-indigo-500 font-mono">§ 1</span> Geltungsbereich & Anbieter
                                </h2>
                                <p>
                                    Für die Geschäftsbeziehung zwischen HandyLand (nachfolgend „Anbieter“) und dem Kunden (nachfolgend „Kunde“) gelten ausschließlich die nachfolgenden Allgemeinen Geschäftsbedingungen in ihrer zum Zeitpunkt der Bestellung gültigen Fassung.
                                </p>
                                <div className="bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-300 space-y-1">
                                    <p className="font-bold">HandyLand</p>
                                    <p>Anschrift: {companyAddress}</p>
                                    <p>E-Mail: <a href={`mailto:${contactEmail}`} className="text-indigo-500 underline">{contactEmail}</a></p>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-indigo-500 font-mono">§ 2</span> Vertragsschluss
                                </h2>
                                <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-300">
                                    <li>
                                        <strong>Warenkauf (Shop):</strong> Die Präsentation der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot, sondern eine unverbindliche Aufforderung zur Bestellung dar. Durch Anklicken des Buttons „Zahlungspflichtig bestellen“ gibt der Kunde ein verbindliches Kaufangebot ab.
                                    </li>
                                    <li>
                                        <strong>Reparatur-Service:</strong> Mit der Buchung eines Reparaturauftrags beauftragt der Kunde den Anbieter mit der Diagnose und Instandsetzung des angegebenen Gerätemodells.
                                    </li>
                                    <li>
                                        <strong>Geräteankauf (Valuation):</strong> Die Online-Wertermittlung ist unverbindlich. Der verbindliche Ankaufvertrag kommt erst nach physischer Prüfung des Geräts und finaler Annahme des Angebots durch beide Parteien zustande.
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-indigo-500 font-mono">§ 3</span> Preise, Versand & Zahlungsbedingungen
                                </h2>
                                <p>
                                    Alle angegebenen Preise verstehen sich in Euro (EUR) inklusive der jeweils gültigen gesetzlichen Mehrwertsteuer. Es gelten die zum Zeitpunkt der Bestellung ausgewiesenen Versandkosten. Dem Kunden stehen die im Bestellprozess angegebenen Zahlungsmöglichkeiten zur Verfügung (z. B. Kreditkarte, PayPal, Sofortüberweisung, Klarna).
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-indigo-500 font-mono">§ 4</span> Lieferung & Eigentumsvorbehalt
                                </h2>
                                <p>
                                    Die Lieferung erfolgt an die vom Kunden angegebene Lieferadresse. Bis zur vollständigen Bezahlung bleibt die gelieferte Ware Eigentum des Anbieters.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-indigo-500 font-mono">§ 5</span> Gesetzliches Widerrufsrecht
                                </h2>
                                <p>
                                    Verbrauchern steht bei Fernabsatzverträgen ein 14-tägiges gesetzliches Widerrufsrecht ohne Angabe von Gründen zu. Um das Widerrufsrecht auszuüben, muss der Kunde uns mittels einer eindeutigen Erklärung (z. B. per E-Mail an <a href={`mailto:${contactEmail}`} className="text-indigo-500 underline">{contactEmail}</a>) über seinen Entschluss informieren.
                                </p>
                                <div className="bg-slate-100/60 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Folgen des Widerrufs:</p>
                                    Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten für Sonderlieferarten), unverzüglich und spätestens binnen vierzehn Tagen ab Eingang der Widerrufserklärung zurückzuzahlen.
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-indigo-500 font-mono">§ 6</span> Gewährleistung & 12 Monate Garantie
                                </h2>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                        <span><strong>Gesetzliche Mängelhaftung:</strong> Es gelten die gesetzlichen Gewährleistungsrechte nach BGB.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                        <span><strong>Refurbished-Garantie:</strong> Auf alle generalüberholten Smartphones und Reparaturleistungen gewähren wir 12 Monate HandyLand-Garantie auf technische Defekte.</span>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-indigo-500 font-mono">§ 7</span> Schlussbestimmungen & Streitbeilegung
                                </h2>
                                <p>
                                    Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">https://ec.europa.eu/consumers/odr/</a>.
                                </p>
                            </section>

                            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                                Stand: Februar 2026 • HandyLand Allgemeine Geschäftsbedingungen
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
