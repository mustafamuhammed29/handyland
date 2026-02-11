import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Edit2, Save, Search, Headphones, Zap, Shield, Watch } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { api } from '../utils/api';

export default function AccessoriesManager() {
    const [accessories, setAccessories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        category: 'audio',
        price: '',
        image: '',
        description: '',
        tag: '',
        battery: '',
        processor: '',
        color: '',
        display: '',
        storage: '',
        specs: { key: '', value: '' }
    });

    const fetchAccessories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/accessories');
            setAccessories(response.data);
        } catch (err) {
            console.error("Failed to load accessories:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccessories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this accessory?')) return;
        try {
            await api.delete(`/api/accessories/${id}`);
            fetchAccessories();
        } catch (error) {
            console.error("Failed to delete accessory:", error);
            alert('Failed to delete. Please try again.');
        }
    };

    const handleEdit = (item: any) => {
        const specKey = item.specs ? Object.keys(item.specs)[0] : '';
        const specValue = specKey ? item.specs[specKey] : '';

        setFormData({
            id: item.id || item._id,
            name: item.name,
            category: item.category,
            price: item.price,
            image: item.image,
            description: item.description || '',
            tag: item.tag || '',
            battery: item.battery || '',
            processor: item.processor || '',
            color: item.color || '',
            display: item.display || '',
            storage: item.storage || '',
            specs: { key: specKey, value: specValue }
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            id: '', name: '', category: 'audio', price: '', image: '', description: '', tag: '',
            battery: '', processor: '', color: '', display: '', storage: '',
            specs: { key: '', value: '' }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const specObj = formData.specs.key ? { [formData.specs.key]: formData.specs.value } : {};

            const payload = {
                ...formData,
                specs: specObj
            };

            if (formData.id) {
                await api.put(`/api/accessories/${formData.id}`, payload);
            } else {
                await api.post('/api/accessories', payload);
            }

            setIsModalOpen(false);
            resetForm();
            fetchAccessories();
        } catch (error) {
            console.error("Failed to save accessory:", error);
            alert('Failed to save. Please try again.');
        }
    };

    const filteredAccessories = accessories.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'audio': return <Headphones size={16} />;
            case 'power': return <Zap size={16} />;
            case 'protection': return <Shield size={16} />;
            case 'wearables': return <Watch size={16} />;
            default: return <Plus size={16} />;
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white">Accessories Manager</h2>
                    <p className="text-slate-400 mt-1">Manage premium gear inventory</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search accessories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder-slate-600 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 whitespace-nowrap"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Add Item</span>
                    </button>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading inventory...</div>
            ) : filteredAccessories.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    No accessories found. Add your first item!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAccessories.map((item) => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative group hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all flex flex-col h-full">
                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="bg-slate-800/90 hover:bg-blue-600 text-white p-2 rounded-lg backdrop-blur-sm transition-colors shadow-lg"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="bg-slate-800/90 hover:bg-red-600 text-white p-2 rounded-lg backdrop-blur-sm transition-colors shadow-lg"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="relative mb-4 rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] group-hover:scale-[1.02] transition-transform duration-500">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950">
                                        <div className="text-4xl">📦</div>
                                    </div>
                                )}
                                {item.tag && (
                                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                                        {item.tag}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700/50">
                                        {getCategoryIcon(item.category)}
                                        {item.category}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 leading-tight">{item.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8">{item.description || 'No description provided.'}</p>

                                {/* Specs Mini Grid */}
                                <div className="grid grid-cols-2 gap-1 mb-4">
                                    {item.color && (
                                        <div className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400 truncate">
                                            <span className="text-slate-600 mr-1">Color:</span> {item.color}
                                        </div>
                                    )}
                                    {item.storage && (
                                        <div className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400 truncate">
                                            <span className="text-slate-600 mr-1">Storage:</span> {item.storage}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">€{item.price}</span>
                                <span className="text-xs text-slate-600 font-mono">ID: {item.id ? item.id.substring(0, 6) : '...'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10 rounded-t-2xl">
                            <h3 className="text-2xl font-bold text-white">
                                {formData.id ? 'Edit Accessory' : 'New Accessory'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-slate-700">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Item Name</label>
                                        <input
                                            className="input-field"
                                            placeholder="e.g. AirPods Pro 2"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                                            <select
                                                className="input-field"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="audio">Audio</option>
                                                <option value="power">Power</option>
                                                <option value="protection">Protection</option>
                                                <option value="wearables">Wearables</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Price (€)</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="99.99"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Marketing Tag</label>
                                        <input
                                            className="input-field"
                                            placeholder="e.g. BESTSELLER"
                                            value={formData.tag}
                                            onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Product Image</label>
                                    <ImageUpload
                                        value={formData.image}
                                        onChange={(url) => setFormData({ ...formData, image: url })}
                                        label="Upload Image"
                                    />
                                </div>
                            </div>

                            {/* Detailed Specs */}
                            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                                <h4 className="text-sm font-bold text-purple-400 uppercase mb-4 flex items-center gap-2">
                                    <Zap size={16} /> Technical Specifications
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <input className="input-field text-sm" placeholder="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                                    <input className="input-field text-sm" placeholder="Storage" value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })} />
                                    <input className="input-field text-sm" placeholder="Battery" value={formData.battery} onChange={e => setFormData({ ...formData, battery: e.target.value })} />
                                    <input className="input-field text-sm" placeholder="Processor" value={formData.processor} onChange={e => setFormData({ ...formData, processor: e.target.value })} />
                                    <input className="input-field text-sm" placeholder="Display" value={formData.display} onChange={e => setFormData({ ...formData, display: e.target.value })} />

                                    {/* Custom Spec */}
                                    <div className="flex gap-2 col-span-2 md:col-span-1 border-l border-slate-800 pl-4">
                                        <input className="input-field text-xs w-1/3" placeholder="Custom Key" value={formData.specs.key} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, key: e.target.value } })} />
                                        <input className="input-field text-xs w-2/3" placeholder="Value" value={formData.specs.value} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, value: e.target.value } })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                <textarea
                                    className="input-field min-h-[100px]"
                                    placeholder="Detailed product description..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 transform hover:-translate-y-1 transition-all">
                                <Save size={20} /> {formData.id ? 'Save Changes' : 'Create Accessory'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .input-field {
                    width: 100%;
                    background: #1e293b; /* slate-800 */
                    border: 1px solid #334155; /* slate-700 */
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    color: white;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #a855f7; /* purple-500 */
                    background: #0f172a; /* slate-950 */
                    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
                }
                .input-field::placeholder {
                    color: #64748b;
                }
            `}</style>
        </div>
    );
}
