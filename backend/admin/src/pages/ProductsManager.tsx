import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, CheckSquare, Square, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { api } from '../utils/api';

export default function ProductsManager() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
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
        features: ['', '', '', ''],
        category: 'Smartphones',
        stock: 0,
        seo: {
            metaTitle: '',
            metaDescription: '',
            keywords: '',
            canonicalUrl: ''
        },
        specs: {
            ram: '',
            os: '',
            camera: '',
            benchmarkScore: ''
        }
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products?includeOutOfStock=true&limit=1000');
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
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error('Failed to delete product');
        }
    };

    const handleSetHero = async (product: any) => {
        if (!confirm(`Set ${product.model || product.name} as the featured device on the homepage?`)) return;
        try {
            const res = await api.get('/api/settings');
            const data = res.data;
            const updatedHero = {
                ...data.hero,
                productName: product.name || product.model,
                productPrice: `€${product.price}`,
                heroImage: product.image || product.imageUrl || '',
                productLabel: 'FEATURED DEVICE'
            };
            const updatedSettings = { ...data, hero: updatedHero };
            await api.put('/api/settings', updatedSettings);
            toast.success('Successfully updated homepage featured device!');
        } catch (error) {
            console.error("Failed to set hero", error);
            toast.error('Failed to update homepage featured device.');
        }
    };

    const handleSelectAll = () => {
        if (selectedProducts.length === products.length && products.length > 0) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map(p => p._id || p.id));
        }
    };

    const toggleSelectProduct = (id: string) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(productId => productId !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) return;
        try {
            await Promise.all(selectedProducts.map(id => api.delete(`/api/products/${id}`)));
            toast.success(`Deleted ${selectedProducts.length} products`);
            fetchProducts();
            setSelectedProducts([]);
        } catch (error) {
            console.error("Failed to perform bulk delete", error);
            toast.error('Failed to perform bulk delete');
        }
    };

    const handleEdit = (product: any) => {
        setFormData({
            id: product.id || product._id,
            model: product.model || product.name || '',
            brand: product.brand || '', // Removed Apple default fallback
            price: product.price || '',
            image: product.image || '',
            condition: product.condition || 'New',
            storage: product.storage || '',
            battery: product.battery || '',
            processor: product.processor || '',
            color: product.color || '',
            display: product.display || '',
            description: product.description || '',
            features: Array.isArray(product.features) && product.features.length > 0 
                ? [...product.features, ...Array(4).fill('')].slice(0, 4) 
                : ['', '', '', ''],
            category: product.category || 'Smartphones',
            stock: product.stock ?? 0,
            seo: {
                metaTitle: product.seo?.metaTitle || '',
                metaDescription: product.seo?.metaDescription || '',
                keywords: product.seo?.keywords || '',
                canonicalUrl: product.seo?.canonicalUrl || ''
            },
            specs: {
                ram: product.specs?.ram || '',
                os: product.specs?.os || '',
                camera: product.specs?.camera || '',
                benchmarkScore: product.specs?.benchmarkScore || ''
            }
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = formData.id ? `/api/products/${formData.id}` : '/api/products';
            const payload = {
                ...formData,
                name: formData.model // Ensure backend gets 'name' which maps to 'model' in UI
            };

            if (formData.id) {
                await api.put(url, payload);
                toast.success('Product updated successfully');
            } else {
                await api.post(url, payload);
                toast.success('Product created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("Failed to save", error);
            toast.error('Failed to save product');
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
            features: ['', '', '', ''],
            category: 'Smartphones',
            stock: 0,
            seo: {
                metaTitle: '',
                metaDescription: '',
                keywords: '',
                canonicalUrl: ''
            },
            specs: {
                ram: '',
                os: '',
                camera: '',
                benchmarkScore: ''
            }
        });
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Product Manager</h2>
                    <p className="text-slate-400">Manage your marketplace inventory</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <div className="mb-6 flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <span className="text-blue-400 font-medium">
                        {selectedProducts.length} products selected
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                        <Trash2 size={16} /> Delete Selected
                    </button>
                </div>
            )}

            {/* List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <div className="p-20 text-center text-slate-400">Loading inventory...</div>
                ) : products.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">No products found. Start selling!</div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                                <th className="p-6 w-12">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-slate-400 hover:text-white transition-colors"
                                        title={selectedProducts.length === products.length && products.length > 0 ? "Deselect All" : "Select All"}
                                    >
                                        {selectedProducts.length === products.length && products.length > 0 ? (
                                            <CheckSquare size={20} className="text-blue-500" />
                                        ) : (
                                            <Square size={20} />
                                        )}
                                    </button>
                                </th>
                                <th className="p-6">Product</th>
                                <th className="p-6">Category</th>
                                <th className="p-6">Price</th>
                                <th className="p-6">Stock</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {products.map((p: any) => {
                                const productId = p._id || p.id;
                                const isSelected = selectedProducts.includes(productId);
                                return (
                                    <tr
                                        key={productId}
                                        className={`transition-colors border-b border-slate-800/50 ${isSelected ? 'bg-blue-900/20' : 'hover:bg-slate-800/50'}`}
                                    >
                                        <td className="p-6">
                                            <button
                                                onClick={() => toggleSelectProduct(productId)}
                                                className="text-slate-400 hover:text-white transition-colors flex items-center"
                                                aria-label={isSelected ? "Deselect Product" : "Select Product"}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare size={20} className="text-blue-500" />
                                                ) : (
                                                    <Square size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-6 font-bold text-white">
                                            <div className="flex items-center gap-3">
                                                {p.image && (
                                                    <img
                                                        src={p.image}
                                                        alt={p.name || p.model || "Product"}
                                                        className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                                                    />
                                                )}
                                                <div>
                                                    <div className="text-base">{p.name || p.model}</div>
                                                    <div className="text-xs text-slate-400 font-normal">
                                                        {p.condition} • {p.color} {p.storage && `• ${p.storage}`} {p.brand && `• ${p.brand}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-slate-400">{p.category}</td>
                                        <td className="p-6 text-blue-400 font-bold">€{p.price}</td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock > 0 ? (p.stock < 5 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30') : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleSetHero(p)}
                                                    className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors"
                                                    title="Set as Featured on Homepage"
                                                >
                                                    <Star size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(productId)}
                                                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close modal"
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            style={{ cursor: 'pointer', zIndex: 9999 }}
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-white mb-6">
                            {formData.id ? 'Edit Product' : 'Add New Product'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="pm-model" className="text-sm font-medium text-slate-400">Product Name / Model</label>
                                    <input
                                        id="pm-model"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="e.g. iPhone 15 Pro Max"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="pm-category" className="text-sm font-medium text-slate-400">Category</label>
                                    <select
                                        id="pm-category"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.category}
                                        title="Select item category"
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Price (€)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="999"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Stock (Quantity)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="0"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="pm-brand" className="text-sm font-medium text-slate-400">Brand</label>
                                    <select
                                        id="pm-brand"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.brand}
                                        title="Select item brand"
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
                                <div className="space-y-2">
                                    <label htmlFor="pm-condition" className="text-sm font-medium text-slate-400">Condition</label>
                                    <select
                                        id="pm-condition"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.condition}
                                        title="Select item condition"
                                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="New">New / Sealed</option>
                                        <option value="Like New">Like New</option>
                                        <option value="Very Good">Very Good</option>
                                        <option value="Good">Good</option>
                                        <option value="Refurbished">Refurbished</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Color</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="Titanium Black"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Storage</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="256GB"
                                        value={formData.storage}
                                        onChange={e => setFormData({ ...formData, storage: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Battery</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="100% / 4300mAh"
                                        value={formData.battery}
                                        onChange={e => setFormData({ ...formData, battery: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Processor</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="A17 Pro"
                                        value={formData.processor}
                                        onChange={e => setFormData({ ...formData, processor: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Display</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="6.7 inch Super Retina XDR"
                                        value={formData.display}
                                        onChange={e => setFormData({ ...formData, display: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">RAM</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="8GB"
                                        value={formData.specs.ram}
                                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, ram: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">OS (Operating System)</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="iOS 17"
                                        value={formData.specs.os}
                                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, os: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Camera Specs</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="48 MP Main, 12 MP Ultra Wide"
                                        value={formData.specs.camera}
                                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, camera: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Benchmark Score</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="e.g. 1530000"
                                        value={formData.specs.benchmarkScore}
                                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, benchmarkScore: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <ImageUpload value={formData.image} onChange={url => setFormData({ ...formData, image: url })} label="Product Image" />

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Description</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24"
                                    placeholder="Product details, specs, included accessories..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Custom Overview Features */}
                            <div className="p-4 border border-slate-700/50 rounded-xl bg-slate-900/30 space-y-4">
                                <h4 className="text-blue-400 font-bold text-sm">Product Overview Features</h4>
                                <p className="text-xs text-slate-400">Add up to 4 custom bullet points to show on the product page details tab. (Leave empty to use defaults)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[0, 1, 2, 3].map(index => (
                                        <div key={index} className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">Feature {index + 1}</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                                                placeholder={`e.g. ${['Professional Inspection', 'New Battery Installed', 'Original Accessories', 'Sanitized & Cleaned'][index]}`}
                                                value={formData.features[index]}
                                                onChange={e => {
                                                    const newFeatures = [...formData.features];
                                                    newFeatures[index] = e.target.value;
                                                    setFormData({ ...formData, features: newFeatures });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SEO settings section */}
                            <div className="p-4 border border-slate-700/50 rounded-xl bg-slate-900/30 space-y-4">
                                <h4 className="text-blue-400 font-bold text-sm">SEO Overrides (Optional)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">Meta Title</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                                            placeholder="Custom page title"
                                            value={formData.seo.metaTitle}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">Canonical URL</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                                            placeholder="https://..."
                                            value={formData.seo.canonicalUrl}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, canonicalUrl: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-slate-400">Keywords</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                                            placeholder="iphone, apple, smartphone"
                                            value={formData.seo.keywords}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, keywords: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-slate-400">Meta Description</label>
                                        <textarea
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none h-16 resize-none"
                                            placeholder="Custom meta description for search results..."
                                            value={formData.seo.metaDescription}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                <Save size={18} /> {formData.id ? 'Save Changes' : 'Create Product'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
