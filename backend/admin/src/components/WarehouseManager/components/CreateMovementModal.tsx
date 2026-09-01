/**
 * backend/admin/src/components/WarehouseManager/components/CreateMovementModal.tsx
 * Production-ready modal dialog for recording safe atomic warehouse movements (German).
 * Features live movement preview, adaptive location validation, part search context, and reliable refetching.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Search,
    AlertTriangle,
    CheckCircle2,
    Boxes,
    Package,
    ArrowDownRight,
    ArrowUpRight,
    Wrench,
    Trash2,
    Undo2,
    ArrowLeftRight,
    MapPin,
    Hash,
    FileText,
    Info,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import useDebounce from '../../../hooks/useDebounce';
import type {
    WarehouseLocation,
    WarehousePart,
    MovementType,
    CreateMovementPayload
} from '../types';

interface CreateMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    locations: WarehouseLocation[];
    onSuccess: () => void;
    initialPart?: WarehousePart | null;
    initialMovementType?: MovementType;
}

// Mapped movement type configurations for UX
interface MovementTypeOption {
    value: MovementType;
    label: string;
    description: string;
    icon: React.ElementType;
    badgeColor: string;
    isIncrease: boolean;
}

const MOVEMENT_OPTIONS: MovementTypeOption[] = [
    {
        value: 'RECEIVE',
        label: '📥 Wareneingang (Zubuchung)',
        description: 'Neulieferung oder Wareneingang im Lager verbuchen',
        icon: ArrowDownRight,
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        isIncrease: true
    },
    {
        value: 'ADJUSTMENT_IN',
        label: '🔧 Korrektur + (Inventur Zubuchung)',
        description: 'Positiver Bestandsausgleich nach Inventur',
        icon: Wrench,
        badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        isIncrease: true
    },
    {
        value: 'ADJUSTMENT_OUT',
        label: '📤 Verbrauch / Abbuchung',
        description: 'Bestandsabbuchung oder negativer Inventurausgleich',
        icon: ArrowUpRight,
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        isIncrease: false
    },
    {
        value: 'DAMAGE',
        label: '🗑️ Defekt / Ausschuss',
        description: 'Beschädigte oder defekte Teile ausbuchen',
        icon: Trash2,
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        isIncrease: false
    },
    {
        value: 'SUPPLIER_RETURN',
        label: '↩️ Rückgabe an Lieferant',
        description: 'Rücksendung fehlerhafter Ware an den Lieferanten',
        icon: Undo2,
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        isIncrease: false
    },
    {
        value: 'TRANSFER',
        label: '🔄 Umlagerung (Interne Verschiebung)',
        description: 'Umlagerung zwischen zwei physischen Lagerorten',
        icon: ArrowLeftRight,
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        isIncrease: false
    }
];

export const CreateMovementModal: React.FC<CreateMovementModalProps> = ({
    isOpen,
    onClose,
    locations,
    onSuccess,
    initialPart = null,
    initialMovementType = 'RECEIVE'
}) => {
    // Form fields
    const [selectedPart, setSelectedPart] = useState<WarehousePart | null>(initialPart);
    const [partSearch, setPartSearch] = useState('');
    const [searchResults, setSearchResults] = useState<WarehousePart[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [movementType, setMovementType] = useState<MovementType>(initialMovementType);
    const [quantityInput, setQuantityInput] = useState<string>('1');
    const [sourceLocationId, setSourceLocationId] = useState<string>('');
    const [destinationLocationId, setDestinationLocationId] = useState<string>('');
    const [reason, setReason] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const debouncedPartSearch = useDebounce(partSearch, 300);

    // Active locations filter
    const activeLocations = useMemo(() => {
        return locations.filter((loc) => loc.isActive !== false);
    }, [locations]);

    // Reset form when modal opens or initialPart changes
    useEffect(() => {
        if (isOpen) {
            setSelectedPart(initialPart || null);
            setPartSearch('');
            setSearchResults([]);
            setMovementType(initialMovementType);
            setQuantityInput('1');
            setSourceLocationId('');
            setDestinationLocationId('');
            setReason('');
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, initialPart, initialMovementType]);

    // Bounded search for parts against safe read endpoint
    useEffect(() => {
        const searchParts = async () => {
            if (!debouncedPartSearch.trim() || selectedPart?.name === debouncedPartSearch) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            try {
                const res = await api.get('/api/warehouse/parts', {
                    params: {
                        search: debouncedPartSearch.trim().slice(0, 100),
                        limit: 10,
                        status: 'active'
                    }
                });

                if (res.data?.success && Array.isArray(res.data?.data)) {
                    setSearchResults(res.data.data);
                    setIsDropdownOpen(true);
                }
            } catch (err) {
                console.error('Failed to search repair parts:', err);
            } finally {
                setSearchLoading(false);
            }
        };

        searchParts();
    }, [debouncedPartSearch, selectedPart]);

    if (!isOpen) return null;

    // Field requirement flags based on movement type
    const needsSource = ['TRANSFER', 'ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN'].includes(movementType);
    const needsDestination = ['RECEIVE', 'ADJUSTMENT_IN', 'TRANSFER'].includes(movementType);
    const reasonRequired = ['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN'].includes(movementType);

    // Location Objects for live preview
    const sourceLocation = activeLocations.find((l) => l.id === sourceLocationId);
    const destinationLocation = activeLocations.find((l) => l.id === destinationLocationId);

    // Handler when movement type changes: clear irrelevant locations
    const handleMovementTypeChange = (newType: MovementType) => {
        setMovementType(newType);
        setFormError(null);

        const willNeedSource = ['TRANSFER', 'ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN'].includes(newType);
        const willNeedDestination = ['RECEIVE', 'ADJUSTMENT_IN', 'TRANSFER'].includes(newType);

        if (!willNeedSource) setSourceLocationId('');
        if (!willNeedDestination) setDestinationLocationId('');
    };

    // Form submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // 1. Part validation
        if (!selectedPart || !selectedPart.id) {
            setFormError('Bitte wählen Sie zuerst ein konkretes Ersatzteil aus dem Katalog aus.');
            return;
        }

        // 2. Quantity validation (strict integer check)
        const qtyNum = Number(quantityInput);
        if (!quantityInput || isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum < 1 || qtyNum > 100000) {
            setFormError('Bitte geben Sie eine gültige ganze Menge von mindestens 1 Stück ein.');
            return;
        }

        // 3. Location validation
        if (needsSource && !sourceLocationId) {
            setFormError('Bitte wählen Sie den Ausgangslagerort für diese Buchung aus.');
            return;
        }

        if (needsDestination && !destinationLocationId) {
            setFormError('Bitte wählen Sie den Ziellagerort für diese Buchung aus.');
            return;
        }

        if (movementType === 'TRANSFER' && sourceLocationId === destinationLocationId) {
            setFormError('Ausgangs- und Ziellagerort dürfen bei einer Umlagerung nicht identisch sein.');
            return;
        }

        // 4. Reason validation
        if (reasonRequired && (!reason.trim() || reason.trim().length < 3)) {
            setFormError('Für diese Bewegungsart ist ein verständlicher Grund erforderlich (mindestens 3 Zeichen).');
            return;
        }

        // 5. Construct payload
        const payload: CreateMovementPayload = {
            repairPartId: selectedPart.id,
            movementType,
            quantity: qtyNum
        };

        if (needsSource) payload.sourceLocationId = sourceLocationId;
        if (needsDestination) payload.destinationLocationId = destinationLocationId;
        if (reason.trim()) payload.reason = reason.trim().slice(0, 500);

        setIsSubmitting(true);
        try {
            const res = await api.post('/api/warehouse/movements', payload);
            if (res.data?.success) {
                toast.success('✅ Lagerbewegung erfolgreich gebucht.');
                await onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'Die Lagerbewegung konnte nicht gebucht werden.');
            }
        } catch (err: any) {
            const status = err.response?.status;
            const backendError = err.response?.data?.error;
            const backendMessage = err.response?.data?.message;

            if (status === 401) {
                setFormError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
            } else if (backendError === 'WAREHOUSE_INSUFFICIENT_STOCK') {
                setFormError('Nicht genügend verfügbarer Bestand am Ausgangsort für diese Bewegung.');
            } else if (backendError === 'WAREHOUSE_PART_OR_LOCATION_NOT_AVAILABLE') {
                setFormError('Ersatzteil oder Lagerort ist nicht mehr verfügbar. Bitte aktualisieren Sie die Daten.');
            } else if (backendError === 'WAREHOUSE_MOVEMENT_INVALID') {
                setFormError(backendMessage || 'Ungültige Parameter für diese Lagerbewegung. Bitte prüfen Sie Ersatzteil, Menge und Lagerort.');
            } else if (backendError === 'WAREHOUSE_MOVEMENT_CONFLICT') {
                setFormError('Konflikt bei der Buchung aufgetreten. Bitte versuchen Sie es erneut.');
            } else {
                setFormError(backendMessage || 'Die Lagerbewegung konnte nicht gebucht werden. Bitte prüfen Sie Ersatzteil, Menge, Lagerort und Bewegungsart.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentOption = MOVEMENT_OPTIONS.find((o) => o.value === movementType) || MOVEMENT_OPTIONS[0];
    const IconComponent = currentOption.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Boxes size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                Neue Lagerbewegung erfassen
                            </h3>
                            <p className="text-xs text-slate-400">
                                Unveränderliche Transaktion im physischen Lagerjournal buchen
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                    {/* Error Banner */}
                    {formError && (
                        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl flex items-start gap-3 text-red-200 text-xs animate-shake">
                            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1 leading-relaxed">{formError}</div>
                        </div>
                    )}

                    {/* 1. Part Search & Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Package size={14} className="text-blue-400" />
                            <span>Ersatzteil</span>
                            <span className="text-red-400">*</span>
                        </label>

                        {selectedPart ? (
                            <div className="p-3.5 bg-slate-950/90 border border-blue-500/40 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-white truncate">
                                            {selectedPart.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                            <span className="text-blue-400">{selectedPart.sku}</span>
                                            {selectedPart.brand && (
                                                <>
                                                    <span>•</span>
                                                    <span>{selectedPart.brand}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-400">Verfügbar</div>
                                        <div className="text-xs font-bold text-emerald-400 font-mono">
                                            {selectedPart.availableQuantity} Stk.
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPart(null);
                                            setPartSearch('');
                                            setSearchResults([]);
                                        }}
                                        disabled={isSubmitting}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Ersatzteil ändern"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Nach Name, SKU oder Barcode suchen …"
                                    value={partSearch}
                                    onChange={(e) => {
                                        setPartSearch(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <Search className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" size={16} />

                                {/* Search Dropdown Results */}
                                {isDropdownOpen && (
                                    <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto custom-scrollbar">
                                        {searchLoading ? (
                                            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                                <RefreshCw size={14} className="animate-spin text-blue-400" />
                                                <span>Suche läuft …</span>
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-500">
                                                {partSearch.trim() ? 'Keine Ersatzteile gefunden' : 'Tippen Sie zur Suche im Katalog'}
                                            </div>
                                        ) : (
                                            searchResults.map((part) => (
                                                <button
                                                    key={part.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPart(part);
                                                        setPartSearch('');
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-slate-800/80 flex items-center justify-between border-b border-slate-800/60 last:border-0 transition-colors"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <div className="font-semibold text-xs text-white truncate">
                                                            {part.name}
                                                        </div>
                                                        <div className="text-[11px] text-blue-400 font-mono flex items-center gap-2 mt-0.5">
                                                            <span>{part.sku}</span>
                                                            {part.brand && <span className="text-slate-500">• {part.brand}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                                                            Verfügbar: {part.availableQuantity}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-[11px] text-slate-500 mt-1">
                            Wählen Sie das konkrete Ersatzteil aus dem Katalog.
                        </p>
                    </div>

                    {/* 2. Movement Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <IconComponent size={14} className="text-blue-400" />
                            <span>Bewegungsart</span>
                            <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={movementType}
                            onChange={(e) => handleMovementTypeChange(e.target.value as MovementType)}
                            disabled={isSubmitting}
                            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                        >
                            {MOVEMENT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                            {currentOption.description}
                        </p>
                    </div>

                    {/* 3. Quantity & Help Check */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Hash size={14} className="text-blue-400" />
                            <span>Menge</span>
                            <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100000"
                            step="1"
                            value={quantityInput}
                            onChange={(e) => setQuantityInput(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Menge (z.B. 5)"
                            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="flex items-center justify-between text-[11px] mt-1">
                            <span className="text-slate-500">Nur ganze Stückzahlen (mind. 1).</span>
                            {selectedPart && !currentOption.isIncrease && movementType !== 'TRANSFER' && Number(quantityInput) > selectedPart.availableQuantity && (
                                <span className="text-amber-400 font-medium flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Übersteigt verf. Bestand ({selectedPart.availableQuantity})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 4. Adaptive Location Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Source Location */}
                        {needsSource && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-amber-400" />
                                    <span>Ausgangslagerort</span>
                                    <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={sourceLocationId}
                                    onChange={(e) => setSourceLocationId(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                                >
                                    <option value="">Ausgangsort wählen …</option>
                                    {activeLocations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.locationCode} ({loc.zone})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">Physischer Ort für Abbuchung.</p>
                            </div>
                        )}

                        {/* Destination Location */}
                        {needsDestination && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-emerald-400" />
                                    <span>Ziellagerort</span>
                                    <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={destinationLocationId}
                                    onChange={(e) => setDestinationLocationId(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                                >
                                    <option value="">Zielort wählen …</option>
                                    {activeLocations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.locationCode} ({loc.zone})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">Physischer Ort für Zubuchung.</p>
                            </div>
                        )}
                    </div>

                    {/* 5. Reason / Reference */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <FileText size={14} className="text-blue-400" />
                            <span>Grund / Referenz</span>
                            {reasonRequired ? <span className="text-red-400">*</span> : <span className="text-slate-500">(Optional)</span>}
                        </label>
                        <input
                            type="text"
                            placeholder={reasonRequired ? 'Grund für Korrektur, Defekt oder Retoure …' : 'Optionale Notiz zur Bewegung …'}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={500}
                            disabled={isSubmitting}
                            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        {reasonRequired && (
                            <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                                <Info size={11} />
                                Für diese Bewegungsart ist ein Grund erforderlich.
                            </p>
                        )}
                    </div>

                    {/* 6. Live Movement Preview Card */}
                    {selectedPart && Number(quantityInput) > 0 && (
                        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs shadow-inner">
                            <span className="text-slate-400 font-medium flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${currentOption.badgeColor}`}>
                                    {movementType}
                                </span>
                                <span>Vorschau Buchung:</span>
                            </span>
                            <span className="font-bold text-white font-mono flex items-center gap-1">
                                {currentOption.isIncrease ? (
                                    <span className="text-emerald-400">+{Number(quantityInput)} Stk.</span>
                                ) : movementType === 'TRANSFER' ? (
                                    <span className="text-blue-400">{Number(quantityInput)} Stk.</span>
                                ) : (
                                    <span className="text-amber-400">-{Number(quantityInput)} Stk.</span>
                                )}
                                {sourceLocation && <span className="text-slate-400">({sourceLocation.locationCode}</span>}
                                {sourceLocation && destinationLocation && <span className="text-slate-500">→</span>}
                                {destinationLocation && <span className="text-slate-400">{destinationLocation.locationCode})</span>}
                                {!destinationLocation && sourceLocation && <span className="text-slate-400">)</span>}
                            </span>
                        </div>
                    )}

                    {/* Submit Actions */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
                        >
                            Abbrechen
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw size={15} className="animate-spin text-white" />
                                    <span>Bewegung wird gebucht …</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Lagerbewegung buchen</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
