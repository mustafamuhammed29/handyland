import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Save, X, Edit, CheckSquare, Square, Archive, Clock, Activity, Target, Smartphone } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import ImageCompareSlider from '../components/ImageCompareSlider';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import AdminPagination from '../components/AdminPagination';

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
    
    // Pagination & Search & Filter
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 12;

    const [isEditing, setIsEditing] = useState(false);
    const [viewCase, setViewCase] = useState<RepairCase | null>(null);
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [currentCase, setCurrentCase] = useState<Partial<RepairCase>>({});
    
    // Stats
    const [stats, setStats] = useState({ total: 0, expert: 0, mostCommon: '-' });

    const fetchCases = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: debouncedSearch,
                category: categoryFilter
            });
            const res = await api.get(`/api/repair-archive?${queryParams.toString()}`);
            if (res.data.success) {
                setCases(res.data.cases);
                setTotalPages(res.data.totalPages || 1);
                
                // If it's page 1 and no filters, calculate some stats
                if (page === 1 && !debouncedSearch && categoryFilter === 'All') {
                    const allCases = res.data.cases; // We could fetch a distinct stats endpoint, but we'll approximate here
                    const expertCount = allCases.filter((c: any) => c.difficulty === 'Expert').length;
                    setStats({
                        total: res.data.count || res.data.cases.length,
                        expert: expertCount,
                        mostCommon: 'Screen' // Placeholder
                    });
                }
            } else {
                if (Array.isArray(res.data)) setCases(res.data);
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
    }, [debouncedSearch, categoryFilter]);

    useEffect(() => {
        fetchCases();
    }, [page, debouncedSearch, categoryFilter]);

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

    const categories = ['All', 'screen', 'glass', 'water', 'camera', 'battery', 'other'];

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-black flex items-center gap-3 text-white">
                    <div className="p-2.5 bg-fuchsia-500/20 rounded-xl">
                        <Archive className="w-8 h-8 text-fuchsia-400" />
                    </div>
                    Portfolio & Archive
                </h1>
                <button
                    onClick={() => { setCurrentCase({}); setIsEditing(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-900/20"
                >
                    <Plus size={20} /> Add Transformation
                </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Showcases</p>
                        <p className="text-3xl font-black text-white">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Expert Repairs</p>
                        <p className="text-3xl font-black text-white">{stats.expert}</p>
                    </div>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Most Common</p>
                        <p className="text-3xl font-black text-white">{stats.mostCommon}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl mb-6 shadow-lg">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleSelectAll}
                            className="bg-slate-950/50 border border-slate-700/50 hover:bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-colors shrink-0"
                            aria-label="Select All"
                            title="Select All"
                        >
                            {selectedCases.length === cases.length && cases.length > 0 ? (
                                <CheckSquare className="w-5 h-5 text-fuchsia-500" />
                            ) : (
                                <Square className="w-5 h-5 text-slate-400" />
                            )}
                        </button>
                        <div className="relative flex-1 md:w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search portfolio..."
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-fuchsia-500 focus:bg-slate-900 transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap capitalize ${categoryFilter === cat ? 'bg-fuchsia-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
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
                    <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
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
                            <div key={item._id} className={`bg-slate-900/40 backdrop-blur-xl border ${isSelected ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20' : 'border-white/5'} rounded-2xl overflow-hidden group hover:border-fuchsia-500/50 hover:shadow-xl hover:shadow-fuchsia-900/10 transition-all relative flex flex-col`}>
                                {/* Checkbox Overlay */}
                                <div className="absolute top-3 left-3 z-30">
                                    <button
                                        onClick={() => toggleSelectCase(item._id)}
                                        className="bg-slate-950/80 backdrop-blur-md p-2 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/10 shadow-lg"
                                        aria-label={isSelected ? "Deselect Case" : "Select Case"}
                                    >
                                        {isSelected ? <CheckSquare className="w-5 h-5 text-fuchsia-500" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="relative h-56 bg-slate-950 flex-shrink-0 cursor-pointer overflow-hidden" onClick={() => setViewCase(item)}>
                                    {/* The Slider on card */}
                                    <div className="pointer-events-none group-hover:pointer-events-auto w-full h-full">
                                        <ImageCompareSlider 
                                            imgBefore={item.imgBefore} 
                                            imgAfter={item.imgAfter} 
                                            labelBefore="Before" 
                                            labelAfter="After"
                                            interactive={true}
                                        />
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setCurrentCase(item); setIsEditing(true); }}
                                            className="p-2 bg-slate-950/80 hover:bg-blue-600 text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors shadow-lg"
                                            title="Edit Case"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                            className="p-2 bg-slate-950/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors shadow-lg"
                                            title="Delete Case"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none"></div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col cursor-pointer" onClick={() => setViewCase(item)}>
                                    <h3 className="font-black text-lg text-white mb-3 line-clamp-1 group-hover:text-fuchsia-400 transition-colors" title={item.title}>{item.title}</h3>
                                    <div className="flex gap-2 text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
                                        <span className="bg-slate-800/80 px-2 py-1 rounded-md border border-white/5">{item.category}</span>
                                        <span className="bg-slate-800/80 px-2 py-1 rounded-md border border-white/5 text-fuchsia-400">LVL {item.difficulty}</span>
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
            {!loading && (
                <AdminPagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    className="mt-8 rounded-2xl border border-white/5 shadow-lg backdrop-blur-xl"
                />
            )}

            {/* Quick View Modal */}
            {viewCase && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl animate-in zoom-in-95">
                        <div className="absolute top-0 right-0 p-4 z-[80]">
                            <button
                                onClick={() => setViewCase(null)}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-950/80 hover:bg-slate-800 text-white backdrop-blur-md transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                            {/* Left: Slider */}
                            <div className="w-full lg:w-3/5 h-[40vh] lg:h-full bg-black relative flex-shrink-0">
                                <ImageCompareSlider 
                                    imgBefore={viewCase.imgBefore} 
                                    imgAfter={viewCase.imgAfter} 
                                    labelBefore={viewCase.labelBefore || 'Damaged'}
                                    labelAfter={viewCase.labelAfter || 'Repaired'}
                                    interactive={true}
                                />
                            </div>
                            {/* Right: Details */}
                            <div className="w-full lg:w-2/5 p-8 lg:p-10 overflow-y-auto custom-scrollbar flex flex-col bg-gradient-to-b from-slate-900 to-slate-950">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="px-3 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 text-xs font-black uppercase tracking-widest">
                                        {viewCase.category}
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest border border-slate-700">
                                        Level: {viewCase.difficulty}
                                    </div>
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4">{viewCase.title}</h2>
                                <div className="flex items-center gap-2 text-slate-400 font-medium mb-8">
                                    <Clock size={16} />
                                    <span>Time to repair: <strong className="text-white">{viewCase.time}</strong></span>
                                </div>
                                <div className="prose prose-invert prose-slate">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Repair Story</h4>
                                    <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">{viewCase.description}</p>
                                </div>
                                
                                <div className="mt-auto pt-8 flex gap-3">
                                    <button 
                                        onClick={() => { setViewCase(null); setCurrentCase(viewCase); setIsEditing(true); }}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors border border-white/5"
                                    >
                                        Edit Case
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl animate-in zoom-in-95">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500"></div>
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl shrink-0">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                {currentCase._id ? <Edit className="w-6 h-6 text-blue-400" /> : <Plus className="w-6 h-6 text-fuchsia-400" />}
                                {currentCase._id ? 'Edit Case Study' : 'New Case Study'}
                            </h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
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
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-fuchsia-500 outline-none transition-colors"
                                                    value={currentCase.title || ''}
                                                    onChange={e => setCurrentCase({ ...currentCase, title: e.target.value })}
                                                    placeholder="e.g. iPhone 14 Pro Max Screen Replacement"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Time Estimate</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-fuchsia-500 outline-none transition-colors"
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
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-fuchsia-500 outline-none transition-colors"
                                                    value={currentCase.category || 'other'}
                                                    onChange={e => setCurrentCase({ ...currentCase, category: e.target.value as any })}
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
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white focus:border-fuchsia-500 outline-none transition-colors"
                                                    value={currentCase.difficulty || 'Med'}
                                                    onChange={e => setCurrentCase({ ...currentCase, difficulty: e.target.value as any })}
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
                                    <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-3 tracking-wider"><div className="w-2 h-2 rounded-full bg-fuchsia-500"></div> Visual Evidence</h4>
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
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:border-fuchsia-500 outline-none h-32 resize-none transition-colors"
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
                                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black shadow-lg shadow-fuchsia-900/20 flex items-center gap-2 transition-all"
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
