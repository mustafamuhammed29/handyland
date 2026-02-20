import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

import { api } from '../utils/api';

export default function ProductsManager() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        model: '',
        brand: '',
        price: '',
        image: '',
        condition: 'New',
        storage: '',
        battery: '',
        processor: '',
        color: '',
        display: '',
        description: '',
        category: 'Smartphones'
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products');
            // Safety check: ensure response data is an array
            if (Array.isArray(res.data)) {
                setProducts(res.data);
            } else if (res.data && Array.isArray(res.data.products)) {
                // Handle potential pagination wrapper
                setProducts(res.data.products);
            } else {
                console.error("Invalid products data format:", res.data);
                setProducts([]);
            }
        } catch (err) {
            console.error("Failed to load products", err);
            setProducts([]); // Fallback to empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/api/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleEdit = (product: any) => {
        setFormData({
            id: product.id,
            model: product.model || product.name, // Handle seed data naming config
            brand: product.brand || 'Apple', // Default fallback
            price: product.price,
            image: product.image,
            condition: product.condition || 'New',
            storage: product.storage || '',
            battery: product.battery || '',
            processor: product.processor || '',
            color: product.color || '',
            display: product.display || '',
            description: product.description || '',
            category: product.category || 'Smartphones'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = formData.id
                ? `/api/products/${formData.id}`
                : '/api/products';

            // Map frontend model field back to name if needed by backend, or adjust backend
            // Currently backend expects 'name', so we should send 'name'
            const payload = {
                ...formData,
                name: formData.model // Ensure backend gets 'name' which maps to 'model' in UI
            };

            if (formData.id) {
                await api.put(url, payload);
            } else {
                await api.post(url, payload);
            }

            setIsModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("Failed to save", error);
        }
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const resetForm = () => {
        setFormData({
            id: '',
            model: '',
            brand: '',
            price: '',
            image: '',
            condition: 'New',
            storage: '',
            battery: '',
            processor: '',
            color: '',
            display: '',
            description: '',
            category: 'Smartphones'
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white">Product Manager</h2>
                    <p className="text-slate-400 mt-1">Manage your marketplace inventory</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-slate-400">
                    <thead className="bg-slate-950 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-6">Product</th>
                            <th className="p-6">Category</th>
                            <th className="p-6">Price</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center">Loading inventory...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center">No products found. Start selling!</td></tr>
                        ) : (
                            products.map((p: any) => (
                                <tr key={p._id || p.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-6 font-bold text-white">
                                        <div className="flex items-center gap-3">
                                            {p.image && <img src={p.image} className="w-12 h-12 rounded-lg object-cover bg-slate-800" />}
                                            <div>
                                                <div className="text-base">{p.name || p.model}</div>
                                                <div className="text-xs text-slate-400 font-normal">
                                                    {p.condition} • {p.color} {p.storage && `• ${p.storage}`} {p.brand && `• ${p.brand}`}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 border border-slate-700">
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="p-6 text-emerald-400 font-mono font-bold">€{p.price}</td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            style={{ cursor: 'pointer', zIndex: 9999 }}
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-2xl font-bold text-white mb-6">
                            {formData.id ? 'Edit Product' : 'Add New Product'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Product Name / Model</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="e.g. iPhone 15 Pro Max"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Category</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Smartphones">Smartphones</option>
                                        <option value="Tablets">Tablets</option>
                                        <option value="Laptops">Laptops</option>
                                        <option value="Audio">Audio</option>
                                        <option value="Wearables">Wearables</option>
                                        <option value="Consoles">Consoles</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Price (€)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="999"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Brand</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    >
                                        <option value="">Select Brand...</option>
                                        <option value="Apple">Apple</option>
                                        <option value="Samsung">Samsung</option>
                                        <option value="Google">Google</option>
                                        <option value="Xiaomi">Xiaomi</option>
                                        <option value="Sony">Sony</option>
                                        <option value="Microsoft">Microsoft</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Condition</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.condition}
                                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="New">New / Sealed</option>
                                        <option value="Like New">Like New</option>
                                        <option value="Very Good">Very Good</option>
                                        <option value="Good">Good</option>
                                        <option value="Refurbished">Refurbished</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Color</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="Titanium Black"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Storage</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="256GB"
                                        value={formData.storage}
                                        onChange={e => setFormData({ ...formData, storage: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Battery</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="100% / 4300mAh"
                                        value={formData.battery}
                                        onChange={e => setFormData({ ...formData, battery: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Processor</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="A17 Pro"
                                        value={formData.processor}
                                        onChange={e => setFormData({ ...formData, processor: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Display</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="6.7 inch Super Retina XDR"
                                        value={formData.display}
                                        onChange={e => setFormData({ ...formData, display: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <ImageUpload
                                    value={formData.image}
                                    onChange={(url) => setFormData({ ...formData, image: url })}
                                    label="Product Image"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Description</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24"
                                    placeholder="Product details, specs, included accessories..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                <Save size={18} />
                                {formData.id ? 'Save Changes' : 'Create Product'}
                            </button>
                        </form>
                    </div >
                </div >
            )
            }
        </div >
    );
}
