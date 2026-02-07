import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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

            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-black text-white mb-3">System Malfunction</h1>

                        <p className="text-slate-400 mb-6">
                            An unexpected error has occurred. We've logged this issue and our tech team has been notified.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-black/50 rounded-lg text-left overflow-auto max-h-32">
                                <code className="text-xs text-red-400 font-mono">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Reload System
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all"
                            >
                                Return Home
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
