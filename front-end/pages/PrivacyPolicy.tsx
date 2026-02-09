import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-28 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="w-10 h-10 text-blue-500" />
                        <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
                    </div>
                    <p className="text-slate-400 mb-8">Last updated: February 2026</p>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Data Collection</h2>
                            <p className="text-slate-300">We collect name, email, phone, and address for orders and account management.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
                            <p className="text-slate-300">We use industry-standard encryption and security measures to protect your data.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
                            <p className="text-slate-300">You have the right to access, modify, or delete your personal data at any time.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
                            <p className="text-slate-300">Questions? Email us at privacy@handyland.com</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
