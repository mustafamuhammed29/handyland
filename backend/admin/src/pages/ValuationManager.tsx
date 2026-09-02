import { useState, Suspense, lazy } from 'react';
import { Calculator, ClipboardList, TrendingUp } from 'lucide-react';
import { ValuationBlueprintsTab } from './valuation/ValuationBlueprintsTab';
import { ValuationQuotesTab } from './valuation/ValuationQuotesTab';

const PriceResearchManager = lazy(() => import('./PriceResearchManager'));

const ValuationManager = () => {
    const [activeSection, setActiveSection] = useState<'blueprints' | 'quotes' | 'research'>('blueprints');

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Valuation Manager</h1>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Gerätebewertungen, Ankaufspreise und Preis-Recherche verwalten.</p>
                </div>
            </div>

            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-8 overflow-x-auto hide-scrollbar w-full max-w-fit">
                <button
                    onClick={() => setActiveSection('blueprints')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeSection === 'blueprints' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <Calculator size={16} /> Base Blueprints
                </button>
                <button
                    onClick={() => setActiveSection('quotes')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeSection === 'quotes' 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <ClipboardList size={16} /> Ankauf-Anfragen (Quotes)
                </button>
                <button
                    onClick={() => setActiveSection('research')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeSection === 'research' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <TrendingUp size={16} /> Preis-Recherche (eBay)
                </button>
            </div>

            {activeSection === 'blueprints' && <ValuationBlueprintsTab />}
            {activeSection === 'quotes' && <ValuationQuotesTab />}
            {activeSection === 'research' && (
                <Suspense fallback={<div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                    <PriceResearchManager />
                </Suspense>
            )}
        </div>
    );
};

export default ValuationManager;
