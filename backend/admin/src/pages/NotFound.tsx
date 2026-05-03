import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center">
      {/* Glow circle */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <AlertTriangle size={48} className="text-blue-400" />
        </div>
        <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
      </div>

      <div>
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
          404
        </h1>
        <p className="text-xl font-semibold text-white mb-2">Page Not Found</p>
        <p className="text-slate-400 text-sm max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
      >
        <Home size={18} />
        Back to Dashboard
      </button>
    </div>
  );
}
