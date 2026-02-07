import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Save, X, Edit, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

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
    const [search, setSearch] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentCase, setCurrentCase] = useState<Partial<RepairCase>>({});

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/repair-archive');
            const data = await res.json();
            setCases(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this case?')) return;
        try {
            await fetch(`http://localhost:5000/api/repair-archive/${id}`, { method: 'DELETE' });
            setCases(cases.filter(c => c._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        try {
            const method = currentCase._id ? 'PUT' : 'POST';
            const url = currentCase._id
                ? `http://localhost:5000/api/repair-archive/${currentCase._id}`
                : 'http://localhost:5000/api/repair-archive';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentCase)
            });
            const data = await res.json();

            if (method === 'POST') {
                setCases([data, ...cases]);
            } else {
                setCases(cases.map(c => c._id === data._id ? data : c));
            }
            setIsEditing(false);
            setCurrentCase({});
        } catch (error) {
            console.error(error);
        }
    };

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white">Repair Archive</h1>
                    <p className="text-slate-400">Manage case studies and before/after showcases</p>
                </div>
                <button
                    onClick={() => { setCurrentCase({}); setIsEditing(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all"
                >
                    <Plus size={20} /> Add New Case
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search cases..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCases.map((item) => (
                    <div key={item._id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-all">
                        <div className="relative h-48 bg-black">
                            <div className="absolute inset-0 flex">
                                <div className="w-1/2 relative border-r border-white/20">
                                    <img src={item.imgBefore} className="w-full h-full object-cover opacity-70" alt="Before" />
                                    <span className="absolute top-2 left-2 text-[10px] bg-red-500/80 text-white px-2 py-0.5 rounded">Before</span>
                                </div>
                                <div className="w-1/2 relative">
                                    <img src={item.imgAfter} className="w-full h-full object-cover" alt="After" />
                                    <span className="absolute top-2 right-2 text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded">After</span>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setCurrentCase(item); setIsEditing(true); }}
                                    className="p-2 bg-slate-900/80 hover:bg-blue-600 text-white rounded-lg"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="p-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white mb-1">{item.title}</h3>
                            <div className="flex gap-2 text-xs text-slate-400 mb-2">
                                <span className="bg-slate-800 px-2 py-1 rounded capitalize">{item.category}</span>
                                <span className="bg-slate-800 px-2 py-1 rounded">Lvl: {item.difficulty}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                            <h2 className="text-xl font-bold text-white">
                                {currentCase._id ? 'Edit Case' : 'New Repair Case'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Title</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={currentCase.title || ''}
                                        onChange={e => setCurrentCase({ ...currentCase, title: e.target.value })}
                                        placeholder="e.g. iPhone 14 Pro Screen"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Time Estimate</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={currentCase.time || ''}
                                        onChange={e => setCurrentCase({ ...currentCase, time: e.target.value })}
                                        placeholder="e.g. 45m"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Category</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Difficulty</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
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

                            import ImageUpload from '../components/ImageUpload';
                            // ...
                            {/* Images */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <ImageIcon size={18} className="text-blue-400" /> Comparison Images
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <ImageUpload
                                            label="BEFORE IMAGE"
                                            value={currentCase.imgBefore || ''}
                                            onChange={(url) => setCurrentCase({ ...currentCase, imgBefore: url })}
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                                            value={currentCase.labelBefore || ''}
                                            onChange={e => setCurrentCase({ ...currentCase, labelBefore: e.target.value })}
                                            placeholder="Label (e.g. Broken Glass)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <ImageUpload
                                            label="AFTER IMAGE"
                                            value={currentCase.imgAfter || ''}
                                            onChange={(url) => setCurrentCase({ ...currentCase, imgAfter: url })}
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                                            value={currentCase.labelAfter || ''}
                                            onChange={e => setCurrentCase({ ...currentCase, labelAfter: e.target.value })}
                                            placeholder="Label (e.g. Restored)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Description</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24"
                                    value={currentCase.description || ''}
                                    onChange={e => setCurrentCase({ ...currentCase, description: e.target.value })}
                                    placeholder="Brief details about the repair..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-slate-900">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Case
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchiveManager;
