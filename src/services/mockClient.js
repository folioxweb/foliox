/**
 * Mock API Client
 * 
 * Returns mock data with artificial 300ms delay to simulate network latency.
 * Logs console warnings on every call to indicate mock data is being used.
 */

import stocksData from './mockData/stocks.json';
import etfsData from './mockData/etfs.json';
import mutualfundsData from './mockData/mutualfunds.json';

const MOCK_DELAY_MS = 300;

async function mockFetch(endpoint, data) {
  console.warn(`[MOCK DATA] Using mock data for endpoint: ${endpoint}`);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
  return data;
}

export const mockApi = {
  getOverallInvestments: () => mockFetch('overallInvestments', [
    { assetClass: "Stocks", invested: 144764, current: 138306.34, profit: -6457.66, returnPercentage: -4.46, weightage: 29 },
    { assetClass: "Mutual Funds", invested: 262194.89, current: 286684.56, profit: 24489.67, returnPercentage: 9.34, weightage: 52.53 },
    { assetClass: "ETFs", invested: 92142.28, current: 99020.07, profit: 6877.79, returnPercentage: 7.46, weightage: 18.46 },
    { assetClass: "Total", invested: 499101.17, current: 524010.97, profit: 24909.8, returnPercentage: 4.99, weightage: 100 }
  ]),
  getAssetAllocation: () => mockFetch('assetAllocation', [
    { asset: "Equity", allocation: 491973.33 },
    { asset: "Cash/Debt", allocation: 32037.64 },
    { asset: "Total", allocation: 524010.97 }
  ]),
  getOverallSectorAllocation: () => mockFetch('overallSectorAllocation', [
    { sector: "Financial Services", exposure: 105727.44, allocation: 21.49 },
    { sector: "Technology", exposure: 80101.49, allocation: 16.28 },
    { sector: "Energy", exposure: 40026.81, allocation: 8.14 }
  ]),
  getStocksAllocation: () => mockFetch('stocksAllocation', [
    { name: "HDFC Bank", exposure: 38767.17, allocation: 7.27 },
    { name: "Reliance Industries", exposure: 29135.18, allocation: 5.47 },
    { name: "TCS", exposure: 27122.41, allocation: 5.09 }
  ]),
  getStocks: async () => {
    const data = await mockFetch('stocks', stocksData);
    return data.map(item => ({
      ...item,
      dayChange: (item.quantity * 0.15) * (item.name.length % 2 === 0 ? 1 : -1),
      dayChangePercent: (item.name.length % 2 === 0 ? 0.75 : -0.35),
    }));
  },
  getEtfs: async () => {
    const data = await mockFetch('etfs', etfsData);
    return data.map(item => ({
      ...item,
      dayChange: (item.quantity * 0.08) * (item.name.length % 2 === 0 ? 1 : -1),
      dayChangePercent: (item.name.length % 2 === 0 ? 0.54 : -0.19),
    }));
  },
  getMutualFunds: async () => {
    const data = await mockFetch('mutualFunds', mutualfundsData);
    return data.map(item => ({
      ...item,
      dayChange: (item.quantity * 0.12) * (item.name.length % 2 === 0 ? 1 : -1),
      dayChangePercent: (item.name.length % 2 === 0 ? 0.88 : -0.42),
    }));
  },
};
