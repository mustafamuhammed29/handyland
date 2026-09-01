/**
 * backend/admin/src/components/WarehouseManager/components/AddPartModal.tsx
 * Context-aware German modal dialog for creating a new canonical repair part with smart prefill,
 * presets, auto-suggestions, duplicate detection, and optional atomic Wareneingang (RECEIVE) booking.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    X,
    Wrench,
    CheckCircle2,
    AlertTriangle,
    Info,
    Lock,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Layers,
    PlusCircle,
    RotateCcw,
    Boxes
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import {
    TEILETYP_OPTIONS,
    QUALITAET_OPTIONS,
    KATEGORIE_OPTIONS,
    deriveCategoryFromPartType,
    suggestPartName,
    suggestPartSku,
    findPotentialDuplicate
} from '../utils/catalogHelpers';
import type { WarehousePart, WarehouseLocation } from '../types';

interface AddPartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialBrand?: string;
    initialDeviceFamily?: string;
    initialCompatibleDevice?: string;
    deviceModelId?: string;
    existingParts?: WarehousePart[];
    locations?: WarehouseLocation[];
}

export const AddPartModal: React.FC<AddPartModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialBrand,
    initialDeviceFamily,
    initialCompatibleDevice,
    deviceModelId,
    existingParts = [],
    locations = []
}) => {
    // Model Context Detection
    const isModelContext = Boolean(initialCompatibleDevice && initialCompatibleDevice.trim());
    const exactContextModel = initialCompatibleDevice?.trim() || '';
    const exactContextBrand = initialBrand?.trim() || 'Apple';

    // Primary Form Fields
    const [partType, setPartType] = useState<string>('Display');
    const [quality, setQuality] = useState<string>('Original / OEM');
    const [category, setCategory] = useState<string>('Display');
    const [name, setName] = useState<string>('');
    const [sku, setSku] = useState<string>('');
    const [barcode, setBarcode] = useState<string>('');
    const [minStock, setMinStock] = useState<string>('2');

    // Intake Fields (Erster Wareneingang)
    const [intakeLocationId, setIntakeLocationId] = useState<string>('');
    const [intakeQuantity, setIntakeQuantity] = useState<string>('');
    const [intakeReference, setIntakeReference] = useState<string>('');

    // Available Active Locations
    const [availableLocations, setAvailableLocations] = useState<WarehouseLocation[]>([]);
    const [locationsLoading, setLocationsLoading] = useState<boolean>(false);

    // Advanced / Context Fields
    const [brand, setBrand] = useState<string>('Apple');
    const [deviceFamily, setDeviceFamily] = useState<string>('');
    const [compatibleDevicesText, setCompatibleDevicesText] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    // Edit tracking flags
    const [isNameManuallyEdited, setIsNameManuallyEdited] = useState<boolean>(false);
    const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState<boolean>(false);

    // Submission & progress states
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submittingStep, setSubmittingStep] = useState<'part' | 'movement' | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [partialFailurePart, setPartialFailurePart] = useState<{ id: string; name: string; sku: string } | null>(null);

    // Load and filter active locations
    useEffect(() => {
        if (!isOpen) return;

        if (locations && locations.length > 0) {
            setAvailableLocations(locations.filter((l) => l.isActive));
        } else {
            setLocationsLoading(true);
            api.get('/api/warehouse/locations', { params: { active: 'true' } })
                .then((res) => {
                    if (res.data?.success && Array.isArray(res.data?.data)) {
                        setAvailableLocations(res.data.data.filter((l: WarehouseLocation) => l.isActive));
                    }
                })
                .catch((err) => {
                    console.error('Failed to fetch active warehouse locations:', err);
                })
                .finally(() => {
                    setLocationsLoading(false);
                });
        }
    }, [isOpen, locations]);

    // Current active model for suggestion
    const activeModelName = useMemo(() => {
        if (isModelContext) return exactContextModel;
        const firstComp = compatibleDevicesText.split(/[,\n]/)[0]?.trim();
        return firstComp || deviceFamily.trim() || '';
    }, [isModelContext, exactContextModel, compatibleDevicesText, deviceFamily]);

    // Reset part-specific and intake fields
    const resetPartFields = useCallback((targetModel: string, targetBrand: string, targetFamily: string) => {
        setPartType('Display');
        setQuality('Original / OEM');
        const defaultCat = deriveCategoryFromPartType('Display');
        setCategory(defaultCat);

        const initialSuggestedName = suggestPartName(targetModel, 'Display', 'Original / OEM');
        const initialSuggestedSku = suggestPartSku(targetModel, 'Display', 'Original / OEM');

        setName(initialSuggestedName);
        setSku(initialSuggestedSku);
        setBarcode('');
        setMinStock('2');

        setIntakeLocationId('');
        setIntakeQuantity('');
        setIntakeReference('');

        setBrand(targetBrand);
        setDeviceFamily(targetFamily || targetModel);
        setCompatibleDevicesText(targetModel);

        setIsNameManuallyEdited(false);
        setIsSkuManuallyEdited(false);
        setFormError(null);
        setPartialFailurePart(null);
        setIsSubmitting(false);
        setSubmittingStep(null);
    }, []);

    // Initialize when modal opens or context changes
    useEffect(() => {
        if (isOpen) {
            const b = isModelContext ? exactContextBrand : (initialBrand || 'Apple');
            const m = isModelContext ? exactContextModel : (initialCompatibleDevice || '');
            const fam = initialDeviceFamily || m;
            resetPartFields(m, b, fam);
            setShowAdvanced(!isModelContext);
        }
    }, [isOpen, isModelContext, exactContextBrand, exactContextModel, initialBrand, initialDeviceFamily, initialCompatibleDevice, resetPartFields]);

    // Escape key listener (only when not submitting)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    // Auto-update suggestions when type, quality, or model changes
    const handleTypeChange = (newType: string) => {
        setPartType(newType);
        const derivedCat = deriveCategoryFromPartType(newType);
        setCategory(derivedCat);

        if (!isNameManuallyEdited) {
            setName(suggestPartName(activeModelName, newType, quality));
        }
        if (!isSkuManuallyEdited) {
            setSku(suggestPartSku(activeModelName, newType, quality));
        }
    };

    const handleQualityChange = (newQuality: string) => {
        setQuality(newQuality);

        if (!isNameManuallyEdited) {
            setName(suggestPartName(activeModelName, partType, newQuality));
        }
        if (!isSkuManuallyEdited) {
            setSku(suggestPartSku(activeModelName, partType, newQuality));
        }
    };

    // Quick Preset click handler
    const handleApplyPreset = (presetType: string) => {
        handleTypeChange(presetType);
    };

    // Restore auto-suggested name
    const handleRestoreSuggestedName = () => {
        const suggested = suggestPartName(activeModelName, partType, quality);
        setName(suggested);
        setIsNameManuallyEdited(false);
    };

    // Restore auto-suggested SKU
    const handleRestoreSuggestedSku = () => {
        const suggested = suggestPartSku(activeModelName, partType, quality);
        setSku(suggested);
        setIsSkuManuallyEdited(false);
    };

    // Duplicate detection in current loaded catalog
    const potentialDuplicate = useMemo(() => {
        if (!activeModelName || !partType) return null;
        return findPotentialDuplicate(existingParts, activeModelName, partType, quality);
    }, [existingParts, activeModelName, partType, quality]);

    // Check if Wareneingang intake is actively configured
    const isIntakeRequested = Boolean(intakeLocationId.trim() || intakeQuantity.trim());

    if (!isOpen) return null;

    // Save action (handles catalog create + optional RECEIVE movement)
    const handleExecuteSave = async (continueAfterSave: boolean) => {
        setFormError(null);
        setPartialFailurePart(null);

        const trimmedName = name.trim();
        const trimmedSku = sku.trim().toUpperCase();

        if (!trimmedName) {
            setFormError('Ersatzteilbezeichnung ist erforderlich.');
            return;
        }

        if (!trimmedSku) {
            setFormError('SKU-Code ist erforderlich.');
            return;
        }

        // Validate SKU characters
        const skuRegex = /^[A-Z0-9_.\-/]{1,80}$/;
        if (!skuRegex.test(trimmedSku)) {
            setFormError('Der SKU-Code darf nur Großbuchstaben, Ziffern, Bindestriche (-) und Unterstriche (_) enthalten.');
            return;
        }

        const parsedMinStock = parseInt(minStock, 10);
        if (Number.isNaN(parsedMinStock) || parsedMinStock < 0) {
            setFormError('Mindestbestand muss eine positive ganze Zahl oder 0 sein.');
            return;
        }

        // Validate Intake fields if either location or quantity is set
        let parsedIntakeQty = 0;
        let targetLocationId = '';

        if (isIntakeRequested) {
            if (!intakeLocationId.trim()) {
                setFormError('Bitte wählen Sie einen Lagerort aus.');
                return;
            }
            if (!intakeQuantity.trim()) {
                setFormError('Bitte geben Sie eine ganze Menge von mindestens 1 Stück ein.');
                return;
            }
            parsedIntakeQty = parseInt(intakeQuantity, 10);
            if (!Number.isInteger(parsedIntakeQty) || parsedIntakeQty < 1 || parsedIntakeQty > 100000) {
                setFormError('Bitte geben Sie eine ganze Menge von mindestens 1 Stück ein.');
                return;
            }

            const selectedLoc = availableLocations.find((l) => l.id === intakeLocationId.trim());
            if (!selectedLoc || !selectedLoc.isActive) {
                setFormError('Inaktive Lagerorte können nicht für Wareneingänge verwendet werden.');
                return;
            }
            targetLocationId = selectedLoc.id;
        }

        // Parse compatible devices
        const rawDevices = isModelContext
            ? [exactContextModel]
            : compatibleDevicesText
                .split(/[,\n]/)
                .map((d) => d.trim())
                .filter((d) => d.length > 0);

        if (rawDevices.length === 0 && activeModelName) {
            rawDevices.push(activeModelName);
        }

        const finalBrand = isModelContext ? exactContextBrand : (brand.trim() || 'Apple');
        const finalFamily = isModelContext ? (initialDeviceFamily || exactContextModel) : (deviceFamily.trim() || activeModelName);

        const catalogPayload: Record<string, any> = {
            name: trimmedName,
            sku: trimmedSku,
            minStock: parsedMinStock,
            category: category.trim() || deriveCategoryFromPartType(partType),
            partType: partType.trim(),
            quality: quality.trim(),
            brand: finalBrand,
            deviceFamily: finalFamily,
            compatibleDevices: rawDevices
        };

        if (deviceModelId && !deviceModelId.startsWith('derived-')) {
            catalogPayload.deviceModelId = deviceModelId;
        }

        if (barcode.trim()) {
            catalogPayload.barcode = barcode.trim().toUpperCase();
        }

        setIsSubmitting(true);
        setSubmittingStep('part');

        let createdPart: any = null;

        try {
            // Step 1: Create catalog part
            const partRes = await api.post('/api/warehouse/parts', catalogPayload);
            if (!partRes.data?.success || !partRes.data?.data?.id) {
                setFormError(partRes.data?.message || 'Fehler beim Anlegen des Ersatzteils.');
                setIsSubmitting(false);
                setSubmittingStep(null);
                return;
            }
            createdPart = partRes.data.data;
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_MODEL_INACTIVE') {
                setFormError('Dieses Gerätemodell ist inaktiv. Neue Ersatzteile können für inaktive Modelle nicht angelegt werden.');
            } else if (errorCode === 'WAREHOUSE_PART_SKU_EXISTS') {
                setFormError('Dieser SKU-Code existiert bereits im Lager. Bitte wählen Sie einen eindeutigen SKU.');
            } else if (errorCode === 'WAREHOUSE_PART_BARCODE_EXISTS') {
                setFormError('Dieser Barcode wird bereits für ein anderes Ersatzteil verwendet.');
            } else {
                setFormError(err.response?.data?.message || 'Fehler beim Anlegen des Ersatzteils. Bitte Eingaben prüfen.');
            }
            setIsSubmitting(false);
            setSubmittingStep(null);
            return;
        }

        // Step 2: Book RECEIVE movement if intake is requested
        if (isIntakeRequested && createdPart?.id) {
            setSubmittingStep('movement');
            try {
                const movementPayload: Record<string, any> = {
                    repairPartId: createdPart.id,
                    movementType: 'RECEIVE',
                    quantity: parsedIntakeQty,
                    destinationLocationId: targetLocationId,
                    reason: intakeReference.trim() || 'Erster Wareneingang beim Anlegen'
                };

                const movRes = await api.post('/api/warehouse/movements', movementPayload);
                if (!movRes.data?.success) {
                    throw new Error(movRes.data?.message || 'Lagerbewegung fehlgeschlagen');
                }

                toast.success(`Ersatzteil angelegt und Wareneingang erfolgreich gebucht (${parsedIntakeQty} Stk.).`);
                onSuccess();

                if (continueAfterSave) {
                    resetPartFields(activeModelName, finalBrand, finalFamily);
                } else {
                    onClose();
                }
            } catch (movErr: any) {
                // Partial failure: Part exists with 0 stock, movement failed
                console.error('Movement failed after part creation:', movErr);
                setPartialFailurePart({
                    id: createdPart.id,
                    name: createdPart.name || trimmedName,
                    sku: createdPart.sku || trimmedSku
                });
                setFormError(
                    'Das Ersatzteil wurde angelegt, aber der Wareneingang konnte nicht gebucht werden. Der Bestand ist weiterhin 0 Stück. Bitte buchen Sie den Wareneingang über Lagerbewegungen.'
                );
                // Refresh catalog so the created 0-stock part is immediately visible
                onSuccess();
            } finally {
                setIsSubmitting(false);
                setSubmittingStep(null);
            }
        } else {
            // Catalog-only creation success
            toast.success(`Ersatzteil „${trimmedSku}“ erfolgreich angelegt.`);
            onSuccess();

            if (continueAfterSave) {
                resetPartFields(activeModelName, finalBrand, finalFamily);
            } else {
                onClose();
            }
            setIsSubmitting(false);
            setSubmittingStep(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Wrench size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Neues Ersatzteil anlegen</h3>
                            <p className="text-xs text-slate-400">
                                {isModelContext ? `Katalogartikel für ${exactContextModel} definieren` : 'Neuen Artikel im internen Ersatzteilkatalog anlegen'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-30"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                    {/* 1. Context Banner */}
                    {isModelContext && (
                        <div className="bg-gradient-to-r from-blue-950/60 to-slate-900/60 border border-blue-500/40 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <Lock size={15} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 block">
                                        Modellkontext aktiv
                                    </span>
                                    <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                                        <span>Kontext:</span>
                                        <span className="text-blue-300 font-mono">{exactContextBrand} / {exactContextModel}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-md hidden sm:inline-block">
                                Automatisch zugeordnet
                            </span>
                        </div>
                    )}

                    {/* Stock Rule Transparency Banner */}
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-2.5 text-slate-400 text-xs">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-slate-300 block mb-0.5">Hinweis zur Bestandsführung:</span>
                            <span>
                                Bestände werden ausschließlich über <strong>Lagerbewegungen (RECEIVE)</strong> gebucht. Im Katalog wird kein direkter Anfangsbestand manipuliert.
                            </span>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {formError && (
                        <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl space-y-2 text-red-200 text-xs">
                            <div className="flex items-start gap-2.5">
                                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <span>{formError}</span>
                                    {partialFailurePart && (
                                        <p className="mt-1 font-mono text-[11px] text-red-300">
                                            Angelegter Artikel: {partialFailurePart.name} (SKU: {partialFailurePart.sku})
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Duplicate Warning Banner (Non-blocking) */}
                    {potentialDuplicate && (
                        <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-amber-200 text-xs">
                            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-amber-300 block mb-0.5">Mögliches Duplikat im Katalog gefunden:</span>
                                <span>
                                    Für dieses Modell und diese Kombination existiert möglicherweise bereits ein Ersatzteil:{' '}
                                    <strong className="text-white">{potentialDuplicate.name}</strong> (SKU: <code className="font-mono text-amber-300">{potentialDuplicate.sku}</code>). Bitte prüfen Sie die SKU.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 2. Quick Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-blue-400" />
                                <span>Schnellvorlagen für häufige Reparaturteile</span>
                            </label>
                            <span className="text-[11px] text-slate-500">Klick füllt Vorlage aus</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {(['Display', 'Akku', 'Ladebuchse', 'Rückglas', 'Rückkamera'] as const).map((preset) => {
                                const isActive = partType === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => handleApplyPreset(preset)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                            isActive
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Primary Select Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Teiletyp */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Teiletyp <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={partType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {TEILETYP_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Qualität */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Qualität <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={quality}
                                onChange={(e) => handleQualityChange(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {QUALITAET_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Kategorie */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-300">
                                    Kategorie <span className="text-red-400">*</span>
                                </label>
                                <span className="text-[10px] text-slate-500">Automatisch abgeleitet</span>
                            </div>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {KATEGORIE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 4. Bezeichnung (Name) */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-slate-300">
                                Ersatzteilbezeichnung (Name) <span className="text-red-400">*</span>
                            </label>
                            {isNameManuallyEdited ? (
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={handleRestoreSuggestedName}
                                    className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
                                >
                                    <RotateCcw size={11} />
                                    <span>Vorschlag wiederherstellen</span>
                                </button>
                            ) : (
                                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                    <Sparkles size={11} />
                                    <span>Automatisch vorgeschlagen</span>
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setIsNameManuallyEdited(true);
                            }}
                            maxLength={120}
                            placeholder="z.B. Display iPhone 14 Plus – Original"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* 5. SKU & Barcode Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* SKU */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-300">
                                    SKU-Code <span className="text-red-400">*</span>
                                </label>
                                {isSkuManuallyEdited ? (
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={handleRestoreSuggestedSku}
                                        className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
                                    >
                                        <RotateCcw size={11} />
                                        <span>SKU-Vorschlag</span>
                                    </button>
                                ) : (
                                    <span className="text-[10px] text-emerald-400 font-medium">Auto-Vorschlag</span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={sku}
                                onChange={(e) => {
                                    setSku(e.target.value.toUpperCase());
                                    setIsSkuManuallyEdited(true);
                                }}
                                maxLength={80}
                                placeholder="IP14PL-DIS-OEM"
                                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Nach dem Speichern unveränderlicher Eindeutigkeitsschlüssel.</p>
                        </div>

                        {/* Barcode */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Barcode (Optional)
                            </label>
                            <input
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                                maxLength={80}
                                placeholder="880IP14PL001"
                                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Optionaler EAN/Hersteller-Barcode.</p>
                        </div>
                    </div>

                    {/* 6. Mindestbestand */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Mindestbestand für Benachrichtigung (Min Stock) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100000"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            className="w-full sm:w-48 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                            Löst bei Erreichen oder Unterschreiten den Status „Niedriger Bestand“ aus.
                        </p>
                    </div>

                    {/* 7. Erster Wareneingang (Optional Intake Section) */}
                    <div className="pt-4 border-t border-slate-800/80 space-y-3.5">
                        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Boxes size={15} className="text-blue-400" />
                                    <span>Erster Wareneingang</span>
                                    <span className="text-[10px] font-normal text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-full">
                                        Optional
                                    </span>
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                    Optional: Bestand wird nach dem Anlegen als Lagerbewegung gebucht.
                                </span>
                            </div>

                            <p className="text-[10px] text-slate-500">
                                Der Lagerbestand wird nicht direkt gespeichert, sondern als Wareneingang dokumentiert.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                {/* Lagerort */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Lagerort {isIntakeRequested && <span className="text-red-400">*</span>}
                                    </label>
                                    <select
                                        value={intakeLocationId}
                                        onChange={(e) => setIntakeLocationId(e.target.value)}
                                        disabled={isSubmitting || locationsLoading}
                                        className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Lagerort auswählen …</option>
                                        {availableLocations.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.locationCode} ({loc.zone}{loc.description ? ` – ${loc.description}` : ''})
                                            </option>
                                        ))}
                                    </select>
                                    {availableLocations.length === 0 && !locationsLoading && (
                                        <p className="text-[10px] text-amber-400 mt-1">Keine aktiven Lagerorte gefunden.</p>
                                    )}
                                </div>

                                {/* Menge */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Menge {isIntakeRequested && <span className="text-red-400">*</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={intakeQuantity}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^[0-9]+$/.test(val)) {
                                                    setIntakeQuantity(val);
                                                }
                                            }}
                                            placeholder="z. B. 10"
                                            disabled={isSubmitting}
                                            className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-3.5 pr-12 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                                            Stück
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Optional Reference / Belegnummer */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Referenz / Belegnummer <span className="text-slate-500 text-[10px]">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={intakeReference}
                                    onChange={(e) => setIntakeReference(e.target.value)}
                                    placeholder="z. B. LIEF-2026-001 oder Ersteinlagerung"
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 8. Collapsible Advanced Section */}
                    <div className="pt-2 border-t border-slate-800/80">
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                <Layers size={14} />
                                <span>Weitere Angaben (Gerätefamilie & Kompatible Modelle)</span>
                            </div>
                            {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {showAdvanced && (
                            <div className="pt-3 pb-1 space-y-3.5 animate-fadeIn">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {/* Marke */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Marke (Brand)
                                        </label>
                                        <input
                                            type="text"
                                            value={brand}
                                            disabled={isModelContext}
                                            onChange={(e) => setBrand(e.target.value)}
                                            maxLength={80}
                                            className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 ${
                                                isModelContext ? 'opacity-60 cursor-not-allowed' : ''
                                            }`}
                                        />
                                    </div>

                                    {/* Gerätefamilie */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Gerätefamilie (Device Family)
                                        </label>
                                        <input
                                            type="text"
                                            value={deviceFamily}
                                            onChange={(e) => setDeviceFamily(e.target.value)}
                                            maxLength={80}
                                            placeholder="z.B. iPhone 14 Series"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Kompatible Modelle */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Kompatible Modelle (Kommagetrennt)
                                    </label>
                                    <input
                                        type="text"
                                        value={compatibleDevicesText}
                                        disabled={isModelContext}
                                        onChange={(e) => setCompatibleDevicesText(e.target.value)}
                                        placeholder="z.B. iPhone 14 Plus"
                                        className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 ${
                                            isModelContext ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    />
                                    {isModelContext && (
                                        <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
                                            <Lock size={10} />
                                            <span>Im Modellkontext fest an „{exactContextModel}“ gebunden.</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-center"
                    >
                        Schließen
                    </button>

                    <div className="flex items-center gap-2.5 flex-col sm:flex-row">
                        {/* Save and Continue Button */}
                        <button
                            type="button"
                            onClick={() => handleExecuteSave(true)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700/80 disabled:opacity-50"
                        >
                            <PlusCircle size={15} />
                            <span>Speichern & weiteres Teil anlegen</span>
                        </button>

                        {/* Primary Submit Button */}
                        <button
                            type="button"
                            onClick={() => handleExecuteSave(false)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>
                                        {submittingStep === 'part'
                                            ? 'Ersatzteil wird angelegt …'
                                            : submittingStep === 'movement'
                                            ? 'Wareneingang wird gebucht …'
                                            : 'Wird gespeichert …'}
                                    </span>
                                </>
                            ) : isIntakeRequested ? (
                                <>
                                    <Boxes size={15} />
                                    <span>Anlegen & Wareneingang buchen</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Ersatzteil anlegen</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
