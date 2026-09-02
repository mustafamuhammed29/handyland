import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { SEO } from './SEO';
import NotFound from '../pages/NotFound';
import DOMPurify from 'dompurify';

interface InfoPageProps {}

const PAGE_TITLES: Record<string, string> = {
    '/agb': 'agb',
    '/datenschutz': 'privacy',
    '/privacy': 'privacy',
    '/impressum': 'impressum',
    '/kundenservice': 'kundenservice',
    '/service': 'kundenservice',
    '/uber-uns': 'ueber-uns',
    '/about': 'ueber-uns'
};

const getFallbackContent = (slug: string, settings?: any): { title: string; content: string } | null => {
    const email = settings?.contactSection?.email || 'support@handyland.de';
    const phone = settings?.contactSection?.phone || '+49 30 1234 5678';
    const address = settings?.contactSection?.address || 'Musterstraße 123, 10115 Berlin, Deutschland';

    const fallbacks: Record<string, { title: string; content: string }> = {
        impressum: {
            title: 'Impressum',
            content: `
# Impressum

## Angaben gemäß § 5 TMG

**HandyLand GmbH**
${address}

## Vertreten durch
**Geschäftsführung:** [Mustermann / Inhaber]

## Kontakt
- **Telefon:** ${phone}
- **E-Mail:** ${email}
- **Website:** www.handyland.de

## Registereintrag
- **Registergericht:** [Amtsgericht Charlottenburg]
- **Registernummer:** [HRB 123456 B]

## Umsatzsteuer-ID
Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
**[DE 123 456 789]**

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
[Geschäftsführung HandyLand GmbH]
${address}

## EU-Streitschlichtung
Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
[https://ec.europa.eu/consumers/odr/](https://ec.europa.eu/consumers/odr/)
Unsere E-Mail-Adresse finden Sie oben im Impressum.

## Verbraucherstreitbeilegung / Universalschlichtungsstelle
Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
`
        },
        'ueber-uns': {
            title: 'Über HandyLand',
            content: `
# Über HandyLand

## Ihre Experten für Smartphones, Technik & Express-Reparaturen

HandyLand ist Ihre erstklassige Anlaufstelle für geprüfte Smartphones, Tablets, smartes Zubehör und professionellen Reparaturservice in Deutschland.

## Unsere Mission
Wir setzen auf Nachhaltigkeit und Langlebigkeit moderner Elektronik. Durch zertifizierte Generalüberholung, transparente Gerätebewertung und fachgerechte Reparaturen verlängern wir den Produktlebenszyklus hochwertiger Geräte.

## Was uns auszeichnet
- **Zertifizierte Fachwerkstatt:** Moderne Diagnosegeräte und geschulte Techniker für alle gängigen Marken (Apple, Samsung, Google, Xiaomi u. v. m.).
- **Geprüfte Qualität:** Refurbished Smartphones durchlaufen gründliche Qualitäts- und Funktionstests.
- **Express-Reparatur:** Display- und Akkutausch werden in der Regel innerhalb kürzester Zeit durchgeführt.
- **Transparenz:** Sofortige Online-Wertermittlung und faire Preise beim Geräteverkauf.
- **Garantie & Sicherheit:** 12 Monate Garantie auf generalüberholte Geräte und durchgeführte Reparaturleistungen.

## Kontaktieren Sie uns
Haben Sie Fragen zu unseren Produkten oder einem Reparaturauftrag? Unser Support-Team ist jederzeit gerne für Sie da:
- **E-Mail:** ${email}
- **Telefon:** ${phone}
`
        },
        kundenservice: {
            title: 'Kundenservice & Support',
            content: `
# Kundenservice & Hilfe

## Wir sind für Sie da

Unser Kundenservice unterstützt Sie schnell und unkompliziert bei allen Anliegen rund um Bestellungen, Reparaturen und den Geräteankauf.

## Kontaktinformationen
- **E-Mail:** ${email}
- **Telefon:** ${phone}
- **Servicezeiten:** Montag – Freitag: 09:00 – 18:00 Uhr | Samstag: 10:00 – 16:00 Uhr

## Direkte Hilfe & Quick-Links
- **[Reparaturstatus verfolgen](/track-repair)**: Prüfen Sie den Live-Status Ihres Geräts.
- **[Reparatur anfragen](/repair)**: Reparaturpreise einsehen und Termin oder Einsendung buchen.
- **[Gerät bewerten & verkaufen](/valuation)**: Sofortiges Angebot für Ihr Gebrauchtgerät erhalten.
- **[Kontaktformular](/contact)**: Schreiben Sie uns eine Direktnachricht.
`
        }
    };

    return fallbacks[slug] || null;
};

const formatMarkdownToHTML = (text: string): string => {
    if (!text) return '';
    
    // Normalize basic HTML paragraphs and breaks back to clean newlines for Markdown parsing
    let normalized = text
        .replace(/<p>\s*---\s*<\/p>/gi, '\n<hr class="border-slate-800 my-8" />\n')
        .replace(/<p>\s*\*\*\*\s*<\/p>/gi, '\n<hr class="border-slate-800 my-8" />\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/<div>/gi, '')
        .replace(/&nbsp;/g, ' ');

    const lines = normalized.split('\n');
    let inList = false;
    
    const formattedLines = lines.map(line => {
        let trimmed = line.trim();
        
        if (trimmed.startsWith('<hr')) {
            return trimmed;
        }
        
        if (trimmed === '---' || trimmed === '***' || trimmed === '--- ' || trimmed === '*** ') {
            return '<hr class="border-slate-850 dark:border-slate-800 my-8 border-t" />';
        }
        
        if (trimmed.startsWith('# ')) {
            return `<h1 class="text-3xl font-black text-slate-900 dark:text-white mt-8 mb-4 tracking-tight">${trimmed.slice(2)}</h1>`;
        }
        if (trimmed.startsWith('## ')) {
            return `<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight">${trimmed.slice(3)}</h2>`;
        }
        if (trimmed.startsWith('### ')) {
            return `<h3 class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight">${trimmed.slice(4)}</h3>`;
        }
        if (trimmed.startsWith('#### ')) {
            return `<h4 class="text-lg font-bold text-slate-850 dark:text-slate-300 mt-4 mb-2">${trimmed.slice(5)}</h4>`;
        }
        
        const isNumberedHeader = /^\d+\.\s+\w+/.test(trimmed);
        const knownHeaders = [
            'impressum', 'unternehmensgegenstand', 'angaben zur umsatzsteuer',
            'garantie & gewährleistung', 'haftungshinweise', 'gewerbeanmeldung',
            'verbraucherinformationen & online-streitbeilegung', 'angaben gemäß § 5 tmg'
        ];
        const isKnownHeader = knownHeaders.includes(trimmed.toLowerCase());
        
        if (isKnownHeader || isNumberedHeader) {
            return `<h2 class="text-2xl font-black text-slate-900 dark:text-white mt-10 mb-4 tracking-tight border-l-4 border-cyan-500 pl-4 uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">${trimmed}</h2>`;
        }
        
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            let item = trimmed.slice(2);
            let prefix = '';
            if (!inList) {
                inList = true;
                prefix = '<ul class="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 my-4">';
            }
            // Format inline links and bolds in lists
            const itemFormatted = item
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-cyan-500 hover:underline font-semibold">$1</a>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-bold">$1</strong>');
            return `${prefix}<li class="text-slate-600 dark:text-slate-300">${itemFormatted}</li>`;
        } else if (inList && trimmed === '') {
            inList = false;
            return '</ul>';
        }
        
        let formattedLine = line
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-cyan-500 hover:underline font-semibold">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-slate-600 dark:text-slate-300 italic">$1</em>');
            
        if (trimmed === '') {
            return '<div class="h-4"></div>';
        }
        
        if (inList) {
            inList = false;
            return `</ul><p class="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">${formattedLine}</p>`;
        }
        
        return `<p class="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">${formattedLine}</p>`;
    });
    
    let html = formattedLines.join('\n');
    if (inList) {
        html += '</ul>';
    }
    return html;
};

export const InfoPage: React.FC<InfoPageProps> = () => {
    const location = useLocation();
    const { settings } = useSettings();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [seo, setSeo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const path = location.pathname;
        const slug = PAGE_TITLES[path] || path.replace('/page/', '');

        if (slug) {
            fetchPage(slug, isMounted);
        }

        return () => { isMounted = false; };
    }, [location.pathname, settings]);

    const fetchPage = async (slug: string, isMounted: boolean) => {
        setLoading(true);
        setError(false);
        try {
            const res = await api.get<any>(`/api/pages/${slug}`, { timeout: 3000 });
            const data = res as any;
            if (!isMounted) return;

            if (data && data.data && data.data.content) {
                setTitle(data.data.title);
                setContent(data.data.content);
                setSeo(data.data.seo);
            } else if (data && data.content) {
                setTitle(data.title);
                setContent(data.content);
                setSeo(data.seo);
            } else {
                // Check fallback content
                const fallback = getFallbackContent(slug, settings);
                if (fallback) {
                    setTitle(fallback.title);
                    setContent(fallback.content);
                } else {
                    setError(true);
                }
            }
        } catch {
            if (!isMounted) return;
            const fallback = getFallbackContent(slug, settings);
            if (fallback) {
                setTitle(fallback.title);
                setContent(fallback.content);
            } else {
                setError(true);
            }
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] pt-32 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return <NotFound />;
    }

    return (
        <div className="page-container min-h-[100dvh] pt-32 pb-16 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <SEO
                title={seo?.metaTitle || title}
                description={seo?.metaDescription}
                keywords={seo?.keywords}
                canonical={seo?.canonicalUrl || window.location.href}
            />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[400px]">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                        {title}
                    </h1>

                    <div className="ql-writing-format mt-6">
                        {content ? (
                            <div className="ql-snow">
                                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMarkdownToHTML(content)) }} />
                            </div>
                        ) : (
                            <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                                <p className="text-slate-500 italic">Für diese Seite liegt noch kein Inhalt vor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
