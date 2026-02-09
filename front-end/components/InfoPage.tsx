import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LanguageCode } from '../types';
import { translations } from '../i18n';
import { api } from '../utils/api';

interface InfoPageProps {
    lang: LanguageCode;
}

const PAGE_TITLES: Record<string, string> = {
    '/agb': 'agb',
    '/datenschutz': 'datenschutz',
    '/privacy': 'datenschutz',
    '/impressum': 'impressum',
    '/kundenservice': 'kundenservice',
    '/service': 'kundenservice',
    '/uber-uns': 'ueber-uns',
    '/about': 'ueber-uns'
};

export const InfoPage: React.FC<InfoPageProps> = ({ lang }) => {
    const location = useLocation();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
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
            const data = await api.get<any>(`/api/pages/${slug}`);
            setTitle(data.title);
            setContent(data.content);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 flex justify-center">
                <div className="w-8 h-8 border-2 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen pt-32 px-4 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                <p className="text-slate-500">Page not found or content unavailable.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-12 border-b border-slate-800 pb-8">
                    {title}
                </h1>

                <div className="prose prose-invert prose-lg max-w-none text-slate-300">
                    {/* Render plain text with paragraph breaks */}
                    {content.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4 leading-relaxed whitespace-pre-line">
                            {paragraph} || <br className="hidden" />
                        </p>
                    ))}
                    {content === '' && (
                        <p className="text-slate-600 italic">No content has been added to this page yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
