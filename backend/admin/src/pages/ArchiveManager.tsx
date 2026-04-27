import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Save, X, Edit, CheckSquare, Square, ChevronLeft, ChevronRight, Archive, Clock } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

interface RepairCase {
    _id: string;
    title: string;
    category: 'screen' | 'glass' | 'water' | 'camera' | 'battery' | 'other';
    difficulty: 'Low' | 'Med' | 'High' | 'Expert';
    time: string;
    labelBefore: string;
    labelAfter: string;
    imgBefore: string;
    imgAfter: string;
    description: string;
}

const ArchiveManager = () => {
    const [cases, setCases] = useState<RepairCase[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 12;

    const [isEditing, setIsEditing] = useState(false);
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [currentCase, setCurrentCase] = useState<Partial<RepairCase>>({});

    const fetchCases = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: debouncedSearch
            });
            const res = await api.get(`/api/repair-archive?${queryParams.toString()}`);
            if (res.data.success) {
                setCases(res.data.cases);
                setTotalPages(res.data.totalPages || 1);
            } else {
                // Fallback for legacy format if any
                if (Array.isArray(res.data)) {
                    setCases(res.data);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch cases');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchCases();
    }, [page, debouncedSearch]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this case?')) return;
        try {
            await api.delete(`/api/repair-archive/${id}`);
            setCases(cases.filter(c => c._id !== id));
            setSelectedCases(selectedCases.filter(cId => cId !== id));
            toast.success('Case deleted successfully');
            fetchCases();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete case');
        }
    };

    const handleSelectAll = () => {
        if (selectedCases.length === cases.length && cases.length > 0) {
            setSelectedCases([]);
        } else {
            setSelectedCases(cases.map(c => c._id));
        }
    };

    const toggleSelectCase = (id: string) => {
        if (selectedCases.includes(id)) {
            setSelectedCases(selectedCases.filter(cId => cId !== id));
        } else {
            setSelectedCases([...selectedCases, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedCases.length} selected cases?`)) return;
        try {
            await Promise.all(selectedCases.map(id => api.delete(`/api/repair-archive/${id}`)));
            setSelectedCases([]);
            toast.success('Cases deleted successfully');
            fetchCases();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete cases');
        }
    };

    const handleSave = async () => {
        try {
            if (currentCase._id) {
                await api.put(`/api/repair-archive/${currentCase._id}`, currentCase);
                toast.success('Case updated successfully');
            } else {
                await api.post('/api/repair-archive', currentCase);
                toast.success('Case created successfully');
            }
            
            setIsEditing(false);
            setCurrentCase({});
            fetchCases();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save case');
        }
    };

    return (
        <div className="p-6">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-black flex items-center gap-3 text-white">
                    <div className="p-2.5 bg-purple-500/20 rounded-xl">
                        <Archive className="w-8 h-8 text-purple-400" />
                    </div>
                    Repair Archive
                </h1>
                <button
                    onClick={() => { setCurrentCase({}); setIsEditing(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20"
                >
                    <Plus size={20} /> Add New Case
                </button>
            </div>

            {/* Search and Controls */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl mb-6 flex flex-wrap items-center gap-4 shadow-lg">
                <button
                    onClick={handleSelectAll}
                    className="bg-slate-950/50 border border-slate-700/50 hover:bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-colors"
                    aria-label={selectedCases.length === cases.length && cases.length > 0 ? "Deselect All" : "Select All"}
                    title={selectedCases.length === cases.length && cases.length > 0 ? "Deselect All" : "Select All"}
                >
                    {selectedCases.length === cases.length && cases.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                    )}
                </button>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search cases by title..."
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:bg-slate-900 transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedCases.length > 0 && (
                <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <span className="text-red-400 font-bold">{selectedCases.length}</span>
                        <span className="text-slate-300 font-medium">cases selected</span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                    </button>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : cases.length === 0 ? (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                    <Archive className="w-16 h-16 text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Cases Found</h3>
                    <p className="text-slate-400 max-w-md">There are no repair cases matching your criteria. Start adding some incredible transformations!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cases.map((item) => {
                        const isSelected = selectedCases.includes(item._id);
                        return (
                            <div key={item._id} className={`bg-slate-900/40 backdrop-blur-xl border ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/5'} rounded-2xl overflow-hidden group hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-900/10 transition-all relative flex flex-col`}>
                                {/* Checkbox Overlay */}
                                <div className="absolute top-3 left-3 z-20">
                                    <button
                                        onClick={() => toggleSelectCase(item._id)}
                                        className="bg-slate-950/80 backdrop-blur-md p-2 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/10 shadow-lg"
                                        aria-label={isSelected ? "Deselect Case" : "Select Case"}
                                        title={isSelected ? "Deselect Case" : "Select Case"}
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-purple-500" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <div className="relative h-48 bg-slate-950 flex-shrink-0">
                                    <div className="absolute inset-0 flex">
                                        <div className="w-1/2 relative border-r border-white/10 overflow-hidden">
                                            <img src={item.imgBefore} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-105 duration-500" alt="Before" />
                                            <span className="absolute bottom-2 left-2 text-[10px] bg-red-500/90 text-white font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm uppercase">Before</span>
                                        </div>
                                        <div className="w-1/2 relative overflow-hidden">
                                            <img src={item.imgAfter} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="After" />
                                            <span className="absolute bottom-2 right-2 text-[10px] bg-emerald-500/90 text-white font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm uppercase">After</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button
                                            onClick={() => { setCurrentCase(item); setIsEditing(true); }}
                                            className="p-2 bg-slate-950/80 hover:bg-blue-600 text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors shadow-lg"
                                            aria-label="Edit Case"
                                            title="Edit Case"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-2 bg-slate-950/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors shadow-lg"
                                            aria-label="Delete Case"
                                            title="Delete Case"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-black text-lg text-white mb-2 line-clamp-1" title={item.title}>{item.title}</h3>
                                    <div className="flex gap-2 text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
                                        <span className="bg-slate-800/80 px-2 py-1 rounded-md border border-white/5">{item.category}</span>
                                        <span className="bg-slate-800/80 px-2 py-1 rounded-md border border-white/5 text-purple-400">LVL {item.difficulty}</span>
                                        <span className="bg-slate-800/80 px-2 py-1 rounded-md border border-white/5 flex items-center gap-1"><Clock size={10} /> {item.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 mt-auto">{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-between px-6 py-4 mt-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg">
                    <div className="text-sm font-medium text-slate-400">
                        Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            title="Previous Page"
                            aria-label="Previous Page"
                            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1 hidden sm:flex">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                if (totalPages > 7 && Math.abs(page - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                    if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="text-slate-500 px-2">...</span>;
                                    return null;
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === pageNum ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-white/5'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            title="Next Page"
                            aria-label="Next Page"
                            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl animate-in zoom-in-95">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl shrink-0">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                {currentCase._id ? <Edit className="w-6 h-6 text-blue-400" /> : <Plus className="w-6 h-6 text-purple-400" />}
                                {currentCase._id ? 'Edit Case Study' : 'New Case Study'}
                            </h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                aria-label="Close Modal"
                                title="Close Modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <div className="p-8 space-y-8">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-3 tracking-wider"><div className="w-2 h-2 rounded-full bg-blue-500"></div> General Info</h4>
                                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Title</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-purple-500 outline-none transition-colors"
                                                    value={currentCase.title || ''}
                                                    onChange={e => setCurrentCase({ ...currentCase, title: e.target.value })}
                                                    placeholder="e.g. iPhone 14 Pro Max Screen Replacement"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Time Estimate</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-purple-500 outline-none transition-colors"
                                                    value={currentCase.time || ''}
                                                    onChange={e => setCurrentCase({ ...currentCase, time: e.target.value })}
                                                    placeholder="e.g. 45m"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Category</label>
                                                <select
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-purple-500 outline-none transition-colors"
                                                    value={currentCase.category || 'other'}
                                                    onChange={e => setCurrentCase({ ...currentCase, category: e.target.value as any })}
                                                    aria-label="Select Category"
                                                >
                                                    <option value="screen">Screen</option>
                                                    <option value="glass">Rear Glass</option>
                                                    <option value="water">Water Damage</option>
                                                    <option value="camera">Camera</option>
                                                    <option value="battery">Battery</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Difficulty Level</label>
                                                <select
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-purple-500 outline-none transition-colors"
                                                    value={currentCase.difficulty || 'Med'}
                                                    onChange={e => setCurrentCase({ ...currentCase, difficulty: e.target.value as any })}
                                                    aria-label="Select Difficulty"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Med">Medium</option>
                                                    <option value="High">High</option>
                                                    <option value="Expert">Expert</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Images */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-3 tracking-wider"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Visual Evidence</h4>
                                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <ImageUpload
                                                label="BEFORE IMAGE"
                                                value={currentCase.imgBefore || ''}
                                                onChange={(url) => setCurrentCase({ ...currentCase, imgBefore: url })}
                                            />
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-red-500 outline-none transition-colors"
                                                value={currentCase.labelBefore || ''}
                                                onChange={e => setCurrentCase({ ...currentCase, labelBefore: e.target.value })}
                                                placeholder="Label (e.g. Shattered Screen)"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <ImageUpload
                                                label="AFTER IMAGE"
                                                value={currentCase.imgAfter || ''}
                                                onChange={(url) => setCurrentCase({ ...currentCase, imgAfter: url })}
                                            />
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                                value={currentCase.labelAfter || ''}
                                                onChange={e => setCurrentCase({ ...currentCase, labelAfter: e.target.value })}
                                                placeholder="Label (e.g. Restored perfectly)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-3 tracking-wider"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Details</h4>
                                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5">
                                        <textarea
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:border-purple-500 outline-none h-32 resize-none transition-colors"
                                            value={currentCase.description || ''}
                                            onChange={e => setCurrentCase({ ...currentCase, description: e.target.value })}
                                            placeholder="Write a compelling story about this repair..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800/50 flex justify-end gap-3 bg-slate-900/50 backdrop-blur-xl shrink-0">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
                            >
                                <Save size={18} />
                                {currentCase._id ? 'Save Changes' : 'Publish Case'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchiveManager;
