/**
 * taxCalculator.js
 * Indian Capital Gains (STCG & LTCG) Tax Calculation Engine
 * 
 * Rules applied (Finance Act Post-July 2024 Amendments):
 * 1. Financial Year (FY): April 1 to March 31.
 * 2. Holding Period Threshold for Listed Equities & Equity Mutual Funds:
 *    - Short Term: <= 365 days (12 months)
 *    - Long Term:  > 365 days
 * 3. Tax Rates:
 *    - STCG: 20% flat
 *    - LTCG: 12.5% flat on aggregate gains exceeding ₹1,25,000 exempt threshold per FY
 * 4. Cost Basis: First-In, First-Out (FIFO) matching of SELL lots against earliest BUY lots.
 */

export const LTCG_EXEMPTION_LIMIT = 125000; // ₹1.25 Lakh per financial year
export const STCG_TAX_RATE = 0.20;          // 20%
export const LTCG_TAX_RATE = 0.125;         // 12.5%

/**
 * Returns the Indian Financial Year string for a given date.
 * E.g., for 2026-09-11 -> "FY 2026-27"
 *       for 2027-02-15 -> "FY 2026-27"
 */
export function getFinancialYear(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return getFinancialYear(new Date());
  
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 3 = April
  
  if (month >= 3) {
    // April (3) to December (11)
    const nextYear = String(year + 1).slice(-2);
    return `FY ${year}-${nextYear}`;
  } else {
    // January (0) to March (2)
    const curYear = String(year).slice(-2);
    return `FY ${year - 1}-${curYear}`;
  }
}

/**
 * Returns start and end timestamps for a given FY string (e.g. "FY 2026-27").
 */
export function getFinancialYearBounds(fyString) {
  const match = fyString?.match(/FY\s*(\d{4})-(\d{2})/i);
  let startYear;
  if (match) {
    startYear = parseInt(match[1], 10);
  } else {
    const now = new Date();
    startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  }

  const startDate = new Date(startYear, 3, 1, 0, 0, 0, 0); // 1st April
  const endDate = new Date(startYear + 1, 2, 31, 23, 59, 59, 999); // 31st March
  return { startDate, endDate };
}

/**
 * Extracts all unique Financial Years present in a transaction array,
 * always including the current Financial Year.
 */
export function getAvailableFinancialYears(transactions = []) {
  const currentFy = getFinancialYear(new Date());
  const fySet = new Set([currentFy]);

  for (const tx of transactions) {
    if (tx.tx_date) {
      fySet.add(getFinancialYear(tx.tx_date));
    }
  }

  // Sort descending: e.g. FY 2026-27, FY 2025-26, FY 2024-25
  return Array.from(fySet).sort((a, b) => b.localeCompare(a));
}

/**
 * Computes FIFO Capital Gains for all transactions and categorizes into:
 * - Realized STCG and LTCG for the target financial year
 * - Unrealized open lots with countdown to LTCG eligibility
 * - Tax Harvesting recommendations
 */
export function calculateTaxAndCapitalGains({
  transactions = [],
  livePrices = {},
  selectedFy = null,
  asOfDate = new Date(),
}) {
  const targetFy = selectedFy || getFinancialYear(asOfDate);
  const { startDate: fyStart, endDate: fyEnd } = getFinancialYearBounds(targetFy);

  // Filter out FD transactions from equity capital gains (FDs are taxed as interest income)
  const equityTxs = transactions.filter((tx) => {
    const type = (tx.asset_type || '').toUpperCase();
    return type !== 'FD';
  });

  // Sort chronologically ascending for FIFO order matching
  const sortedTxs = [...equityTxs].sort((a, b) => {
    const timeA = new Date(a.tx_date || 0).getTime();
    const timeB = new Date(b.tx_date || 0).getTime();
    return timeA - timeB;
  });

  // Map of asset_id -> array of unliquidated buy lots
  const activeLotsByAsset = {};
  const realizedTrades = [];

  for (const tx of sortedTxs) {
    const assetId = tx.asset_id || tx.symbol || 'UNKNOWN';
    const txType = (tx.tx_type || 'BUY').toUpperCase();
    const txDate = new Date(tx.tx_date || asOfDate);
    const price = Number(tx.price || tx.cost_price || 0);
    const quantity = Math.abs(Number(tx.quantity || 0));

    if (!activeLotsByAsset[assetId]) {
      activeLotsByAsset[assetId] = [];
    }

    if (txType === 'BUY') {
      if (quantity > 0) {
        activeLotsByAsset[assetId].push({
          tx_id: tx.tx_id,
          asset_id: assetId,
          symbol: tx.symbol || '',
          name: tx.name || tx.symbol || '',
          asset_type: tx.asset_type || 'STOCK',
          sector: tx.sector || '',
          buyDate: txDate,
          buyPrice: price,
          originalQty: quantity,
          remainingQty: quantity,
        });
      }
    } else if (txType === 'SELL') {
      let unfulfilledSellQty = quantity;
      const lots = activeLotsByAsset[assetId];

      while (unfulfilledSellQty > 0 && lots.length > 0) {
        const earliestLot = lots[0];
        const matchQty = Math.min(unfulfilledSellQty, earliestLot.remainingQty);

        // Holding period in calendar days
        const diffMs = txDate.getTime() - earliestLot.buyDate.getTime();
        const holdingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const isLTCG = holdingDays > 365;

        const costBasis = matchQty * earliestLot.buyPrice;
        const sellProceeds = matchQty * price;
        const gain = sellProceeds - costBasis;

        const realizedItem = {
          sellTxId: tx.tx_id,
          buyTxId: earliestLot.tx_id,
          asset_id: assetId,
          symbol: tx.symbol || earliestLot.symbol,
          name: tx.name || earliestLot.name,
          asset_type: tx.asset_type || earliestLot.asset_type,
          sector: tx.sector || earliestLot.sector,
          buyDate: earliestLot.buyDate,
          sellDate: txDate,
          holdingDays,
          isLTCG,
          taxCategory: isLTCG ? 'LTCG' : 'STCG',
          quantity: matchQty,
          buyPrice: earliestLot.buyPrice,
          sellPrice: price,
          costBasis,
          sellProceeds,
          gain,
          financialYear: getFinancialYear(txDate),
        };

        realizedTrades.push(realizedItem);

        earliestLot.remainingQty -= matchQty;
        unfulfilledSellQty -= matchQty;

        if (earliestLot.remainingQty <= 0.000001) {
          lots.shift();
        }
      }
    }
  }

  // Filter realized trades for the target FY
  const targetFyTrades = realizedTrades.filter((item) => item.financialYear === targetFy);

  // Compute Realized STCG and LTCG
  let stcgGains = 0;
  let stcgLosses = 0;
  let ltcgGains = 0;
  let ltcgLosses = 0;

  for (const trade of targetFyTrades) {
    if (trade.isLTCG) {
      if (trade.gain >= 0) ltcgGains += trade.gain;
      else ltcgLosses += trade.gain;
    } else {
      if (trade.gain >= 0) stcgGains += trade.gain;
      else stcgLosses += trade.gain;
    }
  }

  // Net calculations (losses offset gains within each basket)
  const netSTCG = stcgGains + stcgLosses; // Note: stcgLosses is negative
  const netLTCG = ltcgGains + ltcgLosses; // Note: ltcgLosses is negative

  // Taxable STCG @ 20%
  const taxableSTCG = Math.max(0, netSTCG);
  const stcgTax = taxableSTCG * STCG_TAX_RATE;

  // Taxable LTCG @ 12.5% after ₹1,25,000 exemption
  const positiveNetLTCG = Math.max(0, netLTCG);
  const ltcgExemptionUtilized = Math.min(positiveNetLTCG, LTCG_EXEMPTION_LIMIT);
  const taxableLTCG = Math.max(0, positiveNetLTCG - LTCG_EXEMPTION_LIMIT);
  const ltcgTax = taxableLTCG * LTCG_TAX_RATE;

  const totalEstimatedTax = stcgTax + ltcgTax;
  const ltcgExemptionRemaining = Math.max(0, LTCG_EXEMPTION_LIMIT - positiveNetLTCG);
  const ltcgExemptionPct = Math.min(100, (positiveNetLTCG / LTCG_EXEMPTION_LIMIT) * 100);

  // Compute Unrealized Lots & Harvesting Opportunities
  const unrealizedLots = [];
  const nowDate = new Date(asOfDate);

  Object.values(activeLotsByAsset).forEach((lots) => {
    for (const lot of lots) {
      if (lot.remainingQty > 0.000001) {
        const curPrice = livePrices[lot.asset_id] !== undefined
          ? Number(livePrices[lot.asset_id])
          : (livePrices[lot.symbol] !== undefined ? Number(livePrices[lot.symbol]) : lot.buyPrice);

        const holdingDays = Math.max(0, Math.floor((nowDate.getTime() - lot.buyDate.getTime()) / (1000 * 60 * 60 * 24)));
        const isLTCG = holdingDays > 365;
        const daysUntilLtcg = isLTCG ? 0 : (365 - holdingDays);

        const costBasis = lot.remainingQty * lot.buyPrice;
        const currentValue = lot.remainingQty * curPrice;
        const unrealizedGain = currentValue - costBasis;
        const returnPct = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;

        unrealizedLots.push({
          asset_id: lot.asset_id,
          symbol: lot.symbol,
          name: lot.name,
          asset_type: lot.asset_type,
          sector: lot.sector,
          buyDate: lot.buyDate,
          buyPrice: lot.buyPrice,
          currentPrice: curPrice,
          quantity: lot.remainingQty,
          costBasis,
          currentValue,
          unrealizedGain,
          returnPct,
          holdingDays,
          isLTCG,
          daysUntilLtcg,
          taxCategory: isLTCG ? 'LTCG' : 'STCG',
        });
      }
    }
  });

  // Sort unrealized lots by highest gain
  unrealizedLots.sort((a, b) => b.unrealizedGain - a.unrealizedGain);

  // Tax Harvesting Insights
  // 1. LTCG transition countdown: STCG lots that will qualify for LTCG in next 60 days
  const upcomingLtcgTransitionLots = unrealizedLots
    .filter((lot) => !lot.isLTCG && lot.daysUntilLtcg > 0 && lot.daysUntilLtcg <= 60 && lot.unrealizedGain > 0)
    .sort((a, b) => a.daysUntilLtcg - b.daysUntilLtcg);

  // 2. Tax-Free Gain Harvesting: If there's remaining LTCG exemption, suggest unharvested LTCG gains
  const ltcgGainHarvestingLots = unrealizedLots
    .filter((lot) => lot.isLTCG && lot.unrealizedGain > 0);

  // 3. Tax Loss Harvesting: Positions with unrealized losses to offset current gains
  const lossHarvestingLots = unrealizedLots
    .filter((lot) => lot.unrealizedGain < 0)
    .sort((a, b) => a.unrealizedGain - b.unrealizedGain);

  return {
    targetFy,
    fyBounds: { fyStart, fyEnd },
    summary: {
      totalEstimatedTax,
      stcgTax,
      ltcgTax,
      stcgGains,
      stcgLosses,
      netSTCG,
      taxableSTCG,
      ltcgGains,
      ltcgLosses,
      netLTCG,
      taxableLTCG,
      ltcgExemptionLimit: LTCG_EXEMPTION_LIMIT,
      ltcgExemptionUtilized,
      ltcgExemptionRemaining,
      ltcgExemptionPct,
      realizedTradesCount: targetFyTrades.length,
      totalRealizedGain: netSTCG + netLTCG,
    },
    realizedTrades: targetFyTrades,
    allRealizedTrades: realizedTrades,
    unrealizedLots,
    harvesting: {
      upcomingLtcgTransitionLots,
      ltcgGainHarvestingLots,
      lossHarvestingLots,
      remainingTaxFreeExemption: ltcgExemptionRemaining,
    },
  };
}
