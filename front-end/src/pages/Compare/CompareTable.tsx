import React from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import { getWinnerIndices, getDynamicSpecs } from './compareUtils';

interface CompareTableProps {
    slots: number[];
    selectedProducts: any[];
    activeProducts: any[];
    showDifferencesOnly: boolean;
}

export const CompareTable: React.FC<CompareTableProps> = ({ slots, selectedProducts, activeProducts, showDifferencesOnly }) => {
    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 mb-12">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr>
                            <th className="w-1/4 p-4"></th>
                            {slots.map(i => (
                                <th key={i} className="w-1/4 p-4 text-center">
                                    {selectedProducts[i] && (
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
                                            {selectedProducts[i].name || selectedProducts[i].model}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-slate-950/80">
                            <td className="p-4 md:p-6 text-emerald-400 font-bold border-b border-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Zap className="w-4 h-4" /> Performance
                            </td>
                            {slots.map((_, i) => <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>)}
                        </tr>

                        {/* Handle Benchmark Score Special Logic */}
                        {(() => {
                            const values = slots.map(i => selectedProducts[i]?.specs?.benchmarkScore || '-');
                            const isAllSame = activeProducts.length > 1 && values.every(v => v === values[0] && v !== '-');
                            if (showDifferencesOnly && isAllSame) return null;

                            const winners = getWinnerIndices(values, 'benchmark', activeProducts.length);

                            return (
                                <tr className="hover:bg-slate-800/20 transition-colors bg-slate-900/20">
                                    <td className="p-4 md:p-5 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-800 pl-8">Antutu / Geekbench</td>
                                    {slots.map(i => {
                                        const isWinner = winners.includes(i);
                                        return (
                                            <td key={i} className={`p-4 md:p-5 border-b border-slate-800 border-l border-slate-800/50 font-black text-lg transition-colors ${isWinner ? 'text-emerald-400 bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {values[i]}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })()}

                        {/* Dynamic Specifications Rendered */}
                        {getDynamicSpecs(selectedProducts).map(({ category, keys }) => (
                            <React.Fragment key={category}>
                                <tr className="bg-slate-950/80">
                                    <td className="p-4 md:p-6 font-bold text-emerald-400 border-b border-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4"/> {category}
                                    </td>
                                    {slots.map(i => <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>)}
                                </tr>
                                {keys.map(specKey => {
                                    const rawValues = slots.map(i => {
                                        const p = selectedProducts[i];
                                        if (!p) return undefined;
                                        
                                        if (category === 'Stammdaten') {
                                            if (specKey === 'Marke') return p.brand;
                                            if (specKey === 'Modell') return p.model || p.name;
                                            if (specKey === 'Farbe') return p.color || p.farbe;
                                            if (specKey === 'Speicher') return p.storage || p.speicher;
                                            if (specKey === 'Zustand') return p.condition;
                                        } else if (category === 'Hauptmerkmale' || category === 'Weitere Details') {
                                            const lowerKey = specKey.toLowerCase();
                                            if (lowerKey === 'processor') return p.processor || p.specs?.processor || p.specs?.Processor;
                                            if (lowerKey === 'display') return p.display || p.specs?.display || p.specs?.Display;
                                            if (lowerKey === 'battery') return p.battery || p.specs?.battery || p.specs?.Battery;
                                            if (lowerKey === 'os') return p.specs?.os || p.specs?.OS || p.specs?.Os;
                                            if (lowerKey === 'ram') return p.specs?.ram || p.specs?.RAM || p.specs?.Ram;
                                            
                                            return p.specs?.[lowerKey] || p.specs?.[specKey] || p.specs?.[specKey.toLowerCase()];
                                        } else {
                                            return p.specs?.[category]?.[specKey];
                                        }
                                    });

                                    const renderedValues = rawValues.map(specValue => {
                                        if (specValue !== undefined && specValue !== null && specValue !== '') {
                                            if (typeof specValue === 'boolean') return specValue ? 'Ja' : 'Nein';
                                            return String(specValue);
                                        }
                                        return '-';
                                    });

                                    const isAllSame = activeProducts.length > 1 && renderedValues.every(v => v === renderedValues[0] && v !== '-');
                                    if (showDifferencesOnly && isAllSame) return null;

                                    const winners = getWinnerIndices(renderedValues, specKey, activeProducts.length);

                                    return (
                                        <tr key={specKey} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="p-4 md:p-5 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-800 pl-8 group-hover:text-slate-700 dark:text-slate-300 transition-colors">{specKey}</td>
                                            {slots.map(i => {
                                                const isWinner = winners.includes(i) && renderedValues[i] !== '-';
                                                return (
                                                    <td key={i} className={`p-4 md:p-5 border-b border-slate-800 border-l border-slate-800/50 text-sm leading-relaxed transition-colors ${isWinner ? 'text-emerald-400 font-bold bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                                                        {renderedValues[i]}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
