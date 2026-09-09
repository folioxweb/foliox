import { describe, it, expect } from 'vitest';

function calculateBiddingCategories(priceNum, lotSize, minInvestment) {
  const lotCost = Number(minInvestment || (priceNum * lotSize) || 0);
  if (lotCost <= 0 || lotSize <= 0) return null;

  const retailMinLots = 1;
  const retailMinShares = lotSize;
  const retailMinAmount = lotCost;
  const retailMaxLots = Math.max(1, Math.floor(200000 / lotCost));
  const retailMaxShares = retailMaxLots * lotSize;
  const retailMaxAmount = retailMaxLots * lotCost;

  // sHNI: application strictly > ₹2,00,000
  const shniMinLots = Math.floor(200000 / lotCost) + 1;
  const shniMinShares = shniMinLots * lotSize;
  const shniMinAmount = shniMinLots * lotCost;
  const shniMaxLots = Math.max(shniMinLots, Math.floor(1000000 / lotCost));
  const shniMaxShares = shniMaxLots * lotSize;
  const shniMaxAmount = shniMaxLots * lotCost;

  // bHNI: application strictly > ₹10,00,000
  const bhniMinLots = Math.floor(1000000 / lotCost) + 1;
  const bhniMinShares = bhniMinLots * lotSize;
  const bhniMinAmount = bhniMinLots * lotCost;

  return {
    lotCost,
    retail: { minLots: retailMinLots, minShares: retailMinShares, minAmount: retailMinAmount, maxLots: retailMaxLots, maxShares: retailMaxShares, maxAmount: retailMaxAmount },
    shni: { minLots: shniMinLots, minShares: shniMinShares, minAmount: shniMinAmount, maxLots: shniMaxLots, maxShares: shniMaxShares, maxAmount: shniMaxAmount },
    bhni: { minLots: bhniMinLots, minShares: bhniMinShares, minAmount: bhniMinAmount },
  };
}

describe('sHNI and bHNI Minimum Lot & Share Calculations', () => {
  it('calculates correctly for typical Mainboard IPO (15 sh @ ₹1,000 = ₹15,000/lot)', () => {
    const res = calculateBiddingCategories(1000, 15, 15000);
    expect(res).not.toBeNull();

    // Retail
    expect(res.retail.minLots).toBe(1);
    expect(res.retail.maxLots).toBe(13); // 13 * 15000 = 1,95,000 (<= 2L)
    expect(res.retail.maxAmount).toBe(195000);

    // sHNI (just above ₹2 Lakhs)
    expect(res.shni.minLots).toBe(14);
    expect(res.shni.minShares).toBe(210);
    expect(res.shni.minAmount).toBe(210000); // 2,10,000 > 2,00,000
    expect(res.shni.minAmount).toBeGreaterThan(200000);
    expect(res.shni.maxLots).toBe(66); // 66 * 15000 = 9,90,000 (<= 10L)

    // bHNI (just above ₹10 Lakhs)
    expect(res.bhni.minLots).toBe(67);
    expect(res.bhni.minShares).toBe(1005);
    expect(res.bhni.minAmount).toBe(1005000); // 10,05,000 > 10,00,000
    expect(res.bhni.minAmount).toBeGreaterThan(1000000);
  });

  it('calculates correctly for Premier Energies style (33 sh @ ₹450 = ₹14,850/lot)', () => {
    const res = calculateBiddingCategories(450, 33, 14850);
    expect(res).not.toBeNull();

    // Retail max
    expect(res.retail.maxLots).toBe(13); // 13 * 14850 = 1,93,050

    // sHNI min
    expect(res.shni.minLots).toBe(14);
    expect(res.shni.minShares).toBe(462);
    expect(res.shni.minAmount).toBe(207900); // just above 2L
    expect(res.shni.minAmount).toBeGreaterThan(200000);

    // bHNI min
    expect(res.bhni.minLots).toBe(68);
    expect(res.bhni.minShares).toBe(2244);
    expect(res.bhni.minAmount).toBe(1009800); // just above 10L
    expect(res.bhni.minAmount).toBeGreaterThan(1000000);
  });

  it('calculates correctly for SME IPO with high lot size (1000 sh @ ₹120 = ₹1,20,000/lot)', () => {
    const res = calculateBiddingCategories(120, 1000, 120000);
    expect(res).not.toBeNull();

    // Retail max: only 1 lot possible under 2L
    expect(res.retail.maxLots).toBe(1);
    expect(res.retail.maxAmount).toBe(120000);

    // sHNI min: 2 lots = 2,40,000 (> 2L)
    expect(res.shni.minLots).toBe(2);
    expect(res.shni.minShares).toBe(2000);
    expect(res.shni.minAmount).toBe(240000);
    expect(res.shni.minAmount).toBeGreaterThan(200000);

    // bHNI min: 9 lots = 10,80,000 (> 10L)
    expect(res.bhni.minLots).toBe(9);
    expect(res.bhni.minShares).toBe(9000);
    expect(res.bhni.minAmount).toBe(1080000);
    expect(res.bhni.minAmount).toBeGreaterThan(1000000);
  });
});
