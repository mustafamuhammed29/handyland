import { ValuationRequest } from "../types";

// Helper to get the raw number
export const calculatePriceValue = (
  details: ValuationRequest,
  settings: any,
  basePriceOverride?: number,
  deviceBlueprint?: any
): number => {
  // 1. Base Price
  const dynamicModel = settings?.valuation?.models?.find((m: any) => m.name === details.model);
  let currentPrice = basePriceOverride !== undefined ? basePriceOverride : (dynamicModel?.basePrice || 500);

  // 2. Storage Logic
  const specificStoragePrice = deviceBlueprint?.priceConfig?.storagePrices?.[details.storage];

  if (specificStoragePrice !== undefined) {
    currentPrice += specificStoragePrice;
  } else {
    const storageOpt = settings?.valuation?.storageOptions?.find((s: any) => s.label === details.storage);
    let storageMult = storageOpt?.multiplier || 1.0;

    if (storageMult === 1.0 && details.storage) {
      if (details.storage.includes('256')) storageMult = 1.1;
      if (details.storage.includes('512')) storageMult = 1.25;
      if (details.storage.includes('1TB')) storageMult = 1.4;
    }
    currentPrice = currentPrice * storageMult;
  }

  // 3. Condition Logic
  const defaultModifiers: Record<string, number> = {
    'new': 1.0,
    'like_new': 0.9,
    'good': 0.75,
    'fair': 0.6,
    'broken': 0.3
  };

  const conditionOpt = settings?.valuation?.conditionOptions?.find((c: any) => c.id === details.condition);
  const conditionMult = deviceBlueprint?.priceConfig?.conditionModifiers?.[details.condition]
    || conditionOpt?.multiplier
    || defaultModifiers[details.condition]
    || 0.75;

  currentPrice = currentPrice * conditionMult;

  // 4. Battery Health Logic
  if (details.batteryHealth) {
    const health = details.batteryHealth;
    const penaltyThreshold = deviceBlueprint?.priceConfig?.batteryPenalty?.threshold || 85;
    const deductionPerPercent = deviceBlueprint?.priceConfig?.batteryPenalty?.deductionPerPercent || 5;

    if (health < penaltyThreshold) {
      const basePenalty = 50;
      const extraPenalty = (penaltyThreshold - health) * deductionPerPercent;
      currentPrice -= (basePenalty + extraPenalty);
    }
  } else {
    // Fallback logic
    const batteryOpt = settings?.valuation?.batteryOptions?.find((b: any) => b.id === details.battery);
    const batteryMult = batteryOpt?.multiplier || 1.0;
    currentPrice = currentPrice * batteryMult;
  }

  // 5. Accessories Bonus
  if (details.accessories) {
    currentPrice += 25;
  }

  // Ensure price doesn't go below scrap value
  const scrapValue = basePriceOverride ? basePriceOverride * 0.15 : 50;
  if (currentPrice < scrapValue) currentPrice = scrapValue;

  // 6. Rounding
  return Math.round(currentPrice / 5) * 5;
};

export const calculateManualPrice = (
  details: ValuationRequest,
  settings: any,
  basePriceOverride?: number,
  deviceBlueprint?: any
): string => {
  const finalPrice = calculatePriceValue(details, settings, basePriceOverride, deviceBlueprint);

  // Helper variables for report (re-derived briefly for display string)
  const storageOpt = settings?.valuation?.storageOptions?.find((s: any) => s.label === details.storage);
  const conditionOpt = settings?.valuation?.conditionOptions?.find((c: any) => c.id === details.condition);

  // Create range
  const minRange = Math.max(0, finalPrice - 20);
  const maxRange = finalPrice + 30;

  return `
    Estimated Value:
    **€${minRange} - €${maxRange}**
    
    Analysis:
    - Base Value: €${basePriceOverride || 500}
    - Storage: ${details.storage}
    - Condition: ${conditionOpt?.label || details.condition}
    ${details.batteryHealth ? `- Battery Health: ${details.batteryHealth}%` : ''}
    ${details.accessories ? '- Accessories: +€25' : ''}
  `;
};
