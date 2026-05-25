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
    // Strip trailing digital IDs like " 1778013742728" or "(E2E) 1778013709170"
    return name
        .replace(/\s*\(?E2E\)?\s*\d{8,}$/gi, '')
        .replace(/\s*\d{8,}$/g, '')
        .trim();
};

const conditionLabels: Record<string, string> = {
    sehr_gut: 'Sehr Gut',
    hervorragend: 'Hervorragend',
    wie_neu: 'Wie Neu',
    gut: 'Gut',
    akzeptabel: 'Akzeptabel',
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
