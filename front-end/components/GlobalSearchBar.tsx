import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';

export const GlobalSearchBar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Debounce input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(searchTerm), 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch results
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedTerm.trim()) {
                setResults([]);
                setShowDropdown(false);
                return;
            }

            setIsSearching(true);
            try {
                // Assuming standard endpoint behavior, fetching a small limit
                const res = await api.get(`/api/products?search=${encodeURIComponent(debouncedTerm)}&limit=5`) as any;
                const products = res.products || res.data || [];
                setResults(products);
                setShowDropdown(true);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        fetchResults();
    }, [debouncedTerm]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setSearchTerm('');
        setResults([]);
        setShowDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
            setShowDropdown(false);
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-sm hidden lg:block">
            <form onSubmit={handleSubmit} className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-primary transition-colors z-10" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (searchTerm) setShowDropdown(true); }}
                    placeholder="Search devices..."
                    className="w-full bg-slate-900/50 border border-slate-700/50 text-white text-sm rounded-full pl-10 pr-10 py-2 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all placeholder:text-slate-500"
                />

                {searchTerm && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
                    >
                        {isSearching ? <Loader className="w-4 h-4 animate-spin text-brand-primary" /> : <X className="w-4 h-4" />}
                    </button>
                )}
            </form>

            {/* Dropdown Results */}
            {showDropdown && searchTerm.trim().length > 0 && (
                <div className="absolute top-full mt-2 left-0 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {results.length > 0 ? (
                        <div className="py-2">
                            {results.map(product => (
                                <Link
                                    key={product._id || product.id}
                                    to={`/marketplace/${product._id || product.id}`}
                                    onClick={() => setShowDropdown(false)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                                        <img
                                            src={getImageUrl(product.images?.[0] || product.image || product.imageUrl)}
                                            alt={product.name || product.model}
                                            className="w-full h-full object-cover"
                                            onError={(e: any) => e.target.src = '/images/placeholder.png'}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{product.name || product.model}</p>
                                        <p className="text-xs text-slate-400 capitalize">{product.condition} • {product.storage}</p>
                                    </div>
                                    <div className="text-sm font-bold text-brand-primary whitespace-nowrap">
                                        €{(product.price).toFixed(2)}
                                    </div>
                                </Link>
                            ))}
                            <Link
                                to={`/marketplace?search=${encodeURIComponent(searchTerm)}`}
                                onClick={() => setShowDropdown(false)}
                                className="block text-center text-xs text-brand-primary hover:text-brand-primary hover:bg-slate-800/50 py-3 font-bold uppercase tracking-wider transition-colors"
                            >
                                View all results →
                            </Link>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-sm text-slate-500">
                            {isSearching ? 'Searching...' : `No devices found for "${searchTerm}"`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
