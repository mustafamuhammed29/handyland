import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">404</h1>
                    <h2 className="text-3xl font-bold text-white mt-4 mb-2">Page Not Found</h2>
                    <p className="text-slate-400 text-lg">The page you're looking for doesn't exist.</p>
                </div>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                        <Home className="w-5 h-5" />
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
