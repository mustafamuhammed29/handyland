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
