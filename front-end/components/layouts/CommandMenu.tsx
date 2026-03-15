import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ArrowRight, Smartphone, Compass, Clock, TerminalSquare, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { getImageUrl } from '../../utils/imageUrl';
import { formatPrice } from '../../utils/formatPrice';

interface SearchResult {
    id: string;
    model: string;
    brand: string;
    price: number;
    imageUrl?: string;
    images?: string[];
    condition: string;
    storage: string;
    color: string;
}

interface CommandMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Default suggestions when empty
    const defaultSuggestions = [
        { icon: Smartphone, label: 'Search iPhones', action: () => navigate('/marketplace?brand=apple') },
        { icon: Smartphone, label: 'Search Samsungs', action: () => navigate('/marketplace?brand=samsung') },
        { icon: Compass, label: 'Browse Marketplace', action: () => navigate('/marketplace') },
        { icon: TerminalSquare, label: 'Sell Your Device', action: () => navigate('/sell') },
    ];

    // Handle Keyboard Shortcuts (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                isOpen ? onClose() : document.dispatchEvent(new CustomEvent('open-command-menu'));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Perform Search
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Adjust endpoint based on your actual backend search route
                // Assuming /api/products supports a search or q query param
                const res = await api.get<any>(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
                const responseData = res as any;
                const data = responseData.data?.products || responseData.products || responseData.data || [];
                setResults(Array.isArray(data) ? data : []);
                setSelectedIndex(0);
            } catch (error) {
                console.error("Search failed", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // Debounce

        return () => clearTimeout(searchTimer);
    }, [query]);

    // Handle Keyboard Navigation within the menu
    useEffect(() => {
        if (!isOpen) return;

        const maxIndex = query ? results.length - 1 : defaultSuggestions.length - 1;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (query && results[selectedIndex]) {
                    handleSelectResult(results[selectedIndex].id);
                } else if (!query && defaultSuggestions[selectedIndex]) {
                    defaultSuggestions[selectedIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, query, results, selectedIndex, defaultSuggestions, onClose]);

    // Scroll selected item into view securely
    useEffect(() => {
        if (listRef.current && listRef.current.children[selectedIndex]) {
            (listRef.current.children[selectedIndex] as HTMLElement).scrollIntoView({
                block: 'nearest',
            });
        }
    }, [selectedIndex]);

    const handleSelectResult = (id: string | undefined) => {
        if (id) {
            navigate(`/products/${id}`);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 px-4 shadow-[0_0_100vw_100vw_rgba(0,0,0,0.5)]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[70vh]"
                    >
                        {/* Search Input Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 text-brand-primary animate-spin shrink-0" />
                            ) : (
                                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search products, brands, or commands..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pointer-events-none">
                                <span className="text-xs font-mono text-slate-500">ESC</span>
                            </div>
                        </div>

                        {/* Search Results / Suggestions */}
                        <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                            {!query ? (
                                // Default Suggestions
                                <div className="p-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-2">Suggestions</h3>
                                    <ul ref={listRef} className="space-y-1">
                                        {defaultSuggestions.map((item, idx) => {
                                            const Icon = item.icon;
                                            const isSelected = selectedIndex === idx;
                                            return (
                                                <li
                                                    key={idx}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                    onClick={() => { item.action(); onClose(); }}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                    {isSelected && <ArrowRight className="w-4 h-4 ml-auto" />}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                // Search Results
                                <div className="p-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-2">Products</h3>
                                    
                                    {results.length > 0 ? (
                                        <ul ref={listRef} className="space-y-1">
                                            {results.map((product, idx) => {
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <li
                                                        key={product.id || (product as any)._id}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        onClick={() => handleSelectResult(product.id || (product as any)._id)}
                                                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${
                                                            isSelected ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                        }`}
                                                    >
                                                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center p-1 border border-slate-200 dark:border-slate-700">
                                                            <img 
                                                                src={getImageUrl(product.imageUrl || product.images?.[0])} 
                                                                alt={product.model} 
                                                                className="w-full h-full object-contain"
                                                                onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-bold text-slate-900 dark:text-white truncate">{product.model}</span>
                                                                <span className="font-bold text-brand-primary whitespace-nowrap ml-2">{formatPrice(product.price)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                                                                <span>{product.storage}</span>
                                                                <span>•</span>
                                                                <span>{product.color}</span>
                                                                <span>•</span>
                                                                <span className={`px-1.5 rounded-sm ${
                                                                    product.condition?.toLowerCase() === 'new' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                                    product.condition?.toLowerCase() === 'fair' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                                                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                }`}>
                                                                    {product.condition}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : !isLoading ? (
                                        <div className="py-12 px-4 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-slate-400">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-slate-900 dark:text-white font-bold mb-1">No results found</h4>
                                            <p className="text-slate-500 text-sm">We couldn't find anything matching "{query}"</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono">↑↓</kbd> to navigate</span>
                                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono">↵</kbd> to select</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Search by</span> <span className="font-bold text-slate-700 dark:text-slate-300">HandyLand</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
