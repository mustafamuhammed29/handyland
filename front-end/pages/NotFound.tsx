import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-9xl font-black mb-4">
                404
            </div>
            <h1 className="text-4xl text-white font-bold mb-6">Page Not Found</h1>
            <p className="text-slate-400 text-lg mb-8 max-w-md">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <div className="flex gap-4">
                <Link
                    to="/"
                    className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                    <Home className="w-5 h-5" />
                    Back to Home
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors border border-slate-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                </button>
            </div>
        </div>
    );
};
