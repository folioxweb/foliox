/**
 * Mock API Client
 * 
 * Returns mock data with artificial delay to simulate network latency.
 * Updates local in-memory arrays so additions/edits persist during the session.
 */

import stocksData from './mockData/stocks.json';
import etfsData from './mockData/etfs.json';
import mutualfundsData from './mockData/mutualfunds.json';
import fdsData from './mockData/fds.json';

// In-memory data store initialized from JSON files
let stocks = [...stocksData];
let etfs = [...etfsData];
let mutualFunds = [...mutualfundsData];
let fds = [...fdsData];

const MOCK_DELAY_MS = 300;

async function mockFetch(endpoint, data) {
  console.warn(`[MOCK DATA] Using mock data for endpoint: ${endpoint}`);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
  return data;
}

const realMockApi = {
  // Authentication
  login: async (password) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    return { token: "mock-session-token-12345" };
  },

  // Read endpoints
  getStocks: () => mockFetch('stocks', stocks.map(item => ({
    ...item,
    dayChange: (item.quantity * 0.15) * (item.name.length % 2 === 0 ? 1 : -1),
    dayChangePercent: (item.name.length % 2 === 0 ? 0.75 : -0.35),
  }))),

  getEtfs: () => mockFetch('etfs', etfs.map(item => ({
    ...item,
    dayChange: (item.quantity * 0.08) * (item.name.length % 2 === 0 ? 1 : -1),
    dayChangePercent: (item.name.length % 2 === 0 ? 0.54 : -0.19),
  }))),

  getMutualFunds: () => mockFetch('mutualFunds', mutualFunds.map(item => ({
    ...item,
    dayChange: (item.quantity * 0.12) * (item.name.length % 2 === 0 ? 1 : -1),
    dayChangePercent: (item.name.length % 2 === 0 ? 0.88 : -0.42),
  }))),

  getFDs: () => mockFetch('fds', fds),

  getOverallInvestments: async () => {
    const s = await realMockApi.getStocks();
    const e = await realMockApi.getEtfs();
    const m = await realMockApi.getMutualFunds();
    const f = await realMockApi.getFDs();

    const sumInvested = (arr, valKey = 'investedValue') => arr.reduce((acc, x) => acc + (x[valKey] ?? x.invested ?? x.principal ?? 0), 0);
    const sumCurrent = (arr, valKey = 'currentValue') => arr.reduce((acc, x) => acc + (x[valKey] ?? x.current ?? 0), 0);

    const sInv = sumInvested(s);
    const sCur = sumCurrent(s);
    const sPnl = sCur - sInv;

    const eInv = sumInvested(e);
    const eCur = sumCurrent(e);
    const ePnl = eCur - eInv;

    const mInv = sumInvested(m);
    const mCur = sumCurrent(m);
    const mPnl = mCur - mInv;

    const fInv = sumInvested(f, 'principal');
    const fCur = sumCurrent(f);
    const fPnl = fCur - fInv;

    const totalInv = sInv + eInv + mInv + fInv;
    const totalCur = sCur + eCur + mCur + fCur;
    const totalPnl = totalCur - totalInv;

    return [
      { assetClass: "Stocks", invested: sInv, current: sCur, profit: sPnl, returnPercentage: sInv > 0 ? (sPnl / sInv) * 100 : 0, weightage: totalCur > 0 ? (sCur / totalCur) * 100 : 0 },
      { assetClass: "Mutual Funds", invested: mInv, current: mCur, profit: mPnl, returnPercentage: mInv > 0 ? (mPnl / mInv) * 100 : 0, weightage: totalCur > 0 ? (mCur / totalCur) * 100 : 0 },
      { assetClass: "ETFs", invested: eInv, current: eCur, profit: ePnl, returnPercentage: eInv > 0 ? (ePnl / eInv) * 100 : 0, weightage: totalCur > 0 ? (eCur / totalCur) * 100 : 0 },
      { assetClass: "Fixed Deposits", invested: fInv, current: fCur, profit: fPnl, returnPercentage: fInv > 0 ? (fPnl / fInv) * 100 : 0, weightage: totalCur > 0 ? (fCur / totalCur) * 100 : 0 },
      { assetClass: "Total", invested: totalInv, current: totalCur, profit: totalPnl, returnPercentage: totalInv > 0 ? (totalPnl / totalInv) * 100 : 0, weightage: 100 }
    ];
  },

  getAssetAllocation: async () => {
    const s = await realMockApi.getStocks();
    const e = await realMockApi.getEtfs();
    const m = await realMockApi.getMutualFunds();
    const f = await realMockApi.getFDs();

    const sumCurrent = (arr) => arr.reduce((acc, x) => acc + (x.currentValue ?? x.current ?? 0), 0);

    const sCur = sumCurrent(s);
    const eCur = sumCurrent(e);
    const mCur = sumCurrent(m);
    const fCur = sumCurrent(f);

    const totalEquity = sCur + eCur + mCur;
    const totalCashDebt = fCur;

    return [
      { asset: "Equity", allocation: totalEquity },
      { asset: "Cash/Debt", allocation: totalCashDebt },
      { asset: "Total", allocation: totalEquity + totalCashDebt }
    ];
  },

  getOverallSectorAllocation: async () => {
    const s = await realMockApi.getStocks();
    const m = await realMockApi.getMutualFunds();
    const all = [...s, ...m];

    const sectorExposure = {};
    let totalExposure = 0;

    all.forEach(x => {
      const sec = x.sector ?? 'Other';
      const cur = x.currentValue ?? 0;
      sectorExposure[sec] = (sectorExposure[sec] ?? 0) + cur;
      totalExposure += cur;
    });

    const result = Object.entries(sectorExposure).map(([sector, exposure]) => ({
      sector,
      exposure,
      allocation: totalExposure > 0 ? (exposure / totalExposure) * 100 : 0
    }));

    return result.sort((a, b) => b.exposure - a.exposure).slice(0, 5);
  },

  getStocksAllocation: async () => {
    const s = await realMockApi.getStocks();
    const totalCur = s.reduce((acc, x) => acc + (x.currentValue ?? 0), 0);

    const result = s.map(x => ({
      name: x.name,
      exposure: x.currentValue,
      allocation: totalCur > 0 ? (x.currentValue / totalCur) * 100 : 0
    }));

    return result.sort((a, b) => b.exposure - a.exposure).slice(0, 5);
  },

  getDashboard: async () => {
    const overallInvestments = await realMockApi.getOverallInvestments();
    const assetAllocation = await realMockApi.getAssetAllocation();
    const overallSectorAllocation = await realMockApi.getOverallSectorAllocation();
    const stocksAllocation = await realMockApi.getStocksAllocation();

    const totalCur = overallInvestments.find(x => x.assetClass === 'Total')?.current ?? 0;
    const totalInv = overallInvestments.find(x => x.assetClass === 'Total')?.invested ?? 0;
    const todayChange = totalCur * 0.0084;
    const todayChangePercent = 0.84;

    return {
      overallInvestments,
      assetAllocation,
      overallSectorAllocation,
      stocksAllocation,
      todayPerformance: {
        todayChange,
        todayChangePercent,
        totalCurrentValue: totalCur,
        totalInvestedValue: totalInv
      }
    };
  },

  getPortfolio: async () => {
    const s = await realMockApi.getStocks();
    const e = await realMockApi.getEtfs();
    const m = await realMockApi.getMutualFunds();
    const f = await realMockApi.getFDs();

    return {
      stocks: s,
      etfs: e,
      mutualFunds: m,
      fds: f
    };
  },

  // Mutation endpoints updating the in-memory arrays
  buyMore: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    if (payload.assetType === "stocks") {
      const idx = stocks.findIndex(x => x.symbol === payload.symbol);
      if (idx !== -1) {
        const h = stocks[idx];
        const newQty = h.quantity + payload.quantity;
        const newCost = (h.quantity * (h.avgPurchasePrice ?? 0)) + (payload.quantity * payload.price);
        h.avgPurchasePrice = newCost / newQty;
        h.quantity = newQty;
        h.investedValue = newCost;
        h.currentValue = newQty * (payload.price * 1.05);
        h.returnValue = h.currentValue - h.investedValue;
        h.returnPct = (h.returnValue / h.investedValue) * 100;
      }
    }
    return { success: true };
  },

  updateHolding: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const target = payload.assetType === "mutualFunds" ? mutualFunds : (payload.assetType === "etfs" ? etfs : stocks);
    const idx = target.findIndex(x => x.symbol === payload.symbol || x.name === payload.name);
    if (idx !== -1) {
      const h = target[idx];
      h.quantity = payload.quantity;
      h.avgPurchasePrice = payload.price;
      h.investedValue = payload.quantity * payload.price;
      h.currentValue = payload.quantity * (payload.price * 1.1);
      h.returnValue = h.currentValue - h.investedValue;
      h.returnPct = (h.returnValue / h.investedValue) * 100;
    }
    return { success: true };
  },

  sellHolding: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const target = payload.assetType === "mutualFunds" ? mutualFunds : (payload.assetType === "etfs" ? etfs : stocks);
    const idx = target.findIndex(x => x.symbol === payload.symbol || x.name === payload.name);
    if (idx !== -1) {
      const h = target[idx];
      if (payload.quantity >= h.quantity) {
        target.splice(idx, 1);
      } else {
        h.quantity -= payload.quantity;
        h.investedValue = h.quantity * (h.avgPurchasePrice ?? 0);
        h.currentValue = h.quantity * (payload.price);
        h.returnValue = h.currentValue - h.investedValue;
        h.returnPct = h.investedValue > 0 ? (h.returnValue / h.investedValue) * 100 : 0;
      }
    }
    return { success: true };
  },

  addHolding: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const newAsset = {
      id: `mock-${payload.assetType}-${Date.now()}`,
      name: payload.name,
      symbol: payload.symbol || payload.name.toUpperCase().replace(/\s+/g, ""),
      category: payload.assetType === "stocks" ? "stock" : (payload.assetType === "etfs" ? "ETF" : "Mutual Fund"),
      quantity: payload.quantity,
      avgPurchasePrice: payload.price,
      investedValue: payload.quantity * payload.price,
      currentValue: payload.quantity * payload.price * 1.02,
      returnValue: (payload.quantity * payload.price * 0.02),
      returnPct: 2.0,
      portfolioWeight: 2.0,
      confidenceLevel: payload.confidence || "High",
      sector: payload.sector || "Other"
    };

    if (payload.assetType === "mutualFunds") {
      mutualFunds.push(newAsset);
    } else if (payload.assetType === "etfs") {
      etfs.push(newAsset);
    } else {
      stocks.push(newAsset);
    }
    return { success: true };
  },

  updateFD: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const idx = fds.findIndex(x => x.srNo === payload.srNo);
    if (idx !== -1) {
      const f = fds[idx];
      f.name = payload.bankName;
      f.principal = payload.principal;
      f.interestRate = payload.interestRate;
      f.startDate = payload.startDate;
      f.maturityDate = payload.maturityDate;
      f.currentValue = payload.principal * 1.05;
      f.interestEarned = f.currentValue - payload.principal;
      f.maturityValue = payload.principal * (1 + (payload.interestRate / 100) * 2);
    }
    return { success: true };
  },

  deleteFD: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    fds = fds.filter(x => x.srNo !== payload.srNo);
    return { success: true };
  }
};

export const mockApi = realMockApi;
