import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import i18n from '../i18n';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const language = (i18n.language || 'de').split('-')[0];
            const isRtl = language === 'ar' || language === 'fa';

            return (
                <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-[100dvh] bg-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-black text-white mb-3">
                            {i18n.t('errorBoundary.title', 'Systemfehler')}
                        </h1>

                        <p className="text-slate-400 mb-6">
                            {i18n.t('errorBoundary.description', 'Ein unerwarteter Fehler ist aufgetreten. Das Problem wurde protokolliert und unser Team wurde benachrichtigt.')}
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-black/50 rounded-lg text-left rtl:text-right overflow-auto max-h-32">
                                <code className="text-xs text-red-400 font-mono">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4" /> {i18n.t('errorBoundary.reload', 'System neu laden')}
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                            >
                                {i18n.t('errorBoundary.returnHome', 'Zur Startseite')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
