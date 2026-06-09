/**
 * Removes duplicate brand prefix from product model/name.
 * Example: brand="Xiaomi", model="Xiaomi 14 256GB" → "Xiaomi 14 256GB"
 *          brand="Xiaomi", model="Xiaomi Xiaomi 14 256GB" → "Xiaomi 14 256GB"
 * 
 * This is needed because some seed data double-prepends the brand name.
 */
export const cleanProductName = (model: string, brand?: string): string => {
    if (!model) return '';
    if (!brand) return model;
    
    const brandLower = brand.toLowerCase().trim();
    const modelLower = model.toLowerCase().trim();
    
    // Check if the model starts with duplicated brand: "Xiaomi Xiaomi 14"
    const doubleBrand = `${brandLower} ${brandLower}`;
    if (modelLower.startsWith(doubleBrand)) {
        // Remove the first brand occurrence: "Xiaomi Xiaomi 14" → "Xiaomi 14"
        return brand + model.substring(brand.length + 1 + brand.length);
    }
    
    return model;
};

export const cleanAccessoryName = (name: string): string => {
    if (!name) return '';
    
    // Check if there is a trailing digital ID at the end to use as a reference code
    const match = name.match(/(\d{4,})$/);
    const refCode = match ? match[1].slice(-4) : null;
    
    // Strip trailing digital IDs like " 1778013742728" or "(E2E) 1778013709170"
    const cleaned = name
        .replace(/\s*\(?E2E\)?\s*\d{8,}$/gi, '')
        .replace(/\s*\d{8,}$/g, '')
        .trim();
        
    if (refCode) {
        return `${cleaned} (Ref: ${refCode})`;
    }
    return cleaned;
};

export const stripInternalId = (name: string): string => {
    if (!name) return '';
    return name
        .replace(/\s*\(?E2E\)?\s*\d{8,}$/gi, '')
        .replace(/\s*\d{8,}$/g, '')
        .trim();
};

const conditionLabels: Record<string, string> = {
    sehr_gut: 'Sehr Gut',
    'sehr gut': 'Sehr Gut',
    'Sehr gut': 'Sehr Gut',
    'Sehr Gut': 'Sehr Gut',
    hervorragend: 'Hervorragend',
    'hervorragend': 'Hervorragend',
    'Hervorragend': 'Hervorragend',
    wie_neu: 'Wie Neu',
    'wie neu': 'Wie Neu',
    'Wie neu': 'Wie Neu',
    'Wie Neu': 'Wie Neu',
    gut: 'Gut',
    'gut': 'Gut',
    'Gut': 'Gut',
    akzeptabel: 'Akzeptabel',
    'akzeptabel': 'Akzeptabel',
    'Akzeptabel': 'Akzeptabel',
    neu: 'Neu',
    'Neu': 'Neu',
    new: 'Neu',
    'New': 'Neu',
    SEHR_GUT: 'Sehr Gut',
    HERVORRAGEND: 'Hervorragend',
    WIE_NEU: 'Wie Neu',
    GUT: 'Gut',
    AKZEPTABEL: 'Akzeptabel'
};

export const getConditionLabel = (cond: string): string => {
    if (!cond) return '';
    const trimmed = cond.trim();
    return conditionLabels[trimmed] || trimmed.charAt(0).toUpperCase() + trimmed.slice(1).replace('_', ' ');
};

