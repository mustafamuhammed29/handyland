import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { SEO } from './SEO';
import { useTranslation } from 'react-i18next';

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
        
        // If it is a pre-replaced hr, return it as is
        if (trimmed.startsWith('<hr')) {
            return trimmed;
        }
        
        // Horizontal rule
        if (trimmed === '---' || trimmed === '***' || trimmed === '--- ' || trimmed === '*** ') {
            return '<hr class="border-slate-850 dark:border-slate-800 my-8 border-t" />';
        }
        
        // Headings
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
        
        // Smart Header Identification:
        // Identify short title lines in Impressum and Service pages to turn them into beautiful headings
        const isNumberedHeader = /^\d+\.\s+\w+/.test(trimmed);
        const knownHeaders = [
            'impressum', 'unternehmensgegenstand', 'angaben zur umsatzsteuer',
            'garantie & gewährleistung', 'haftungshinweise', 'gewerbeanmeldung',
            'verbraucherinformationen & online-streitbeilegung'
        ];
        const isKnownHeader = knownHeaders.includes(trimmed.toLowerCase());
        
        if (isKnownHeader || isNumberedHeader) {
            return `<h2 class="text-2xl font-black text-slate-900 dark:text-white mt-10 mb-4 tracking-tight border-l-4 border-cyan-500 pl-4 uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">${trimmed}</h2>`;
        }
        
        // Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            let item = trimmed.slice(2);
            let prefix = '';
            if (!inList) {
                inList = true;
                prefix = '<ul class="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 my-4">';
            }
            return `${prefix}<li class="text-slate-600 dark:text-slate-300">${item}</li>`;
        } else if (inList && trimmed === '') {
            inList = false;
            return '</ul>';
        }
        
        // Bold/Italic replacements
        let formattedLine = line
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
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [seo, setSeo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const path = location.pathname;
        const slug = PAGE_TITLES[path] || path.replace('/page/', '');

        if (slug) {
            fetchPage(slug);
        }
    }, [location.pathname]);

    const fetchPage = async (slug: string) => {
        setLoading(true);
        setError(false);
        try {
            const res = await api.get<any>(`/api/pages/${slug}`);
            const data = res as any;
            if (data && data.data) {
                setTitle(data.data.title);
                setContent(data.data.content);
                setSeo(data.data.seo);
            } else if (data) {
                setTitle(data.title);
                setContent(data.content);
                setSeo(data.seo);
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] pt-32 flex justify-center">
                <div className="w-8 h-8 border-2 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100dvh] pt-32 px-4 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                <p className="text-slate-500">Page not found or content unavailable.</p>
            </div>
        );
    }

    return (
        <div className="page-container min-h-[100dvh] pt-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <SEO
                title={seo?.metaTitle || title}
                description={seo?.metaDescription}
                keywords={seo?.keywords}
                canonical={seo?.canonicalUrl || window.location.href}
            />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[400px]">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
                        {title}
                    </h1>

                    <div className="ql-writing-format mt-8">
                        {content ? (
                            <div className="ql-snow">
                                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(content) }} />
                            </div>
                        ) : (
                            <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                                <p className="text-slate-500 italic">No content has been added to this page yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
