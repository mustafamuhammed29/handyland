import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Admin Error Boundary — catches any unhandled render errors in the admin panel
 * and displays a premium fallback UI instead of a blank white screen.
 */
export class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev; Sentry will catch it in production
    if (import.meta.env.DEV) {
      console.error('[AdminErrorBoundary]', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center px-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={44} className="text-red-400" />
            </div>
            <div className="absolute inset-0 bg-red-500/5 blur-2xl rounded-full" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm max-w-sm mb-4">
              An unexpected error occurred in this section.
              You can try reloading or go back to the dashboard.
            </p>
            {import.meta.env.DEV && this.state.errorMessage && (
              <pre className="text-left text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-4 max-w-lg overflow-auto">
                {this.state.errorMessage}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-200"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
