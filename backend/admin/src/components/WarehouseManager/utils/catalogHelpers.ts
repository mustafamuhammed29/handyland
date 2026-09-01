/**
 * backend/admin/src/components/WarehouseManager/utils/catalogHelpers.ts
 * Pure frontend helpers for catalog grouping, sorting, filtering, name/SKU generation, and German localization.
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
 * Supported Teiletyp options for the Add Part modal
 */
export const TEILETYP_OPTIONS = [
    'Display',
    'Akku',
    'Rückglas',
    'Rückkamera',
    'Frontkamera',
    'Ladebuchse',
    'Lautsprecher',
    'Hörmuschel',
    'Mikrofon',
    'Power-Flex',
    'Lautstärke-Flex',
    'Kleinteile / Verbrauchsmaterial'
] as const;

export type TeiletypOption = typeof TEILETYP_OPTIONS[number];

/**
 * Supported Qualität options
 */
export const QUALITAET_OPTIONS = [
    'Original / OEM',
    'Kompatibel',
    'Refurbished'
] as const;

export type QualitaetOption = typeof QUALITAET_OPTIONS[number];

/**
 * Supported Kategorie options
 */
export const KATEGORIE_OPTIONS = [
    'Display',
    'Akku',
    'Gehäuse / Rückglas',
    'Kamera',
    'Ladeanschluss',
    'Audio & Lautsprecher',
    'Flexkabel & Tasten',
    'Verbrauchsmaterial & Kleber',
    'Sonstiges'
] as const;

export type KategorieOption = typeof KATEGORIE_OPTIONS[number];

/**
 * Derives default Kategorie from selected Teiletyp
 */
export function deriveCategoryFromPartType(partType: string): string {
    const t = partType.trim();
    if (t === 'Display') return 'Display';
    if (t === 'Akku') return 'Akku';
    if (t === 'Rückglas') return 'Gehäuse / Rückglas';
    if (t === 'Rückkamera' || t === 'Frontkamera') return 'Kamera';
    if (t === 'Ladebuchse') return 'Ladeanschluss';
    if (t === 'Lautsprecher' || t === 'Hörmuschel' || t === 'Mikrofon') return 'Audio & Lautsprecher';
    if (t === 'Power-Flex' || t === 'Lautstärke-Flex') return 'Flexkabel & Tasten';
    if (t === 'Kleinteile / Verbrauchsmaterial') return 'Verbrauchsmaterial & Kleber';

    const lower = t.toLowerCase();
    if (lower.includes('display') || lower.includes('screen') || lower.includes('oled')) return 'Display';
    if (lower.includes('akku') || lower.includes('battery') || lower.includes('bat')) return 'Akku';
    if (lower.includes('glas') || lower.includes('housing') || lower.includes('gehäuse') || lower.includes('cover')) return 'Gehäuse / Rückglas';
    if (lower.includes('kam') || lower.includes('cam')) return 'Kamera';
    if (lower.includes('lade') || lower.includes('chg') || lower.includes('port') || lower.includes('dock')) return 'Ladeanschluss';
    if (lower.includes('laut') || lower.includes('spk') || lower.includes('speak') || lower.includes('audio') || lower.includes('hör') || lower.includes('mic')) return 'Audio & Lautsprecher';
    if (lower.includes('flex') || lower.includes('pwr') || lower.includes('taste') || lower.includes('button')) return 'Flexkabel & Tasten';
    if (lower.includes('klein') || lower.includes('kleb') || lower.includes('adh') || lower.includes('dicht')) return 'Verbrauchsmaterial & Kleber';

    return 'Sonstiges';
}

/**
 * German category mapping dictionary
 */
export const CATEGORY_LABELS_DE: Record<string, string> = {
    screen: 'Display',
    screens: 'Display',
    display: 'Display',
    battery: 'Akku',
    batteries: 'Akku',
    akku: 'Akku',
    back_glass: 'Rückglas & Gehäuse',
    'back glass & housing': 'Rückglas & Gehäuse',
    'gehäuse / rückglas': 'Rückglas & Gehäuse',
    camera: 'Kamera',
    cameras: 'Kamera',
    kamera: 'Kamera',
    charging_port: 'Ladeanschluss',
    'charging ports': 'Ladeanschluss',
    ladeanschluss: 'Ladeanschluss',
    speaker: 'Lautsprecher & Audio',
    'audio & speakers': 'Lautsprecher & Audio',
    'audio & lautsprecher': 'Lautsprecher & Audio',
    flex_cable: 'Flexkabel & Tasten',
    'flex cables & buttons': 'Flexkabel & Tasten',
    'flexkabel & tasten': 'Flexkabel & Tasten',
    consumable: 'Verbrauchsmaterial & Kleber',
    'consumables & adhesives': 'Verbrauchsmaterial & Kleber',
    'verbrauchsmaterial & kleber': 'Verbrauchsmaterial & Kleber'
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
    if (rawType.includes('bat') || rawType.includes('akku')) return 'Akku';
    if (rawType.includes('glass') || rawType.includes('back') || rawType.includes('rück') || rawType.includes('gehäuse')) return 'Rückglas & Gehäuse';
    if (rawType.includes('cam') || rawType.includes('kam')) return 'Kamera';
    if (rawType.includes('chg') || rawType.includes('charge') || rawType.includes('lade')) return 'Ladeanschluss';
    if (rawType.includes('spk') || rawType.includes('speak') || rawType.includes('audio') || rawType.includes('laut') || rawType.includes('hör')) return 'Lautsprecher & Audio';
    if (rawType.includes('flex') || rawType.includes('pwr') || rawType.includes('btn') || rawType.includes('taste')) return 'Flexkabel & Tasten';
    if (rawType.includes('adh') || rawType.includes('seal') || rawType.includes('screw') || rawType.includes('klein') || rawType.includes('verbr')) return 'Verbrauchsmaterial & Kleber';

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
    if (q.includes('compatible') || q.includes('kompatibel') || q.includes('incell') || q.includes('hard oled') || q.includes('copy') || q.includes('aftermarket')) {
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

/**
 * Extracts compact uppercase model code for SKU generation
 */
export function getModelSkuCode(modelName: string): string {
    const m = modelName.trim();
    const lower = m.toLowerCase();

    // Specific iPhone mappings
    const iphoneMap: Record<string, string> = {
        'iphone 17 pro max': 'IP17PM',
        'iphone 17 pro': 'IP17P',
        'iphone 17 air': 'IP17AIR',
        'iphone 17 plus': 'IP17PL',
        'iphone 17': 'IP17',
        'iphone 16 pro max': 'IP16PM',
        'iphone 16 pro': 'IP16P',
        'iphone 16 plus': 'IP16PL',
        'iphone 16': 'IP16',
        'iphone 15 pro max': 'IP15PM',
        'iphone 15 pro': 'IP15P',
        'iphone 15 plus': 'IP15PL',
        'iphone 15': 'IP15',
        'iphone 14 pro max': 'IP14PM',
        'iphone 14 pro': 'IP14P',
        'iphone 14 plus': 'IP14PL',
        'iphone 14': 'IP14',
        'iphone 13 pro max': 'IP13PM',
        'iphone 13 pro': 'IP13P',
        'iphone 13 mini': 'IP13M',
        'iphone 13': 'IP13',
        'iphone 12 pro max': 'IP12PM',
        'iphone 12 pro': 'IP12P',
        'iphone 12 mini': 'IP12M',
        'iphone 12': 'IP12',
        'iphone 11 pro max': 'IP11PM',
        'iphone 11 pro': 'IP11P',
        'iphone 11': 'IP11',
        'iphone se (3rd gen)': 'IPSE3',
        'iphone se (2nd gen)': 'IPSE2',
        'iphone se (1st gen)': 'IPSE1',
        'iphone se': 'IPSE',
        'iphone xs max': 'IPXSM',
        'iphone xs': 'IPXS',
        'iphone xr': 'IPXR',
        'iphone x': 'IPX',
        'iphone 8 plus': 'IP8P',
        'iphone 8': 'IP8',
        'iphone 7 plus': 'IP7P',
        'iphone 7': 'IP7',
        'iphone 6s plus': 'IP6SP',
        'iphone 6s': 'IP6S',
        'iphone 6 plus': 'IP6P',
        'iphone 6': 'IP6',
        'iphone 5s': 'IP5S',
        'iphone 5c': 'IP5C',
        'iphone 5': 'IP5'
    };

    if (iphoneMap[lower]) {
        return iphoneMap[lower];
    }

    // Dynamic clean alphanumeric abbreviation
    const clean = m
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 8);

    return clean || 'PART';
}

/**
 * Extracts compact part type code for SKU generation
 */
export function getPartTypeSkuCode(partType: string): string {
    const t = partType.trim().toLowerCase();
    if (t.includes('display') || t.includes('screen')) return 'DIS';
    if (t.includes('akku') || t.includes('battery')) return 'BAT';
    if (t.includes('rückglas') || t.includes('glass') || t.includes('gehäuse')) return 'GLS';
    if (t.includes('rückkamera') || t.includes('rcam')) return 'RCAM';
    if (t.includes('frontkamera') || t.includes('fcam')) return 'FCAM';
    if (t.includes('lade') || t.includes('chg') || t.includes('port')) return 'CHG';
    if (t.includes('lautsprecher') || t.includes('speaker') || t.includes('spk')) return 'SPK';
    if (t.includes('hörmuschel') || t.includes('ear')) return 'EAR';
    if (t.includes('mikrofon') || t.includes('mic')) return 'MIC';
    if (t.includes('power') || t.includes('pwr')) return 'PWR';
    if (t.includes('lautstärke') || t.includes('vol')) return 'VOL';
    if (t.includes('klein') || t.includes('kleb') || t.includes('adh')) return 'ADH';
    return 'PRT';
}

/**
 * Extracts compact quality code for SKU generation
 */
export function getQualitySkuCode(quality: string): string {
    const q = quality.trim().toLowerCase();
    if (q.includes('oem') || q.includes('original')) return 'OEM';
    if (q.includes('kompatibel') || q.includes('compatible') || q.includes('incell') || q.includes('copy')) return 'CMP';
    if (q.includes('refurb')) return 'RFB';
    return 'STD';
}

/**
 * Automatically suggests a standard German part name
 */
export function suggestPartName(modelName: string, partType: string, quality: string): string {
    if (!modelName.trim() && !partType.trim()) return '';

    const model = modelName.trim() || 'Gerät';
    const type = partType.trim() || 'Ersatzteil';

    let qualLabel = '';
    const qLower = quality.trim().toLowerCase();
    if (qLower.includes('oem') || qLower.includes('original')) {
        qualLabel = 'Original';
    } else if (qLower.includes('kompatibel') || qLower.includes('compatible')) {
        qualLabel = 'Kompatibel';
    } else if (qLower.includes('refurb')) {
        qualLabel = 'Refurbished';
    } else if (quality.trim()) {
        qualLabel = quality.trim();
    }

    if (qualLabel) {
        return `${type} ${model} – ${qualLabel}`;
    }
    return `${type} ${model}`;
}

/**
 * Automatically suggests a valid unique-style SKU prefix
 */
export function suggestPartSku(modelName: string, partType: string, quality: string): string {
    const mCode = getModelSkuCode(modelName);
    const tCode = getPartTypeSkuCode(partType);
    const qCode = getQualitySkuCode(quality);

    return `${mCode}-${tCode}-${qCode}`;
}

/**
 * Detects potential in-memory duplicate parts in the current catalog
 */
export function findPotentialDuplicate(
    existingParts: WarehousePart[],
    exactModel: string,
    partType: string,
    quality: string
): WarehousePart | null {
    if (!existingParts || existingParts.length === 0 || !exactModel.trim() || !partType.trim()) {
        return null;
    }

    const targetModelLower = exactModel.trim().toLowerCase();
    const targetTypeCat = deriveCategoryFromPartType(partType).toLowerCase();
    const targetQualNorm = getQualityLabelDE(quality).toLowerCase();

    for (const p of existingParts) {
        // Check exact model match
        const matchesModel = (p.compatibleDevices || []).some(
            d => d.trim().toLowerCase() === targetModelLower
        ) || (p.deviceFamily && p.deviceFamily.trim().toLowerCase() === targetModelLower);

        if (!matchesModel) continue;

        const pCat = getCategoryLabelDE(p).toLowerCase();
        const pType = (p.partType || '').trim().toLowerCase();
        const pQual = getQualityLabelDE(p.quality).toLowerCase();

        const matchesType = pCat === targetTypeCat || pType === partType.trim().toLowerCase();
        const matchesQual = pQual === targetQualNorm || (!quality.trim() && !p.quality);

        if (matchesType && matchesQual) {
            return p;
        }
    }

    return null;
}
