import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

const VerifyEmailNotice: React.FC = () => {
    const location = useLocation();
    const email = location.state?.email || 'your email';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                    <Mail className="w-10 h-10 text-green-400" />
                </div>

                <h1 className="text-3xl font-black text-white mb-4">Verify Your Email</h1>

                <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                    We've sent a verification link to <br />
                    <span className="text-white font-bold bg-slate-800 px-3 py-1 rounded-lg mt-2 inline-block">{email}</span>
                </p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8 text-left">
                    <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Next Steps:
                    </h3>
                    <ul className="text-slate-400 text-sm space-y-2 list-disc list-inside">
                        <li>Check your inbox for an email from HandyLand.</li>
                        <li>Click the verification link in the email.</li>
                        <li>Return here to log in to your account.</li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/login"
                        className="block w-full py-3 bg-gradient-to-r from-green-600 to-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/30 hover:shadow-green-900/50 hover:from-green-500 hover:to-cyan-400 transition-all flex items-center justify-center gap-2"
                    >
                        Proceed to Login <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                        to="/"
                        className="block text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailNotice;
