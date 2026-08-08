import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

interface CreatableDropdownProps {
    value: string;
    onChange: (value: string, label: string) => void;
    title?: string;
    defaultOptions: { value: string; label: string }[];
    storageKey: string;
    placeholder?: string;
    addLabel?: string;
}

export const CreatableDropdown: React.FC<CreatableDropdownProps> = ({ 
    value, 
    onChange, 
    title, 
    defaultOptions, 
    storageKey,
    placeholder = 'Select...',
    addLabel = 'Add Custom'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customOptions, setCustomOptions] = useState<{value: string, label: string}[]>([]);
    const [newValue, setNewValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setCustomOptions(JSON.parse(saved));
            } catch (e) {}
        }
    }, [storageKey]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsAdding(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allOptions = [...defaultOptions, ...customOptions];
    const currentOption = allOptions.find(o => o.value === value) || { value, label: value };

    const handleAdd = () => {
        if (!newValue.trim()) {
            setIsAdding(false);
            return;
        }
        
        // Use the exact string as label, and a normalized string as value
        const valStr = newValue.trim();
        const newOpt = { value: valStr, label: valStr };
        
        // Check if exists
        if (!allOptions.some(o => o.value.toLowerCase() === newOpt.value.toLowerCase())) {
            const updated = [...customOptions, newOpt];
            setCustomOptions(updated);
            localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        
        onChange(newOpt.value, newOpt.label);
        setNewValue('');
        setIsAdding(false);
        setIsOpen(false);
    };

    const handleDeleteCustom = (e: React.MouseEvent, valToRemove: string) => {
        e.stopPropagation();
        const updated = customOptions.filter(o => o.value !== valToRemove);
        setCustomOptions(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (value === valToRemove) onChange('', '');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus-within:border-blue-500 transition-colors flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
                title={title}
            >
                <span className="truncate">{currentOption.label || placeholder}</span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {allOptions.map((opt) => (
                            <div 
                                key={opt.value}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${value === opt.value ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                                onClick={() => { onChange(opt.value, opt.label); setIsOpen(false); }}
                            >
                                <span className="truncate">{opt.label}</span>
                                {customOptions.some(c => c.value === opt.value) && (
                                    <button 
                                        onClick={(e) => handleDeleteCustom(e, opt.value)}
                                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-2 border-t border-slate-800 bg-slate-950/50">
                        {isAdding ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-sm text-white outline-none focus:border-blue-500"
                                    placeholder="Type and press Enter..."
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
                                    autoFocus
                                />
                                <button onClick={handleAdd} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                                className="w-full flex items-center justify-center gap-2 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
                            >
                                <Plus size={16} /> {addLabel}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
