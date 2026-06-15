/**
 * Mock Market Pricing API
 * For Phase 1, we generate a baseline retail price based on make, model, year.
 * This can be replaced with a real API like Marketcheck later.
 */
export async function fetchBaselineMarketPrice(year: number, make: string, model: string): Promise<number> {
  // Simple mock logic: base value decreases linearly with age
  const baseValue = 35000; // Baseline for a typical new car
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - (year || currentYear));
  
  // Depreciation roughly 10% per year for mock purposes
  const depreciationFactor = Math.pow(0.9, age);
  
  let estimatedValue = baseValue * depreciationFactor;

  // Add some mock variations based on make
  const makeLower = make?.toLowerCase() || '';
  if (makeLower === 'toyota' || makeLower === 'honda') {
    estimatedValue *= 1.2; // Holds value better
  } else if (makeLower === 'bmw' || makeLower === 'mercedes-benz') {
    estimatedValue *= 0.8; // Steeper depreciation
  }

  // Add some randomness so it's not identical every time
  const randomModifier = 0.95 + (Math.random() * 0.1); // +/- 5%
  
  return Math.round((estimatedValue * randomModifier) / 100) * 100; // Round to nearest 100
}
