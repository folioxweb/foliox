import { describe, it, expect } from 'vitest';
import {
  getFinancialYear,
  getFinancialYearBounds,
  calculateTaxAndCapitalGains,
  LTCG_EXEMPTION_LIMIT,
  STCG_TAX_RATE,
  LTCG_TAX_RATE,
} from './taxCalculator';

describe('taxCalculator Indian Financial Year and Capital Gains Engine', () => {
  it('correctly maps dates to Indian Financial Years (April 1 - March 31)', () => {
    expect(getFinancialYear('2026-04-01')).toBe('FY 2026-27');
    expect(getFinancialYear('2026-09-11')).toBe('FY 2026-27');
    expect(getFinancialYear('2026-12-31')).toBe('FY 2026-27');
    expect(getFinancialYear('2027-01-15')).toBe('FY 2026-27');
    expect(getFinancialYear('2027-03-31')).toBe('FY 2026-27');
    expect(getFinancialYear('2027-04-01')).toBe('FY 2027-28');
    expect(getFinancialYear('2025-05-10')).toBe('FY 2025-26');
    expect(getFinancialYear('2025-02-28')).toBe('FY 2024-25');
  });

  it('correctly returns Financial Year bounds', () => {
    const { startDate, endDate } = getFinancialYearBounds('FY 2026-27');
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(3); // April
    expect(startDate.getDate()).toBe(1);

    expect(endDate.getFullYear()).toBe(2027);
    expect(endDate.getMonth()).toBe(2); // March
    expect(endDate.getDate()).toBe(31);
  });

  it('calculates STCG @ 20% for trades held <= 365 days', () => {
    // Buy 10 units at ₹2,000 on 2026-05-01
    // Sell 10 units at ₹3,000 on 2026-08-01 (92 days holding -> STCG)
    const transactions = [
      {
        tx_id: '1',
        asset_id: 'tcs',
        symbol: 'TCS',
        tx_type: 'BUY',
        quantity: 10,
        price: 2000,
        tx_date: '2026-05-01T10:00:00Z',
      },
      {
        tx_id: '2',
        asset_id: 'tcs',
        symbol: 'TCS',
        tx_type: 'SELL',
        quantity: -10,
        price: 3000,
        tx_date: '2026-08-01T10:00:00Z',
      },
    ];

    const res = calculateTaxAndCapitalGains({
      transactions,
      selectedFy: 'FY 2026-27',
      asOfDate: new Date('2026-09-11'),
    });

    expect(res.realizedTrades.length).toBe(1);
    const trade = res.realizedTrades[0];
    expect(trade.isLTCG).toBe(false);
    expect(trade.taxCategory).toBe('STCG');
    expect(trade.holdingDays).toBe(92);
    expect(trade.gain).toBe(10000); // 10 * (3000 - 2000)

    // STCG Tax = 10,000 * 20% = 2,000
    expect(res.summary.netSTCG).toBe(10000);
    expect(res.summary.stcgTax).toBe(2000);
    expect(res.summary.netLTCG).toBe(0);
    expect(res.summary.ltcgTax).toBe(0);
    expect(res.summary.totalEstimatedTax).toBe(2000);
  });

  it('calculates LTCG @ 12.5% with ₹1,25,000 exemption for trades held > 365 days', () => {
    // Buy 100 units at ₹1,000 on 2025-01-10
    // Sell 100 units at ₹3,000 on 2026-06-15 (521 days holding -> LTCG)
    // Gain = 100 * 2,000 = ₹2,00,000
    // Exemption = ₹1,25,000
    // Taxable LTCG = ₹75,000
    // LTCG Tax @ 12.5% = 75,000 * 0.125 = ₹9,375
    const transactions = [
      {
        tx_id: 'b1',
        asset_id: 'infy',
        symbol: 'INFY',
        tx_type: 'BUY',
        quantity: 100,
        price: 1000,
        tx_date: '2025-01-10T10:00:00Z',
      },
      {
        tx_id: 's1',
        asset_id: 'infy',
        symbol: 'INFY',
        tx_type: 'SELL',
        quantity: -100,
        price: 3000,
        tx_date: '2026-06-15T10:00:00Z',
      },
    ];

    const res = calculateTaxAndCapitalGains({
      transactions,
      selectedFy: 'FY 2026-27',
      asOfDate: new Date('2026-09-11'),
    });

    expect(res.realizedTrades.length).toBe(1);
    const trade = res.realizedTrades[0];
    expect(trade.isLTCG).toBe(true);
    expect(trade.taxCategory).toBe('LTCG');
    expect(trade.gain).toBe(200000);

    expect(res.summary.netLTCG).toBe(200000);
    expect(res.summary.ltcgExemptionUtilized).toBe(125000);
    expect(res.summary.taxableLTCG).toBe(75000);
    expect(res.summary.ltcgTax).toBe(9375);
    expect(res.summary.totalEstimatedTax).toBe(9375);
    expect(res.summary.ltcgExemptionRemaining).toBe(0);
  });

  it('correctly matches multiple buy lots using FIFO on partial sells', () => {
    // Lot 1: Buy 10 units @ ₹100 on 2025-01-01 (> 365 days)
    // Lot 2: Buy 20 units @ ₹150 on 2026-05-01 (<= 365 days)
    // Sell 15 units @ ₹200 on 2026-07-01:
    //   - 10 units matched with Lot 1: LTCG (Gain: 10 * 100 = 1,000)
    //   - 5 units matched with Lot 2: STCG (Gain: 5 * 50 = 250)
    // Remaining in Lot 2: 15 units @ ₹150 (Unrealized)
    const transactions = [
      {
        tx_id: 'b1',
        asset_id: 'rel',
        symbol: 'RELIANCE',
        tx_type: 'BUY',
        quantity: 10,
        price: 100,
        tx_date: '2025-01-01T09:15:00Z',
      },
      {
        tx_id: 'b2',
        asset_id: 'rel',
        symbol: 'RELIANCE',
        tx_type: 'BUY',
        quantity: 20,
        price: 150,
        tx_date: '2026-05-01T09:15:00Z',
      },
      {
        tx_id: 's1',
        asset_id: 'rel',
        symbol: 'RELIANCE',
        tx_type: 'SELL',
        quantity: -15,
        price: 200,
        tx_date: '2026-07-01T15:30:00Z',
      },
    ];

    const res = calculateTaxAndCapitalGains({
      transactions,
      selectedFy: 'FY 2026-27',
      livePrices: { rel: 250 },
      asOfDate: new Date('2026-09-11'),
    });

    expect(res.realizedTrades.length).toBe(2);

    const ltcgItem = res.realizedTrades.find((t) => t.isLTCG);
    const stcgItem = res.realizedTrades.find((t) => !t.isLTCG);

    expect(ltcgItem).toBeDefined();
    expect(ltcgItem.quantity).toBe(10);
    expect(ltcgItem.gain).toBe(1000);

    expect(stcgItem).toBeDefined();
    expect(stcgItem.quantity).toBe(5);
    expect(stcgItem.gain).toBe(250);

    // Unrealized remaining: 15 units of Lot 2
    expect(res.unrealizedLots.length).toBe(1);
    expect(res.unrealizedLots[0].quantity).toBe(15);
    expect(res.unrealizedLots[0].buyPrice).toBe(150);
    expect(res.unrealizedLots[0].isLTCG).toBe(false);
    expect(res.unrealizedLots[0].unrealizedGain).toBe(15 * (250 - 150)); // 1500
  });

  it('handles losses and calculates net capital gains', () => {
    // STCG Trade 1: +₹5,000 gain
    // STCG Trade 2: -₹2,000 loss
    // Net STCG = +₹3,000 -> Tax @ 20% = ₹600
    const transactions = [
      {
        tx_id: 'b1',
        asset_id: 'a1',
        symbol: 'STOCK1',
        tx_type: 'BUY',
        quantity: 10,
        price: 100,
        tx_date: '2026-05-01T10:00:00Z',
      },
      {
        tx_id: 's1',
        asset_id: 'a1',
        symbol: 'STOCK1',
        tx_type: 'SELL',
        quantity: -10,
        price: 600, // Gain = 5000
        tx_date: '2026-06-01T10:00:00Z',
      },
      {
        tx_id: 'b2',
        asset_id: 'a2',
        symbol: 'STOCK2',
        tx_type: 'BUY',
        quantity: 10,
        price: 500,
        tx_date: '2026-05-10T10:00:00Z',
      },
      {
        tx_id: 's2',
        asset_id: 'a2',
        symbol: 'STOCK2',
        tx_type: 'SELL',
        quantity: -10,
        price: 300, // Loss = -2000
        tx_date: '2026-06-10T10:00:00Z',
      },
    ];

    const res = calculateTaxAndCapitalGains({
      transactions,
      selectedFy: 'FY 2026-27',
      asOfDate: new Date('2026-09-11'),
    });

    expect(res.summary.stcgGains).toBe(5000);
    expect(res.summary.stcgLosses).toBe(-2000);
    expect(res.summary.netSTCG).toBe(3000);
    expect(res.summary.stcgTax).toBe(600);
  });
});
