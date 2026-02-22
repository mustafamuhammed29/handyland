import React, { useState, useEffect } from 'react';
import { Archive, Plus, Trash2, Edit } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export const RepairArchiveManager: React.FC = () => {
    const [cases, setCases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/repair-archive');
            setCases(response.data || []);
        } catch (error) {
            console.error('Failed to fetch repair archive:', error);
            addToast('Failed to load Repair Cases', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this case study?')) return;
        try {
            await api.delete(`/api/repair-archive/${id}`);
            addToast('Case deleted successfully', 'success');
            fetchCases();
        } catch (error) {
            console.error('Failed to delete case:', error);
            addToast('Failed to delete case', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 w-48 bg-slate-800/50 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
                    <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Archive className="w-6 h-6 text-indigo-400" /> Repair Archive
                    </h2>
                    <p className="text-slate-400 mt-1">Manage public case studies and success stories.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium">
                    <Plus className="w-5 h-5" /> Add Case Study
                </button>
            </div>

            {cases.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                    <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No repair case studies found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {cases.map((c) => (
                        <div key={c._id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-800 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{c.title}</h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded-md uppercase tracking-wider font-bold">
                                            {c.category}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-md font-bold ${c.difficulty === 'Expert' ? 'bg-purple-900/30 text-purple-400' :
                                            c.difficulty === 'High' ? 'bg-red-900/30 text-red-400' :
                                                c.difficulty === 'Med' ? 'bg-orange-900/30 text-orange-400' :
                                                    'bg-emerald-900/30 text-emerald-400'
                                            }`}>
                                            {c.difficulty} Diff
                                        </span>
                                        <span className="px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded-md">
                                            {c.time}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button aria-label="Edit Case" title="Edit Case" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button aria-label="Delete Case" title="Delete Case" onClick={() => handleDelete(c._id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-2 gap-px bg-slate-800">
                                <div className="relative group aspect-square">
                                    <img src={c.imgBefore} alt="Before" className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold rounded-md">
                                        BEFORE
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        {c.labelBefore}
                                    </div>
                                </div>
                                <div className="relative group aspect-square">
                                    <img src={c.imgAfter} alt="After" className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-bold rounded-md">
                                        AFTER
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        {c.labelAfter}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-900/80">
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {c.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
