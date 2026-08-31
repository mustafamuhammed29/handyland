/**
 * backend/admin/src/components/WarehouseManager/utils/catalogHelpers.ts
 * Pure frontend helpers for catalog grouping, sorting, filtering, and German localization.
 */

import type { WarehousePart } from '../types';

export interface BrandSummary {
    brand: string;
    modelCount: number;
    partCount: number;
    totalAvailable: number;
    totalOnHand: number;
    lowStockCount: number;
    outOfStockCount: number;
}

export interface ModelSummary {
    brand: string;
    modelName: string;
    deviceFamily: string;
    partCount: number;
    totalAvailable: number;
    totalOnHand: number;
    lowStockCount: number;
    outOfStockCount: number;
    stockStatus: 'available' | 'low' | 'out_of_stock';
}

/**
 * German category mapping dictionary
 */
export const CATEGORY_LABELS_DE: Record<string, string> = {
    screen: 'Display',
    screens: 'Display',
    battery: 'Akku',
    batteries: 'Akku',
    back_glass: 'Rückglas & Gehäuse',
    'back glass & housing': 'Rückglas & Gehäuse',
    camera: 'Kamera',
    cameras: 'Kamera',
    charging_port: 'Ladeanschluss',
    'charging ports': 'Ladeanschluss',
    speaker: 'Lautsprecher & Audio',
    'audio & speakers': 'Lautsprecher & Audio',
    flex_cable: 'Flexkabel & Tasten',
    'flex cables & buttons': 'Flexkabel & Tasten',
    consumable: 'Verbrauchsmaterial & Kleber',
    'consumables & adhesives': 'Verbrauchsmaterial & Kleber'
};

/**
 * Normalize category to German label
 */
export function getCategoryLabelDE(part: WarehousePart): string {
    const rawType = (part.partType || '').trim().toLowerCase();
    const rawCat = (part.category || '').trim().toLowerCase();

    if (CATEGORY_LABELS_DE[rawType]) return CATEGORY_LABELS_DE[rawType];
    if (CATEGORY_LABELS_DE[rawCat]) return CATEGORY_LABELS_DE[rawCat];

    if (rawType.includes('screen') || rawType.includes('disp')) return 'Display';
    if (rawType.includes('bat')) return 'Akku';
    if (rawType.includes('glass') || rawType.includes('back')) return 'Rückglas & Gehäuse';
    if (rawType.includes('cam')) return 'Kamera';
    if (rawType.includes('chg') || rawType.includes('charge')) return 'Ladeanschluss';
    if (rawType.includes('spk') || rawType.includes('speak') || rawType.includes('audio')) return 'Lautsprecher & Audio';
    if (rawType.includes('flex') || rawType.includes('pwr') || rawType.includes('btn')) return 'Flexkabel & Tasten';
    if (rawType.includes('adh') || rawType.includes('seal') || rawType.includes('screw')) return 'Verbrauchsmaterial & Kleber';

    return part.partType || part.category || 'Sonstiges';
}

/**
 * Normalize quality to German label
 */
export function getQualityLabelDE(quality: string | null): string {
    if (!quality) return 'Standard';
    const q = quality.toLowerCase();
    if (q.includes('oem') || q.includes('original') || q.includes('pulled') || q.includes('service pack')) {
        return 'Original / OEM';
    }
    if (q.includes('compatible') || q.includes('incell') || q.includes('hard oled') || q.includes('copy') || q.includes('aftermarket')) {
        return 'Kompatibel';
    }
    if (q.includes('refurb')) {
        return 'Refurbished';
    }
    return quality;
}

/**
 * Extract primary model name from part
 */
export function getModelName(part: WarehousePart): string {
    if (part.compatibleDevices && part.compatibleDevices.length > 0 && part.compatibleDevices[0].trim()) {
        return part.compatibleDevices[0].trim();
    }
    if (part.deviceFamily && part.deviceFamily.trim()) {
        return part.deviceFamily.trim();
    }
    return 'Unbekanntes Modell';
}

/**
 * Extract brand name from part
 */
export function getBrandName(part: WarehousePart): string {
    if (part.brand && part.brand.trim()) {
        return part.brand.trim();
    }
    // Fallback detection
    const model = getModelName(part);
    if (model.toLowerCase().startsWith('iphone') || model.toLowerCase().startsWith('ipad')) {
        return 'Apple';
    }
    if (model.toLowerCase().startsWith('galaxy') || model.toLowerCase().startsWith('samsung')) {
        return 'Samsung';
    }
    return 'Andere';
}

/**
 * Group parts by Brand
 */
export function groupPartsByBrand(parts: WarehousePart[]): BrandSummary[] {
    const brandMap = new Map<string, {
        models: Set<string>;
        partCount: number;
        totalAvailable: number;
        totalOnHand: number;
        lowStockCount: number;
        outOfStockCount: number;
    }>();

    for (const part of parts) {
        const brand = getBrandName(part);
        const model = getModelName(part);

        if (!brandMap.has(brand)) {
            brandMap.set(brand, {
                models: new Set(),
                partCount: 0,
                totalAvailable: 0,
                totalOnHand: 0,
                lowStockCount: 0,
                outOfStockCount: 0
            });
        }

        const entry = brandMap.get(brand)!;
        entry.models.add(model);
        entry.partCount++;
        entry.totalAvailable += part.availableQuantity || 0;
        entry.totalOnHand += part.onHandQuantity || 0;

        if (part.availableQuantity <= 0) {
            entry.outOfStockCount++;
        } else if (part.availableQuantity <= part.minStock) {
            entry.lowStockCount++;
        }
    }

    const summaries: BrandSummary[] = [];
    for (const [brand, data] of brandMap.entries()) {
        summaries.push({
            brand,
            modelCount: data.models.size,
            partCount: data.partCount,
            totalAvailable: data.totalAvailable,
            totalOnHand: data.totalOnHand,
            lowStockCount: data.lowStockCount,
            outOfStockCount: data.outOfStockCount
        });
    }

    // Sort: Apple first, then alphabetical
    return summaries.sort((a, b) => {
        if (a.brand === 'Apple') return -1;
        if (b.brand === 'Apple') return 1;
        return a.brand.localeCompare(b.brand);
    });
}

/**
 * Natural chronological/generational model sorting weight
 */
function getModelSortWeight(modelName: string): number {
    const m = modelName.toLowerCase();
    const match = m.match(/iphone\s*(\d+)/i);
    let num = 0;
    if (match) {
        num = parseInt(match[1], 10) * 100;
    } else if (m.includes('iphone x')) {
        num = 1000;
    } else if (m.includes('iphone se')) {
        num = 650;
    }

    if (m.includes('pro max')) num += 40;
    else if (m.includes('pro')) num += 30;
    else if (m.includes('plus') || m.includes('air')) num += 20;
    else if (m.includes('mini')) num += 10;

    return num;
}

/**
 * Group parts by Model for a specific brand
 */
export function groupPartsByModel(parts: WarehousePart[], targetBrand: string): ModelSummary[] {
    const modelMap = new Map<string, {
        brand: string;
        deviceFamily: string;
        partCount: number;
        totalAvailable: number;
        totalOnHand: number;
        lowStockCount: number;
        outOfStockCount: number;
    }>();

    for (const part of parts) {
        const brand = getBrandName(part);
        if (brand.toLowerCase() !== targetBrand.toLowerCase()) continue;

        const model = getModelName(part);
        const family = part.deviceFamily || model;

        if (!modelMap.has(model)) {
            modelMap.set(model, {
                brand,
                deviceFamily: family,
                partCount: 0,
                totalAvailable: 0,
                totalOnHand: 0,
                lowStockCount: 0,
                outOfStockCount: 0
            });
        }

        const entry = modelMap.get(model)!;
        entry.partCount++;
        entry.totalAvailable += part.availableQuantity || 0;
        entry.totalOnHand += part.onHandQuantity || 0;

        if (part.availableQuantity <= 0) {
            entry.outOfStockCount++;
        } else if (part.availableQuantity <= part.minStock) {
            entry.lowStockCount++;
        }
    }

    const summaries: ModelSummary[] = [];
    for (const [modelName, data] of modelMap.entries()) {
        let stockStatus: 'available' | 'low' | 'out_of_stock' = 'available';
        if (data.totalAvailable <= 0) {
            stockStatus = 'out_of_stock';
        } else if (data.lowStockCount > 0) {
            stockStatus = 'low';
        }

        summaries.push({
            brand: data.brand,
            modelName,
            deviceFamily: data.deviceFamily,
            partCount: data.partCount,
            totalAvailable: data.totalAvailable,
            totalOnHand: data.totalOnHand,
            lowStockCount: data.lowStockCount,
            outOfStockCount: data.outOfStockCount,
            stockStatus
        });
    }

    // Sort newest models first (e.g. iPhone 17 Pro Max down to iPhone 5)
    return summaries.sort((a, b) => {
        const weightA = getModelSortWeight(a.modelName);
        const weightB = getModelSortWeight(b.modelName);
        if (weightA !== weightB) {
            return weightB - weightA;
        }
        return a.modelName.localeCompare(b.modelName);
    });
}
