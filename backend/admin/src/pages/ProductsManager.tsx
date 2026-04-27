import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Save, CheckSquare, Square, Star, QrCode, Printer, Search, Filter, FileSpreadsheet, Box, AlertTriangle, CheckCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { api } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import useDebounce from '../hooks/useDebounce';

interface ProductStats {
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    totalInventoryValue: number;
}

export default function ProductsManager() {
    const [products, setProducts] = useState<any[]>([]);
    const [stats, setStats] = useState<ProductStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [qrProduct, setQrProduct] = useState<any>(null);
    
    // Pagination and Filtering State
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedStockStatus, setSelectedStockStatus] = useState('');

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

    const debouncedSearch = useDebounce(searchTerm, 500);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/api/products?page=${page}&limit=${limit}&includeOutOfStock=true`;
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (selectedBrand) url += `&brand=${encodeURIComponent(selectedBrand)}`;
            // We use 'search' for category if needed, or if backend supports it we'd use &category=
            // Actually productService.getProducts doesn't have a specific category filter yet, but it searches globally.
            
            const res = await api.get(url);
            if (res.data && Array.isArray(res.data.products)) {
                let filteredProducts = res.data.products;
                
                // Client-side category filtering since backend doesn't explicitly filter by category in getProducts yet
                if (selectedCategory) {
                    filteredProducts = filteredProducts.filter((p: any) => p.category === selectedCategory);
                }
                
                // Client-side stock status filtering
                if (selectedStockStatus === 'in_stock') {
                    filteredProducts = filteredProducts.filter((p: any) => p.stock > 0);
                } else if (selectedStockStatus === 'out_of_stock') {
                    filteredProducts = filteredProducts.filter((p: any) => p.stock === 0);
                } else if (selectedStockStatus === 'low_stock') {
                    filteredProducts = filteredProducts.filter((p: any) => p.stock > 0 && p.stock < 5);
                }

                setProducts(filteredProducts);
                setTotalPages(res.data.totalPages || 1);
            } else if (Array.isArray(res.data)) {
                setProducts(res.data);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Failed to load products", err);
            toast.error('Failed to load inventory.');
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch, selectedBrand, selectedCategory, selectedStockStatus]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/products/admin/stats');
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats', error);
        }
    };

    // Data load trigger
    useEffect(() => {
        fetchProducts();
        fetchStats();
    }, [fetchProducts]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/api/products/${id}`);
            toast.success('Product deleted successfully');
            fetchProducts();
            fetchStats();
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
            fetchStats();
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
            brand: product.brand || '',
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
            fetchStats();
        } catch (error) {
            console.error("Failed to save", error);
            toast.error('Failed to save product');
        }
    };

    const handleExportCSV = () => {
        toast.success('Preparing CSV export...');
        const headers = "ID,Name,Brand,Category,Price,Stock,Condition,Storage\n";
        const rows = products.map(p => `"${p._id || p.id}","${p.name || p.model}","${p.brand}","${p.category}",${p.price},${p.stock},"${p.condition}","${p.storage || ''}"`).join('\n');
        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
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
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Box className="w-7 h-7 text-blue-400" />
                        </div>
                        Inventory Management
                    </h1>
                    <p className="text-slate-400 mt-2">Add, edit, and monitor your product catalog and stock levels.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all shadow-sm font-medium text-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-sm"
                    >
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-sm">
                        <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Total Products
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.totalProducts}</div>
                    </div>
                    <div className="bg-emerald-500/5 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl"></div>
                        <div className="text-sm font-medium text-emerald-500/80 mb-1 flex items-center gap-2 relative z-10">
                            <CheckCircle className="w-4 h-4" /> Inventory Value
                        </div>
                        <div className="text-3xl font-bold text-emerald-400 relative z-10">€{stats.totalInventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div className="bg-orange-500/5 backdrop-blur-md p-5 rounded-2xl border border-orange-500/20 shadow-sm">
                        <div className="text-sm font-medium text-orange-500/80 mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Low Stock
                        </div>
                        <div className="text-3xl font-bold text-orange-400">{stats.lowStock}</div>
                    </div>
                    <div className="bg-red-500/5 backdrop-blur-md p-5 rounded-2xl border border-red-500/20 shadow-sm">
                        <div className="text-sm font-medium text-red-500/80 mb-1 flex items-center gap-2">
                            <X className="w-4 h-4" /> Out of Stock
                        </div>
                        <div className="text-3xl font-bold text-red-400">{stats.outOfStock}</div>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 font-bold text-sm">{selectedProducts.length}</span>
                        </div>
                        <span className="text-blue-200 font-medium">products selected</span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/20"
                    >
                        <Trash2 size={16} /> Delete Selected
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, model, brand..."
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                            <select
                                className="pl-9 pr-8 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white appearance-none focus:outline-none focus:border-blue-500 transition-all"
                                value={selectedCategory}
                                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                                aria-label="Filter by Category"
                            >
                                <option value="">All Categories</option>
                                <option value="Smartphones">Smartphones</option>
                                <option value="Tablets">Tablets</option>
                                <option value="Laptops">Laptops</option>
                                <option value="Audio">Audio</option>
                                <option value="Wearables">Wearables</option>
                                <option value="Consoles">Consoles</option>
                                <option value="accessory">Accessories</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 relative">
                            <select
                                className="pl-4 pr-8 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white appearance-none focus:outline-none focus:border-blue-500 transition-all"
                                value={selectedBrand}
                                onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
                                aria-label="Filter by Brand"
                            >
                                <option value="">All Brands</option>
                                <option value="Apple">Apple</option>
                                <option value="Samsung">Samsung</option>
                                <option value="Google">Google</option>
                                <option value="Xiaomi">Xiaomi</option>
                                <option value="Sony">Sony</option>
                                <option value="Microsoft">Microsoft</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 relative">
                            <select
                                className="pl-4 pr-8 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white appearance-none focus:outline-none focus:border-blue-500 transition-all"
                                value={selectedStockStatus}
                                onChange={(e) => { setSelectedStockStatus(e.target.value); setPage(1); }}
                                aria-label="Filter by Stock"
                            >
                                <option value="">All Stock</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock (&lt; 5)</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-slate-500 hover:text-white transition-colors"
                                        title={selectedProducts.length === products.length && products.length > 0 ? "Deselect All" : "Select All"}
                                    >
                                        {selectedProducts.length === products.length && products.length > 0 ? (
                                            <CheckSquare size={18} className="text-blue-500" />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading inventory...
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Box className="w-12 h-12 text-slate-700" />
                                            <p className="text-lg font-medium text-slate-400">No products found matching criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((p: any) => {
                                    const productId = p._id || p.id;
                                    const isSelected = selectedProducts.includes(productId);
                                    return (
                                        <tr
                                            key={productId}
                                            className={`transition-colors hover:bg-slate-800/40 ${isSelected ? 'bg-blue-500/5' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleSelectProduct(productId)}
                                                    className="text-slate-500 hover:text-white transition-colors flex items-center"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare size={18} className="text-blue-500" />
                                                    ) : (
                                                        <Square size={18} />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                <div className="flex items-center gap-4">
                                                    {p.image ? (
                                                        <img
                                                            src={p.image}
                                                            alt={p.name || p.model || "Product"}
                                                            className="w-14 h-14 rounded-xl object-cover bg-slate-800/50 border border-slate-700/50 p-1"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                            <Box className="w-6 h-6 text-slate-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-base text-slate-200">{p.name || p.model}</div>
                                                        <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{p.condition}</span>
                                                            {p.color && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{p.color}</span>}
                                                            {p.storage && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{p.storage}</span>}
                                                            {p.brand && <span className="font-bold text-slate-500 ml-1">{p.brand}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs font-medium border border-slate-700/50">
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-blue-400 font-bold text-lg">€{p.price}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${p.stock > 0 ? (p.stock < 5 ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30') : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                                    {p.stock <= 0 && <X className="w-3 h-3" />}
                                                    {p.stock > 0 && p.stock < 5 && <AlertTriangle className="w-3 h-3" />}
                                                    {p.stock >= 5 && <CheckCircle className="w-3 h-3" />}
                                                    {p.stock} in stock
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleSetHero(p)}
                                                        className="p-2 bg-slate-800 hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 border border-slate-700 hover:border-yellow-500/30 rounded-lg transition-colors"
                                                        title="Set as Featured on Homepage"
                                                    >
                                                        <Star size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setQrProduct(p)}
                                                        className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 rounded-lg transition-colors"
                                                        title="Generate QR Code"
                                                    >
                                                        <QrCode size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-2 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-700 hover:border-blue-500/30 rounded-lg transition-colors"
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(productId)}
                                                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/50">
                            <div className="text-sm text-slate-400">
                                Showing page {page} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    title="Previous Page"
                                    aria-label="Previous Page"
                                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    title="Next Page"
                                    aria-label="Next Page"
                                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close modal"
                            className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                            <div className="p-2 bg-blue-500/20 rounded-xl"><Package className="w-5 h-5 text-blue-400" /></div>
                            {formData.id ? 'Edit Product' : 'Add New Product'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="pm-model" className="text-sm font-bold text-slate-400 uppercase tracking-wider">Product Name / Model</label>
                                    <input
                                        id="pm-model"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="e.g. iPhone 15 Pro Max"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="pm-category" className="text-sm font-bold text-slate-400 uppercase tracking-wider">Category</label>
                                    <select
                                        id="pm-category"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Smartphones">Smartphones</option>
                                        <option value="Tablets">Tablets</option>
                                        <option value="Laptops">Laptops</option>
                                        <option value="Audio">Audio</option>
                                        <option value="Wearables">Wearables</option>
                                        <option value="Consoles">Consoles</option>
                                        <option value="accessory">Accessory</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Price (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="999"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Stock (Quantity)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="pm-brand" className="text-sm font-bold text-slate-400 uppercase tracking-wider">Brand</label>
                                    <select
                                        id="pm-brand"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
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
                                <div className="space-y-2">
                                    <label htmlFor="pm-condition" className="text-sm font-bold text-slate-400 uppercase tracking-wider">Condition</label>
                                    <select
                                        id="pm-condition"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
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
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Color</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Titanium Black"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Storage</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="256GB"
                                        value={formData.storage}
                                        onChange={e => setFormData({ ...formData, storage: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Battery Health</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="100% / 4300mAh"
                                        value={formData.battery}
                                        onChange={e => setFormData({ ...formData, battery: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Processor</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="A17 Pro"
                                        value={formData.processor}
                                        onChange={e => setFormData({ ...formData, processor: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Display</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="6.7 inch Super Retina XDR"
                                        value={formData.display}
                                        onChange={e => setFormData({ ...formData, display: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">RAM</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="8GB"
                                        value={formData.specs.ram}
                                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, ram: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-2xl">
                                <ImageUpload value={formData.image} onChange={url => setFormData({ ...formData, image: url })} label="Product Primary Image" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Detailed Description</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-32 resize-none transition-all"
                                    placeholder="Enter full product details, included accessories, and warranty information..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Custom Overview Features */}
                            <div className="p-5 border border-slate-700/50 rounded-2xl bg-blue-900/5 space-y-4">
                                <h4 className="text-blue-400 font-bold flex items-center gap-2 border-b border-blue-500/20 pb-2">
                                    Product Highlight Bullets
                                </h4>
                                <p className="text-xs text-slate-400 mb-2">Display up to 4 custom bullet points on the product detail page.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[0, 1, 2, 3].map(index => (
                                        <div key={index} className="space-y-1">
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                            <div className="p-5 border border-slate-700/50 rounded-2xl bg-emerald-900/5 space-y-4">
                                <h4 className="text-emerald-400 font-bold flex items-center gap-2 border-b border-emerald-500/20 pb-2">
                                    Search Engine Optimization (SEO)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Meta Title</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                                            placeholder="Custom page title"
                                            value={formData.seo.metaTitle}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Canonical URL</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                                            placeholder="https://..."
                                            value={formData.seo.canonicalUrl}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, canonicalUrl: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Keywords</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                                            placeholder="iphone, apple, smartphone, used phone"
                                            value={formData.seo.keywords}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, keywords: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Meta Description</label>
                                        <textarea
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none h-16 resize-none transition-all"
                                            placeholder="Custom meta description for search results..."
                                            value={formData.seo.metaDescription}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-6">
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 text-lg"
                                >
                                    <Save size={20} /> {formData.id ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrProduct && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
                    onClick={() => setQrProduct(null)}
                >
                    <div
                        className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-8 relative shadow-2xl flex flex-col items-center animate-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setQrProduct(null)}
                            aria-label="Close modal"
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div id="print-qr-section" className="flex flex-col items-center text-center space-y-4 w-full pt-4">
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">{qrProduct.name || qrProduct.model}</h3>
                            <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">
                                {qrProduct.storage && `${qrProduct.storage} • `}{qrProduct.condition}
                            </div>
                            
                            <div className="bg-white p-5 rounded-2xl border-4 border-slate-100 shadow-md">
                                <QRCodeSVG
                                    value={`${import.meta.env.VITE_FRONTEND_URL || `http://${window.location.hostname}:3000`}/products/${qrProduct._id || qrProduct.id}`}
                                    size={220}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                            
                            <div className="text-4xl font-black mt-4 text-slate-900">
                                €{qrProduct.price}
                            </div>
                            <div className="text-xs text-slate-400 mt-2 font-medium">
                                Scan to view details & purchase
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const printContent = document.getElementById('print-qr-section')?.innerHTML;
                                const originalContent = document.body.innerHTML;
                                if (printContent) {
                                    document.body.innerHTML = `
                                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            ${printContent}
                                        </div>
                                    `;
                                    window.print();
                                    document.body.innerHTML = originalContent;
                                    window.location.reload();
                                }
                            }}
                            className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Printer size={18} /> Print Display Label
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
