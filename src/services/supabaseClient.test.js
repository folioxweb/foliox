import { describe, it, expect, vi } from 'vitest';
import { supabaseApi } from './supabaseClient.js';

describe('Supabase Client API', () => {
  it('should export all required portfolio methods', () => {
    expect(typeof supabaseApi.getDashboard).toBe('function');
    expect(typeof supabaseApi.getPortfolio).toBe('function');
    expect(typeof supabaseApi.getOverallInvestments).toBe('function');
    expect(typeof supabaseApi.getAssetAllocation).toBe('function');
    expect(typeof supabaseApi.getOverallSectorAllocation).toBe('function');
    expect(typeof supabaseApi.getStocksAllocation).toBe('function');
    expect(typeof supabaseApi.getStocks).toBe('function');
    expect(typeof supabaseApi.getEtfs).toBe('function');
    expect(typeof supabaseApi.getMutualFunds).toBe('function');
    expect(typeof supabaseApi.getFDs).toBe('function');
  });

  it('should export all required news & documents methods', () => {
    expect(typeof supabaseApi.getNews).toBe('function');
    expect(typeof supabaseApi.getStockNews).toBe('function');
    expect(typeof supabaseApi.getCompanyDocuments).toBe('function');
    expect(typeof supabaseApi.summarizeDocument).toBe('function');
  });

  it('should export all required trade & mutation methods', () => {
    expect(typeof supabaseApi.buyMore).toBe('function');
    expect(typeof supabaseApi.updateHolding).toBe('function');
    expect(typeof supabaseApi.sellHolding).toBe('function');
    expect(typeof supabaseApi.addHolding).toBe('function');
    expect(typeof supabaseApi.updateFD).toBe('function');
    expect(typeof supabaseApi.deleteFD).toBe('function');
  });

  it('should export all required IPO methods', () => {
    expect(typeof supabaseApi.getIpos).toBe('function');
    expect(typeof supabaseApi.getIpoById).toBe('function');
  });
});

