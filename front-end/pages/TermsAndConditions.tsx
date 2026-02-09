import React from 'react';
import { FileText } from 'lucide-react';

const TermsAndConditions: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-28 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <FileText className="w-10 h-10 text-blue-500" />
                        <h1 className="text-4xl font-black text-white">Terms & Conditions</h1>
                    </div>
                    <p className="text-slate-400 mb-8">Last updated: February 2026</p>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Acceptance</h2>
                            <p className="text-slate-300">By using HandyLand, you agree to these terms and conditions.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">User Obligations</h2>
                            <ul className="text-slate-300 space-y-2 list-disc list-inside">
                                <li>Provide accurate information</li>
                                <li>Maintain account security</li>
                                <li>Use services lawfully</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Returns & Refunds</h2>
                            <p className="text-slate-300">14-day return policy on all products. Contact support for refund requests.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Repairs</h2>
                            <p className="text-slate-300">Repair estimates provided within 24 hours. 90-day warranty on all repairs.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
