import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';

interface GlobalSearchBarProps {
    className?: string;
    iconOnly?: boolean;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ className = "hidden lg:block", iconOnly = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isExpanded, setIsExpanded] = useState(!iconOnly); // Start expanded if not icon-only
    const { t } = useTranslation();

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
                if (iconOnly && !searchTerm) {
                    setIsExpanded(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setSearchTerm('');
        setResults([]);
        setShowDropdown(false);
        if (iconOnly) {
             setIsExpanded(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
            setShowDropdown(false);
        }
    };

    return (
        <div ref={wrapperRef} className={`relative ${iconOnly && !isExpanded ? 'w-10 h-10' : 'w-full max-w-sm'} transition-all duration-300 ${className}`}>
            {/* Search Icon Toggle (when inactive) */}
            {iconOnly && !isExpanded && (
                <button
                   type="button"
                   onClick={() => setIsExpanded(true)}
                   className="w-full h-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                    <Search className="w-7 h-7" />
                </button>
            )}

            {/* Immersive Overlay OR Standard Input */}
            {(!iconOnly || isExpanded) && (
                <div className={iconOnly && isExpanded ? 'fixed inset-x-0 top-0 h-full w-full max-w-7xl mx-auto px-6 flex items-center justify-center z-[100] animate-in fade-in zoom-in-95 duration-200' : 'relative w-full'}>
                    
                    {/* Background cover for immersive mode */}
                    {iconOnly && isExpanded && (
                        <div className="absolute inset-x-0 top-0 h-full w-full bg-[#0b1121] rounded-2xl border border-white/[0.1] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] px-2"></div>
                    )}
                    
                    <form onSubmit={handleSubmit} className={`relative group flex-1 flex items-center ${iconOnly && isExpanded ? 'h-full w-full z-10 px-4' : 'w-full'}`}>
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary transition-colors z-10 ${iconOnly && isExpanded ? 'w-6 h-6 left-6' : 'w-5 h-5 text-slate-500 group-focus-within:text-brand-primary'}`} />
                        <input
                            type="text"
                            autoFocus={iconOnly}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => { if (searchTerm) setShowDropdown(true); }}
                            placeholder={t('navbar.searchPlaceholder', 'Search devices...')}
                            className={`w-full bg-transparent hover:bg-white/5 focus:bg-white/5 text-white focus:outline-none transition-all placeholder:text-slate-500 ${
                                iconOnly && isExpanded 
                                ? 'h-14 text-xl rounded-xl pl-16 pr-14 border border-white/5 focus:border-brand-primary/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' 
                                : 'h-10 text-sm rounded-full pl-10 pr-10 border border-transparent focus:border-white/10'
                            }`}
                        />

                            {/* Search Loader OR Clear Button */}
                        {isSearching && (
                            <div className={`absolute top-1/2 -translate-y-1/2 text-brand-primary z-10 pointer-events-none ${iconOnly && isExpanded ? 'right-20' : 'right-10'}`}>
                                <Loader className="w-5 h-5 animate-spin" />
                            </div>
                        )}
                        
                        {searchTerm && !(iconOnly && isExpanded) && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                    {/* Close button for immersive overlay */}
                    {iconOnly && isExpanded && (
                         <button
                         type="button"
                         onClick={() => {
                             setIsExpanded(false);
                             setShowDropdown(false);
                         }}
                         className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
                     >
                         <X className="w-6 h-6" />
                     </button>
                    )}
                    </form>
                    {/* Dropdown Results */}
                    {showDropdown && searchTerm.trim().length > 0 && (
                        <div className={`absolute ${iconOnly && isExpanded ? 'top-full mt-2 left-6 right-6' : 'top-full mt-2 left-0 w-full'} bg-[#0b1121]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2`}>
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
                                        {t('search.viewAll', 'View all results →')}
                                    </Link>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-sm text-slate-500">
                                    {isSearching ? t('search.searching', 'Searching...') : t('search.noResultsFor', `No devices found for "${searchTerm}"`, { searchTerm })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
