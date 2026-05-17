import React, { useEffect, useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { api } from '../utils/api';

const PrivacyPolicy: React.FC = () => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await api.get<any>('/api/pages/privacy');
                const data = res as any;
                if (data && data.data && data.data.content) {
                    setContent(data.data.content);
                } else if (data && data.content) {
                    // Fallback just in case
                    setContent(data.content);
                }
            } catch (err) {
                console.error('Failed to fetch Privacy Policy:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-28 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Breadcrumbs items={[
                    { label: 'Home', path: '/' },
                    { label: 'Privacy Policy' }
                ]} className="mb-6" />
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 min-h-[400px]">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="w-10 h-10 text-blue-500" />
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : content ? (
                        <div className="ql-writing-format">
                            <div className="ql-snow">
                                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Last updated: February 2026</p>
                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Data Collection</h2>
                                <p className="text-slate-700 dark:text-slate-300">We collect name, email, phone, and address for orders and account management.</p>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
