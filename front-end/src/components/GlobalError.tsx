import React from 'react';
import { WifiOff, RefreshCw, ServerCrash, ShieldAlert } from 'lucide-react';

interface GlobalErrorProps {
    onRetry?: () => void;
    errorType?: 'connection' | 'maintenance' | 'unknown';
}

export const GlobalError: React.FC<GlobalErrorProps> = ({ onRetry, errorType = 'connection' }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">

        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-amber-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Verbindung wird hergestellt...
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Unser Server startet gerade. Bitte warten Sie einen Moment.
        </p>

        {/* Progress bar تُظهر أن شيئاً يحدث */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
          <div className="bg-cyan-500 h-1.5 rounded-full animate-pulse w-2/3" />
        </div>

        <button
          onClick={() => {
              if (onRetry) onRetry();
              else window.location.reload();
          }}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-medium transition-colors"
        >
          Erneut versuchen / Retry
        </button>

        <p className="text-slate-600 text-xs mt-4">
          Falls das Problem anhält, kontaktieren Sie uns via WhatsApp
        </p>
      </div>
    </div>
  );
};
