import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export const GenericPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetchPage();
    }, [slug]);

    const fetchPage = async () => {
        try {
            const res = await fetch(`/api/pages/${slug}`);
            if (res.status === 404) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            if (res.ok) {
                const data = await res.json();
                if (data.isActive) {
                    setPage(data);
                } else {
                    setNotFound(true);
                }
            } else {
                setNotFound(true);
            }
        } catch (error) {
            console.error('Failed to fetch page:', error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="relative py-24 bg-black min-h-screen">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                </div>
            </section>
        );
    }

    if (notFound) {
        return (
            <section className="relative py-24 bg-black min-h-screen">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-red-900/10 via-slate-950 to-black pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="text-9xl font-black text-cyan-500 opacity-20 mb-4">404</div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Page Not Found
                    </h1>
                    <p className="text-slate-400 text-lg mb-8">
                        The page you're looking for doesn't exist or has been deactivated.
                    </p>
                    <Link
                        to="/"
                        className="inline-block bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all"
                    >
                        Return Home
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="relative py-24 bg-black min-h-screen">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-black pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Title */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                        {page.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                        <span>Last Updated: {new Date(page.updatedAt).toLocaleDateString('de-DE')}</span>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="prose prose-invert prose-lg max-w-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
                    prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-cyan-400
                    prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                    prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white prose-strong:font-bold
                    prose-ul:list-disc prose-ul:ml-6 prose-ul:text-slate-300
                    prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-slate-300
                    bg-slate-900/30 border border-slate-800 rounded-2xl p-8 md:p-12"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />

                {/* Back to Home */}
                <div className="mt-12 text-center">
                    <Link
                        to="/"
                        className="inline-block text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </section>
    );
};
