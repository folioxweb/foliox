/**
 * Supabase API Client
 * Connects directly to Supabase PostgREST & Edge Functions
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to fetch live stock quote for watchlist & paper trades
async function fetchYahooStockQuote(symbol) {
  if (!symbol) return null;
  let s = String(symbol).trim().replace(/^NSE:/i, '').replace(/^BSE:/i, '');
  if (!s.endsWith('.NS') && !s.endsWith('.BO')) s += '.NS';

  try {
    const directUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=1d`;
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;

    const res = await fetch(corsProxyUrl).catch(() => fetch(directUrl));
    if (res.ok) {
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice !== undefined) {
        return {
          price: Number(meta.regularMarketPrice),
          prevClose: Number(meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice)
        };
      }
    }
  } catch (_err) {}
  return null;
}

function normalizeHoldingItem(h, idx, sipMap = new Map()) {
  const sip = sipMap.get(h.asset_id) || {};
  const curVal = Number(h.current_value || 0);
  const invVal = Number(h.invested_value || 0);
  const pnlAbs = Number(h.return_abs ?? h.pnl ?? (curVal - invVal));
  const pnlPct = Number(h.return_pct ?? (invVal > 0 ? (pnlAbs / invVal) * 100 : 0));
  const dayAbs = Number(h.day_change_abs ?? h.day_change ?? 0);
  const dayPct = Number(h.day_change_pct != null ? h.day_change_pct : (h.prev_close > 0 ? ((h.current_price - h.prev_close) / h.prev_close) * 100 : 0));

  const assetType = h.asset_type === 'STOCK' ? 'stocks' : h.asset_type === 'ETF' ? 'etfs' : h.asset_type === 'MF' ? 'mutualFunds' : h.asset_type === 'FD' ? 'fds' : (h.assetType || 'stocks');
  const isStock = h.asset_type === 'STOCK' || (!h.asset_type && !h.api_code && !h.fd_rate && h.category !== 'Mutual Fund' && !h.category?.includes('ETF'));

  // FD-specific computed values (Maturity Value, Accrued Interest, Duration)
  let fdMaturityValue = 0;
  let fdInterestEarned = pnlAbs;
  const sDateStr = h.start_date || h.startDate || h.tx_date || '';
  const mDateStr = h.maturity_date || h.maturityDate || h.fd_maturity_date || '';

  if (assetType === 'fds') {
    let tenureYears = 1;
    if (sDateStr && mDateStr) {
      const sDate = new Date(sDateStr);
      const mDate = new Date(mDateStr);
      if (!isNaN(mDate.getTime()) && !isNaN(sDate.getTime()) && mDate > sDate) {
        tenureYears = (mDate.getTime() - sDate.getTime()) / (365.25 * 24 * 3600 * 1000);
      }
    }
    const principalAmt = invVal || Number(h.current_price || h.avg_price || h.principal || 0);
    const rateVal = Number(h.fd_rate || h.interestRate || 7.0);
    // Compound quarterly (standard Indian banking formula)
    fdMaturityValue = Math.round(principalAmt * Math.pow(1 + (rateVal / 400), 4 * tenureYears));
    if (isNaN(fdMaturityValue) || fdMaturityValue <= 0) {
      fdMaturityValue = Math.round(principalAmt * (1 + (rateVal * tenureYears) / 100));
    }
    fdInterestEarned = Math.max(0, Math.round(curVal >= invVal ? curVal - invVal : pnlAbs));
  }

  const finalPrincipal = invVal || Number(h.current_price || h.avg_price || h.principal || 0);
  const finalCurrentVal = curVal > 0 ? curVal : (assetType === 'fds' ? finalPrincipal + fdInterestEarned : curVal);

  return {
    srNo: idx + 1,
    holdingId: h.asset_id,
    assetId: h.asset_id,
    assetType,
    asset_type: h.asset_type || (isStock ? 'STOCK' : 'UNKNOWN'),
    symbol: h.symbol,
    name: h.name,
    company: h.name,
    fundName: h.name,
    bankName: h.name,
    isin: h.isin || '',
    quantity: Number(h.total_quantity || 1),
    units: Number(h.total_quantity || 1),
    avgPrice: Number(h.avg_price || finalPrincipal || 0),
    buyPrice: Number(h.avg_price || finalPrincipal || 0),
    currentPrice: Number(h.current_price || finalCurrentVal || 0),
    currentNAV: Number(h.current_price || 0),
    prevClose: Number(h.prev_close || h.current_price || 0),
    invested: finalPrincipal,
    investedValue: finalPrincipal,
    principal: finalPrincipal,
    principalAmount: finalPrincipal,
    currentValue: finalCurrentVal,
    maturityValue: fdMaturityValue || Number(h.maturity_value || h.maturityValue || 0),
    interestEarned: fdInterestEarned,
    overallGainLoss: pnlAbs,
    overallGainLossPercentage: Number(pnlPct.toFixed(2)),
    pnl: pnlAbs,
    returnAbs: pnlAbs,
    returnPct: Number(pnlPct.toFixed(2)),
    todaysGainLoss: dayAbs,
    todaysGainLossPercentage: Number(dayPct.toFixed(2)),
    dayChange: dayAbs,
    dayChangePercent: Number(dayPct.toFixed(2)),
    sector: h.sector || (assetType === 'fds' ? 'Fixed Deposit' : ''),
    confidence: h.confidence || 'Medium',
    badge: isStock ? (h.trade_type || h.badge || 'Trade') : null,
    tradeType: isStock ? (h.trade_type || h.badge || 'Trade') : null,
    sipEnabled: Boolean(h.sip_enabled ?? sip.is_enabled),
    sipAmount: Number(h.sip_amount ?? sip.sip_amount ?? 0),
    sipDay: Number(h.sip_day ?? sip.sip_day ?? 1),
    lastSipDate: h.last_sip_date || null,
    fundCode: h.symbol || '',
    mfApiCode: h.api_code || '',
    interestRate: Number(h.fd_rate || 7.0),
    startDate: sDateStr,
    maturityDate: mDateStr,
    weightage: Number(h.weightage ?? h.portfolio_weight ?? h.portfolioWeight ?? h.allocation ?? 0),
    portfolioWeight: Number(h.weightage ?? h.portfolio_weight ?? h.portfolioWeight ?? h.allocation ?? 0),
    color: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'][idx % 7]
  };
}

function normalizeIpo(item) {
  if (!item) return null;
  const priceNum = Number(item.price_num || item.issue_price_max || item.price || 0);
  const lotSize = Number(item.lot_size || 1);
  const gmpAmount = Number(item.gmp_amount || item.gmp || 0);
  const gmpPercent = Number(item.gmp_percent || 0);
  const expectedProfit = gmpAmount * lotSize;
  const minInvestment = priceNum * lotSize;

  let subDetails = item.subscription_details || item.raw_json?.subscription_details || null;
  if (typeof subDetails === 'string') {
    try {
      subDetails = JSON.parse(subDetails);
    } catch {
      subDetails = null;
    }
  }

  // Fallback: extract directly from raw_json if report 333 fields are in raw_json
  if (!subDetails && item.raw_json && (item.raw_json.QIB !== undefined || item.raw_json.NII !== undefined || item.raw_json.RII !== undefined)) {
    const raw = item.raw_json;
    const parseField = (v) => {
      if (!v || v === '-' || v === '--') return { text: '-', num: 0 };
      const str = String(v).replace(/<[^>]*>/g, '').trim();
      const m = str.match(/([0-9]+(?:\.[0-9]+)?)/);
      return { text: m ? `${m[1]}x` : (str || '-'), num: m ? parseFloat(m[1]) : 0 };
    };
    const totalMatch = String(raw.Total || item.subscription || '').match(/<b>([0-9]+(?:\.[0-9]+)?)<\/b>/i) 
      || String(raw.Total || item.subscription || '').match(/([0-9]+(?:\.[0-9]+)?)/);
    const totalNum = totalMatch ? parseFloat(totalMatch[1]) : 0;
    const totalText = totalMatch ? `${totalNum}x` : (item.subscription || '-');

    const qib = parseField(raw.QIB);
    const nii = parseField(raw.NII);
    const shni = parseField(raw.SHNI);
    const bhni = parseField(raw.BHNI);
    const rii = parseField(raw.RII);
    const anchorAvailable = Boolean((raw.Anchor && String(raw.Anchor).includes('✅')) || item.anchor_available);

    let updatedAt = '';
    const timeMatch = String(raw.Total || '').match(/<small[^>]*>.*?<b>([^<]+)<\/b>.*?<\/small>/i)
      || String(raw.Total || '').match(/<small[^>]*>([^<]+)<\/small>/i);
    if (timeMatch) updatedAt = timeMatch[1].replace(/<[^>]*>/g, '').trim();

    subDetails = {
      total: totalText,
      total_num: totalNum,
      qib: qib.text,
      qib_num: qib.num,
      nii: nii.text,
      nii_num: nii.num,
      shni: shni.text,
      shni_num: shni.num,
      bhni: bhni.text,
      bhni_num: bhni.num,
      rii: rii.text,
      rii_num: rii.num,
      anchor_available: anchorAvailable,
      anchor_status: anchorAvailable ? '✅ Allocated' : '-',
      updated_at: updatedAt,
      closing_date: raw['Closing Date'] || ''
    };
  }

  const subscriptionDetails = subDetails ? {
    total: subDetails.total || item.subscription || '-',
    totalNum: Number((subDetails.total_num ?? parseFloat(String(subDetails.total || 0).replace(/[^0-9.]/g, ''))) || 0),
    qib: subDetails.qib || '-',
    qibNum: Number((subDetails.qib_num ?? parseFloat(String(subDetails.qib || 0).replace(/[^0-9.]/g, ''))) || 0),
    nii: subDetails.nii || '-',
    niiNum: Number((subDetails.nii_num ?? parseFloat(String(subDetails.nii || 0).replace(/[^0-9.]/g, ''))) || 0),
    shni: subDetails.shni || '-',
    shniNum: Number((subDetails.shni_num ?? parseFloat(String(subDetails.shni || 0).replace(/[^0-9.]/g, ''))) || 0),
    bhni: subDetails.bhni || '-',
    bhniNum: Number((subDetails.bhni_num ?? parseFloat(String(subDetails.bhni || 0).replace(/[^0-9.]/g, ''))) || 0),
    rii: subDetails.rii || '-',
    riiNum: Number((subDetails.rii_num ?? parseFloat(String(subDetails.rii || 0).replace(/[^0-9.]/g, ''))) || 0),
    anchorAvailable: Boolean(subDetails.anchor_available ?? item.anchor_available),
    anchorStatus: subDetails.anchor_status || (item.anchor_available ? '✅ Allocated' : '-'),
    updatedAt: subDetails.updated_at || '',
    closingDate: subDetails.closing_date || ''
  } : null;

  return {
    id: item.id,
    name: item.ipo_name || item.company_name || item.name || item.symbol || 'IPO',
    companyName: item.ipo_name || item.company_name || item.name || item.symbol || 'IPO',
    symbol: item.symbol || item.ipo_name || '',
    category: item.category || 'IPO',
    status: item.status || 'Upcoming',
    statusBadge: item.status_badge || item.status || 'Upcoming',
    gmpAmount,
    gmpPercent,
    gmpTrend: item.gmp_trend || '',
    ratingFlames: Number(item.rating_flames || 0),
    priceStr: item.price_str || String(priceNum),
    priceNum,
    ipoSize: item.ipo_size || 'N/A',
    lotSize,
    peRatio: item.pe_ratio || '--',
    subscription: item.subscription || '-',
    subscriptionDetails,
    openDate: item.open_date || '',
    closeDate: item.close_date || '',
    boaDate: item.boa_date || '',
    listingDate: item.listing_date || '',
    sortOpen: item.sort_open || null,
    sortClose: item.sort_close || null,
    sortBoa: item.sort_boa || null,
    sortListing: item.sort_listing || null,
    updatedOn: item.updated_on_text || '',
    anchorAvailable: Boolean(item.anchor_available),
    investorGainUrl: item.investorgain_url || '',
    allotmentUrl: item.allotment_url || null,
    drhpUrl: item.drhp_url || null,
    rhpUrl: item.rhp_url || null,
    expectedProfit,
    minInvestment
  };
}

export const supabaseApi = {
  // -----------------------------------------
  // Summary & Allocation APIs
  // -----------------------------------------
  getOverallInvestments: async (prefetchedData) => {
    let s, e, m, f;
    if (prefetchedData) {
      [s, e, m, f] = prefetchedData;
    } else {
      [s, e, m, f] = await Promise.all([
        supabaseApi.getStocks(),
        supabaseApi.getEtfs(),
        supabaseApi.getMutualFunds(),
        supabaseApi.getFDs()
      ]);
    }

    const sumInvested = (arr, valKey = 'invested') => arr.reduce((acc, x) => acc + Number(x[valKey] || 0), 0);
    const sumCurrent = (arr, valKey = 'currentValue') => arr.reduce((acc, x) => acc + Number(x[valKey] || 0), 0);

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
      { 
        assetClass: "Stocks", 
        invested: Number(sInv.toFixed(2)), 
        current: Number(sCur.toFixed(2)), 
        profit: Number(sPnl.toFixed(2)), 
        returnPercentage: Number((sInv > 0 ? (sPnl / sInv) * 100 : 0).toFixed(2)), 
        weightage: Number((totalCur > 0 ? (sCur / totalCur) * 100 : 0).toFixed(2)) 
      },
      { 
        assetClass: "Mutual Funds", 
        invested: Number(mInv.toFixed(2)), 
        current: Number(mCur.toFixed(2)), 
        profit: Number(mPnl.toFixed(2)), 
        returnPercentage: Number((mInv > 0 ? (mPnl / mInv) * 100 : 0).toFixed(2)), 
        weightage: Number((totalCur > 0 ? (mCur / totalCur) * 100 : 0).toFixed(2)) 
      },
      { 
        assetClass: "ETFs", 
        invested: Number(eInv.toFixed(2)), 
        current: Number(eCur.toFixed(2)), 
        profit: Number(ePnl.toFixed(2)), 
        returnPercentage: Number((eInv > 0 ? (ePnl / eInv) * 100 : 0).toFixed(2)), 
        weightage: Number((totalCur > 0 ? (eCur / totalCur) * 100 : 0).toFixed(2)) 
      },
      { 
        assetClass: "Fixed Deposits", 
        invested: Number(fInv.toFixed(2)), 
        current: Number(fCur.toFixed(2)), 
        profit: Number(fPnl.toFixed(2)), 
        returnPercentage: Number((fInv > 0 ? (fPnl / fInv) * 100 : 0).toFixed(2)), 
        weightage: Number((totalCur > 0 ? (fCur / totalCur) * 100 : 0).toFixed(2)) 
      },
      { 
        assetClass: "Total", 
        invested: Number(totalInv.toFixed(2)), 
        current: Number(totalCur.toFixed(2)), 
        profit: Number(totalPnl.toFixed(2)), 
        returnPercentage: Number((totalInv > 0 ? (totalPnl / totalInv) * 100 : 0).toFixed(2)), 
        weightage: 100 
      }
    ];
  },

  getAssetAllocation: async (prefetchedData) => {
    let s, e, m, f;
    if (prefetchedData) {
      [s, e, m, f] = prefetchedData;
    } else {
      [s, e, m, f] = await Promise.all([
        supabaseApi.getStocks(),
        supabaseApi.getEtfs(),
        supabaseApi.getMutualFunds(),
        supabaseApi.getFDs()
      ]);
    }

    const sumCurrent = (arr, valKey = 'currentValue') => arr.reduce((acc, x) => acc + Number(x[valKey] || 0), 0);
    const sCur = sumCurrent(s);
    const eCur = sumCurrent(e);
    const mCur = sumCurrent(m);
    const fCur = sumCurrent(f, 'principal');

    const totalEquity = Number((sCur + eCur + mCur).toFixed(2));
    const totalCashDebt = Number(fCur.toFixed(2));
    const total = Number((totalEquity + totalCashDebt).toFixed(2));

    return [
      { asset: 'Equity', allocation: totalEquity },
      { asset: 'FD', allocation: totalCashDebt },
      { asset: 'Cash', allocation: 0 },
      { asset: 'Total', allocation: total }
    ];
  },

  getOverallSectorAllocation: async () => {
    const { data, error } = await supabase
      .from('vw_global_sector_allocation')
      .select('*')
      .order('total_exposure', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(s => ({
        sector: s.sector_name || s.sector,
        exposure: Number(Number(s.total_exposure || 0).toFixed(2)),
        allocation: Number(Number(s.allocation_pct || s.weight_pct || 0).toFixed(2))
      }));
    }

    const stocks = await supabaseApi.getStocks();
    const sectorMap = {};
    let total = 0;
    stocks.forEach(s => {
      const sec = s.sector || 'Other';
      const cur = s.currentValue || 0;
      sectorMap[sec] = (sectorMap[sec] || 0) + cur;
      total += cur;
    });

    return Object.entries(sectorMap).map(([sector, exposure]) => ({
      sector,
      exposure: Number(exposure.toFixed(2)),
      allocation: Number((total > 0 ? (exposure / total) * 100 : 0).toFixed(2))
    })).sort((a, b) => b.exposure - a.exposure);
  },

  getStocksAllocation: async () => {
    const { data, error } = await supabase
      .from('vw_global_stock_allocation')
      .select('*')
      .order('total_exposure', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(s => ({
        name: s.stock_name || s.name || s.symbol,
        exposure: Number(Number(s.total_exposure || 0).toFixed(2)),
        allocation: Number(Number(s.allocation_pct || s.weight_pct || 0).toFixed(2))
      }));
    }

    const stocks = await supabaseApi.getStocks();
    const totalCur = stocks.reduce((acc, x) => acc + (x.currentValue || 0), 0);
    return stocks.map(s => ({
      name: s.name,
      exposure: Number((s.currentValue || 0).toFixed(2)),
      allocation: totalCur > 0 ? Number(((s.currentValue / totalCur) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.exposure - a.exposure);
  },

  getDashboard: async () => {
    const [overallSectorAllocation, stocksAllocation, s, e, m, f] = await Promise.all([
      supabaseApi.getOverallSectorAllocation(),
      supabaseApi.getStocksAllocation(),
      supabaseApi.getStocks(),
      supabaseApi.getEtfs(),
      supabaseApi.getMutualFunds(),
      supabaseApi.getFDs()
    ]);

    const prefetched = [s, e, m, f];
    const overallInvestments = await supabaseApi.getOverallInvestments(prefetched);
    const assetAllocation = await supabaseApi.getAssetAllocation(prefetched);

    const sumDayChange = (arr) => arr.reduce((acc, x) => acc + Number(x.dayChange || 0), 0);
    const sumCurrentVal = (arr, valKey = 'currentValue') => arr.reduce((acc, x) => acc + Number(x[valKey] || 0), 0);
    const sumInvestedVal = (arr, valKey = 'invested') => arr.reduce((acc, x) => acc + Number(x[valKey] || 0), 0);

    const stocksGain = sumDayChange(s);
    const sCurVal = sumCurrentVal(s);
    const stocksGainPercent = (sCurVal - stocksGain) > 0 ? (stocksGain / (sCurVal - stocksGain)) * 100 : 0;

    const etfsGain = sumDayChange(e);
    const eCurVal = sumCurrentVal(e);
    const etfsGainPercent = (eCurVal - etfsGain) > 0 ? (etfsGain / (eCurVal - etfsGain)) * 100 : 0;

    const mutualFundsGain = sumDayChange(m);
    const mCurVal = sumCurrentVal(m);
    const mutualFundsGainPercent = (mCurVal - mutualFundsGain) > 0 ? (mutualFundsGain / (mCurVal - mutualFundsGain)) * 100 : 0;

    const totalGain = stocksGain + etfsGain + mutualFundsGain;
    const totalCurrentVal = sCurVal + eCurVal + mCurVal + sumCurrentVal(f, 'currentValue');
    const totalInvVal = sumInvestedVal(s) + sumInvestedVal(e) + sumInvestedVal(m) + sumInvestedVal(f, 'principal');
    const gainPercent = (totalCurrentVal - totalGain) > 0 ? (totalGain / (totalCurrentVal - totalGain)) * 100 : 0;

    return {
      overallInvestments,
      assetAllocation,
      overallSectorAllocation,
      stocksAllocation,
      todayPerformance: {
        data: {
          gain: Number(totalGain.toFixed(2)),
          gainPercent: Number(gainPercent.toFixed(2)),
          stocksGain: Number(stocksGain.toFixed(2)),
          stocksGainPercent: Number(stocksGainPercent.toFixed(2)),
          etfsGain: Number(etfsGain.toFixed(2)),
          etfsGainPercent: Number(etfsGainPercent.toFixed(2)),
          mutualFundsGain: Number(mutualFundsGain.toFixed(2)),
          mutualFundsGainPercent: Number(mutualFundsGainPercent.toFixed(2)),
          totalCurrentValue: Number(totalCurrentVal.toFixed(2)),
          totalInvestedValue: Number(totalInvVal.toFixed(2))
        }
      }
    };
  },

  // -----------------------------------------
  // Holdings APIs (Equivalent to GAS action=stocks, etfs, mutualFunds, fds)
  // -----------------------------------------
  getStocks: async () => {
    const { data, error } = await supabase
      .from('vw_holdings')
      .select('*')
      .eq('asset_type', 'STOCK')
      .order('current_value', { ascending: false });

    if (error) throw error;
    return (data || []).map((h, idx) => normalizeHoldingItem(h, idx));
  },

  getEtfs: async () => {
    const { data, error } = await supabase
      .from('vw_holdings')
      .select('*')
      .eq('asset_type', 'ETF')
      .order('current_value', { ascending: false });

    if (error) throw error;
    return (data || []).map((h, idx) => normalizeHoldingItem(h, idx));
  },

  getMutualFunds: async () => {
    const [holdingsRes, sipRes] = await Promise.all([
      supabase.from('vw_holdings').select('*').eq('asset_type', 'MF').order('current_value', { ascending: false }),
      supabase.from('mf_sip_configs').select('*')
    ]);

    if (holdingsRes.error) throw holdingsRes.error;

    const sipMap = new Map((sipRes?.data || []).map(s => [s.asset_id, s]));
    return (holdingsRes.data || []).map((h, idx) => normalizeHoldingItem(h, idx, sipMap));
  },

  getFDs: async () => {
    const { data, error } = await supabase
      .from('vw_holdings')
      .select('*')
      .eq('asset_type', 'FD');

    if (error) throw error;
    return (data || []).map((h, idx) => normalizeHoldingItem(h, idx));
  },

  // -----------------------------------------
  // Portfolio Combined API (Equivalent to GAS action=portfolio)
  // -----------------------------------------
  getPortfolio: async () => {
    const [stocks, etfs, mutualFunds, fds] = await Promise.all([
      supabaseApi.getStocks(),
      supabaseApi.getEtfs(),
      supabaseApi.getMutualFunds(),
      supabaseApi.getFDs(),
    ]);

    // Calculate total portfolio value across all asset types
    const allHoldings = [...stocks, ...etfs, ...mutualFunds, ...fds];
    const totalCurrentVal = allHoldings.reduce(
      (sum, h) => sum + (Number(h.currentValue) || Number(h.principal) || 0),
      0
    );

    if (totalCurrentVal > 0) {
      allHoldings.forEach((h) => {
        const val = Number(h.currentValue) || Number(h.principal) || 0;
        const weight = Number(((val / totalCurrentVal) * 100).toFixed(2));
        h.weightage = weight;
        h.portfolioWeight = weight;
      });
    }

    return { stocks, etfs, mutualFunds, fds };
  },

  // -----------------------------------------
  // News APIs
  // -----------------------------------------
  getNews: async (limit) => {
    let query = supabase
      .from('vw_user_news')
      .select('*')
      .order('published_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.warn('vw_user_news error:', error.message);
      return [];
    }

    return (data || []).map(n => ({
      guid: n.guid,
      title: n.title,
      source: n.source,
      category: n.category,
      publishedAt: n.published_at,
      link: n.url,
      url: n.url,
      isRead: n.is_read,
      company: n.company_name || n.symbol || '',
      symbol: n.symbol || ''
    }));
  },

  getStockNews: async (symbol, limit) => {
    let query = supabase
      .from('news')
      .select('guid, title, source, category, published_at, url, is_read, assets!inner(symbol, name)')
      .ilike('assets.symbol', `%${symbol}%`)
      .order('published_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.warn('Stock news error:', error.message);
      return [];
    }

    return (data || []).map(n => ({
      guid: n.guid,
      title: n.title,
      source: n.source,
      category: n.category,
      publishedAt: n.published_at,
      link: n.url,
      url: n.url,
      isRead: n.is_read,
      company: n.assets?.name || n.assets?.symbol || symbol,
      symbol: n.assets?.symbol || symbol
    }));
  },

  // -----------------------------------------
  // Company Documents APIs
  // -----------------------------------------
  getCompanyDocuments: async (symbol) => {
    let query = supabase
      .from('company_documents')
      .select('attachment_id, symbol, scrip_code, company, announcement_date, announcement_time, reporting_period, document_type, title, original_title, pdf_url, attachment_name, ai_summary_json, ai_status, ai_model, ai_generated_on')
      .order('announcement_date', { ascending: false });

    if (symbol) {
      const cleanSym = String(symbol).replace(/^(NSE:|BSE:)/i, '').replace(/(\.NS|\.BO)$/i, '');
      query = query.ilike('symbol', `%${cleanSym}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Company documents query error:', error.message);
      return [];
    }

    return (data || []).map(doc => ({
      attachmentId: doc.attachment_id,
      id: doc.attachment_id,
      symbol: doc.symbol || symbol,
      company: doc.company || '',
      scripCode: doc.scrip_code || '',
      title: doc.title,
      headline: doc.title,
      originalTitle: doc.original_title || doc.title,
      documentType: doc.document_type,
      category: doc.document_type,
      reportingPeriod: doc.reporting_period,
      pdfUrl: doc.pdf_url,
      announcementDate: doc.announcement_date || '',
      announcementTime: doc.announcement_time || '',
      aiSummary: doc.ai_summary_json,
      aiStatus: doc.ai_status,
      aiModel: doc.ai_model,
      aiGeneratedOn: doc.ai_generated_on
    }));
  },

  summarizeDocument: async (documentId) => {
    const { data, error } = await supabase.functions.invoke('generate-ai-summary', {
      body: { documentId, attachment_id: documentId }
    });
    if (error) throw error;
    return data;
  },

  sendVoiceQuery: async (query) => {
    const { data, error } = await supabase.functions.invoke('process-voice-query', {
      body: { query }
    });
    if (error) throw error;
    return data;
  },

  // -----------------------------------------
  // Master NSE Stock & ETF Search API
  // -----------------------------------------
  searchNseStocks: async (query) => {
    if (!query || query.trim().length < 1) return [];
    const q = query.trim().toUpperCase();
    const { data, error } = await supabase
      .from('nse_stocks')
      .select('symbol, isin, name, sector, series')
      .or(`symbol.ilike.%${q}%,name.ilike.%${q}%,isin.ilike.%${q}%`)
      .limit(15);

    if (error) {
      console.warn('NSE stocks search fallback:', error.message);
      return [];
    }
    return data || [];
  },

  // -----------------------------------------
  // Master Mutual Fund Schemes Search API
  // -----------------------------------------
  searchMfSchemes: async (query) => {
    if (!query || query.trim().length < 1) return [];
    const q = query.trim();
    const isNum = !isNaN(Number(q));

    let dbQuery = supabase
      .from('mf_schemes')
      .select('scheme_code, isin, name, amc_name, category, plan, nav, nav_date')
      .or(`name.ilike.%${q}%,amc_name.ilike.%${q}%,isin.ilike.%${q}%${isNum ? `,scheme_code.eq.${Number(q)}` : ''}`)
      .order('name', { ascending: true })
      .limit(20);

    const { data, error } = await dbQuery;
    if (error) {
      console.warn('MF schemes search error:', error.message);
      return [];
    }

    return (data || []).map((item) => ({
      schemeCode: String(item.scheme_code),
      isin: item.isin || '',
      name: item.name,
      amcName: item.amc_name || '',
      category: item.category || '',
      plan: item.plan || '',
      nav: item.nav != null ? Number(item.nav) : null,
      navDate: item.nav_date || ''
    }));
  },

  // -----------------------------------------
  // Watchlist APIs
  // -----------------------------------------
  getWatchlist: async () => {
    const { data, error } = await supabase
      .from('vw_watchlist')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) throw error;

    const items = await Promise.all((data || []).map(async (item) => {
      let curPrice = Number(item.current_price || 0);
      let prevClose = Number(item.prev_close || 0);
      let addedPrice = Number(item.added_price || 0);

      // If price or addedPrice is 0 (e.g. newly watched stock not in portfolio), fetch live quote
      if (curPrice <= 0 || addedPrice <= 0 || prevClose <= 0) {
        try {
          const live = await fetchYahooStockQuote(item.symbol);
          if (live && live.price > 0) {
            if (curPrice <= 0) curPrice = live.price;
            if (prevClose <= 0) prevClose = live.prevClose || live.price;
            if (addedPrice <= 0) {
              addedPrice = live.price;
              supabase.from('watchlist_items').update({ added_price: live.price }).eq('watchlist_id', item.watchlist_id).then();
            }
          }
        } catch (_e) {}
      }

      const returnSinceAddedAbs = addedPrice > 0 ? (curPrice - addedPrice) : 0;
      const returnSinceAddedPct = addedPrice > 0 ? ((curPrice - addedPrice) / addedPrice) * 100 : 0;
      const dayChangeAbs = prevClose > 0 ? (curPrice - prevClose) : 0;
      const dayChangePct = prevClose > 0 ? ((curPrice - prevClose) / prevClose) * 100 : 0;

      return {
        watchlistId: item.watchlist_id,
        symbol: item.symbol,
        isin: item.isin || '',
        name: item.name,
        sector: item.sector || '',
        confidence: item.confidence || 'Medium',
        badge: item.badge || 'Trade',
        addedPrice: Number(addedPrice.toFixed(2)),
        targetPrice: item.target_price ? Number(item.target_price) : null,
        notes: item.notes || '',
        addedAt: item.added_at,
        currentPrice: Number(curPrice.toFixed(2)),
        prevClose: Number(prevClose.toFixed(2)),
        returnSinceAddedPct: Number(returnSinceAddedPct.toFixed(2)),
        returnSinceAddedAbs: Number(returnSinceAddedAbs.toFixed(2)),
        dayChangePercent: Number(dayChangePct.toFixed(2)),
        dayChange: Number(dayChangeAbs.toFixed(2)),
        inPortfolio: Boolean(item.in_portfolio)
      };
    }));

    return items;
  },

  addWatchlistItem: async (payload) => {
    return supabaseApi.executeTrade({ action: 'addWatchlistItem', ...payload });
  },

  removeWatchlistItem: async (payload) => {
    return supabaseApi.executeTrade({ action: 'removeWatchlistItem', ...payload });
  },

  // -----------------------------------------
  // Paper Trade APIs
  // -----------------------------------------
  getPaperPortfolio: async () => {
    const [summaryRes, holdingsRes] = await Promise.all([
      supabase.from('vw_paper_summary').select('*').maybeSingle(),
      supabase.from('vw_paper_holdings').select('*').order('current_value', { ascending: false })
    ]);

    const summary = summaryRes.data || {
      initial_capital: 5000000,
      current_cash: 5000000,
      realized_pnl: 0,
      total_invested: 0,
      total_current: 0,
      unrealized_pnl: 0,
      total_day_change: 0,
      portfolio_value: 5000000,
      total_pnl: 0,
      total_pnl_pct: 0
    };

    const holdingsRaw = holdingsRes.data || [];
    const totalCur = holdingsRaw.reduce((acc, x) => acc + Number(x.current_value || 0), 0);
    const holdings = holdingsRaw.map((h, idx) => ({
      assetId: h.asset_id,
      symbol: h.symbol,
      name: h.name,
      sector: h.sector || '',
      confidence: h.confidence || 'Medium',
      badge: h.badge || 'Trade',
      quantity: Number(h.total_quantity || 0),
      buyPrice: Number(h.avg_price || 0),
      investedValue: Number(h.invested_value || 0),
      currentPrice: Number(h.current_price || 0),
      currentValue: Number(h.current_value || 0),
      pnl: Number(h.pnl || 0),
      pnlPercent: Number((h.pnl_pct || 0).toFixed(2)),
      dayChange: Number(h.day_change || 0),
      dayChangePercent: Number((h.day_change_pct || 0).toFixed(2)),
      portfolioPercentage: totalCur > 0 ? Number(((Number(h.current_value || 0) / totalCur) * 100).toFixed(2)) : 0,
      color: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'][idx % 7]
    }));

    return {
      summary: {
        initialCapital: Number(summary.initial_capital || 5000000),
        currentCash: Number(summary.current_cash || 5000000),
        realizedPnl: Number(summary.realized_pnl || 0),
        totalInvested: Number(summary.total_invested || 0),
        totalCurrent: Number(summary.total_current || 0),
        unrealizedPnl: Number(summary.unrealized_pnl || 0),
        totalDayChange: Number(summary.total_day_change || 0),
        portfolioValue: Number(summary.portfolio_value || 5000000),
        totalPnl: Number(summary.total_pnl || 0),
        totalPnlPct: Number((summary.total_pnl_pct || 0).toFixed(2))
      },
      holdings
    };
  },

  addPaperHolding: async (payload) => {
    return supabaseApi.executeTrade({ action: 'addPaperHolding', ...payload });
  },

  sellPaperHolding: async (payload) => {
    return supabaseApi.executeTrade({ action: 'sellPaperHolding', ...payload });
  },

  updatePaperCapital: async (payload) => {
    return supabaseApi.executeTrade({ action: 'updatePaperCapital', ...payload });
  },

  resetPaperPortfolio: async () => {
    return supabaseApi.executeTrade({ action: 'resetPaperPortfolio' });
  },

  // -----------------------------------------
  // Mainboard IPO APIs
  // -----------------------------------------
  getIpos: async () => {
    const { data, error } = await supabase
      .from('mainboard_ipos')
      .select('*')
      .order('open_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeIpo);
  },

  getIpoById: async (id) => {
    const { data, error } = await supabase
      .from('mainboard_ipos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return normalizeIpo(data);
  },

  getIpoGmpHistory: async (ipoId) => {
    const { data, error } = await supabase
      .from('ipo_gmp_history')
      .select('*')
      .eq('ipo_id', ipoId)
      .order('recorded_at', { ascending: true });

    if (error) {
      console.warn('Could not load ipo_gmp_history:', error.message);
      return [];
    }
    return data || [];
  },

  // -----------------------------------------
  // Direct Database Mutation Handler (PostgREST)
  // -----------------------------------------
  executeDirectTrade: async (payload) => {
    const action = payload.action;
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // 1. ADD / BUY MORE HOLDING
    if (action === 'buyMore' || action === 'addHolding') {
      let targetAssetId = payload.assetId || payload.asset_id;
      let targetSymbol = payload.symbol ? payload.symbol.trim().toUpperCase() : '';
      let targetType = (payload.assetType || payload.asset_type || 'STOCK').toUpperCase();

      if (!targetAssetId) {
        let query = supabase.from('assets').select('asset_id, current_price').limit(1);
        if (targetType === 'MF' && (payload.mfApiCode || payload.api_code)) {
          query = query.eq('api_code', payload.mfApiCode || payload.api_code);
        } else if (payload.isin) {
          query = query.eq('isin', payload.isin);
        } else if (targetSymbol && !targetSymbol.startsWith('ASSET_')) {
          query = query.eq('symbol', targetSymbol);
        } else if (payload.name) {
          query = query.eq('name', payload.name);
        }

        const { data: existing } = await query.maybeSingle();
        if (existing) {
          targetAssetId = existing.asset_id;
        } else {
          let initPrice = Number(payload.currentNav || payload.price || payload.fd_principal || 0);
          let initPrevClose = initPrice;

          if (targetType === 'MF' && (payload.mfApiCode || payload.api_code)) {
            try {
              const code = payload.mfApiCode || payload.api_code;
              const mfRes = await fetch(`https://api.mfapi.in/mf/${code}`);
              if (mfRes.ok) {
                const mfJson = await mfRes.json();
                if (mfJson?.data?.length > 0) {
                  const latestNav = parseFloat(mfJson.data[0].nav);
                  if (!isNaN(latestNav) && latestNav > 0) {
                    initPrice = latestNav;
                    if (mfJson.data.length > 1) {
                      const prevNav = parseFloat(mfJson.data[1].nav);
                      if (!isNaN(prevNav) && prevNav > 0) {
                        initPrevClose = prevNav;
                      } else {
                        initPrevClose = latestNav;
                      }
                    } else {
                      initPrevClose = latestNav;
                    }
                  }
                }
              }
            } catch (_err) {
              console.warn("Direct MF fetch error in client:", _err);
            }
          }

          const { data: newAsset, error: createErr } = await supabase.from('assets').insert({
            symbol: targetSymbol || (targetType === 'MF' && (payload.mfApiCode || payload.api_code) ? `AMFI_${payload.mfApiCode || payload.api_code}` : `ASSET_${Date.now()}`),
            name: payload.name ? payload.name.trim() : targetSymbol,
            asset_type: targetType,
            sector: payload.sector || null,
            category: payload.category || null,
            confidence: payload.confidence || 'Medium',
            trade_type: payload.badge || payload.tradeType || 'Trade',
            current_price: initPrice,
            prev_close: initPrevClose,
            isin: payload.isin || null,
            api_code: payload.mfApiCode || payload.api_code || null
          }).select().single();
          if (createErr) throw createErr;
          targetAssetId = newAsset.asset_id;
        }
      }

      // User-specific duplicate holding check for addHolding
      if (userId && targetAssetId && action === 'addHolding' && targetType !== 'FD') {
        const { data: userHolding } = await supabase
          .from('transactions')
          .select('tx_id')
          .eq('user_id', userId)
          .eq('asset_id', targetAssetId)
          .limit(1)
          .maybeSingle();

        if (userHolding) {
          throw new Error(`You already hold this asset. Please use 'Buy More' on your existing holding.`);
        }
      }

      if (targetType === 'FD' || action === 'addFD') {
        const principal = Number(payload.fd_principal || payload.principal || payload.price || payload.quantity || 0);
        const rate = Number(payload.fd_rate || payload.interestRate || 0);
        const maturity = payload.fd_maturity_date || payload.maturityDate || null;
        const start = payload.startDate ? new Date(payload.startDate).toISOString() : new Date().toISOString();

        const { data: tx, error: txErr } = await supabase.from('transactions').insert({
          asset_id: targetAssetId,
          tx_type: 'BUY',
          quantity: 1,
          price: principal,
          fd_principal: principal,
          fd_rate: rate,
          fd_maturity_date: maturity,
          tx_date: start
        }).select().single();
        if (txErr) throw txErr;
        return { success: true, transaction: tx };
      }

      const { data: tx, error: txErr } = await supabase.from('transactions').insert({
        asset_id: targetAssetId,
        tx_type: 'BUY',
        quantity: Number(payload.quantity),
        price: Number(payload.price),
        tx_date: new Date().toISOString()
      }).select().single();
      if (txErr) throw txErr;

      if (targetType === 'MF' && (payload.sipEnabled !== undefined || payload.sipAmount || payload.sipDay)) {
        await supabase.from('mf_sip_configs').upsert({
          asset_id: targetAssetId,
          is_enabled: Boolean(payload.sipEnabled),
          sip_day: Number(payload.sipDay || 1),
          sip_amount: Number(payload.sipAmount || 0)
        });
      }

      return { success: true, transaction: tx };
    }

    // 2. UPDATE HOLDING
    if (action === 'updateHolding') {
      const targetAssetId = payload.assetId || payload.asset_id;
      const targetQty = Number(payload.quantity);
      const targetPrice = Number(payload.price);

      const updates = {};
      if (payload.confidence) updates.confidence = payload.confidence;
      if (payload.tradeType || payload.badge) updates.trade_type = payload.tradeType || payload.badge;
      if (payload.sector) updates.sector = payload.sector;

      if (Object.keys(updates).length > 0) {
        await supabase.from('assets').update(updates).eq('asset_id', targetAssetId);
      }

      await supabase.from('transactions').delete().eq('asset_id', targetAssetId);

      const { data: tx, error: txErr } = await supabase.from('transactions').insert({
        asset_id: targetAssetId,
        tx_type: 'BUY',
        quantity: targetQty,
        price: targetPrice,
        tx_date: new Date().toISOString()
      }).select().single();
      if (txErr) throw txErr;
      return { success: true, transaction: tx };
    }

    // 3. SELL HOLDING
    if (action === 'sellHolding') {
      const targetAssetId = payload.assetId || payload.asset_id;
      const sellQty = Number(payload.quantity);

      const { data: holding } = await supabase
        .from('vw_holdings')
        .select('total_quantity, avg_price, current_price')
        .eq('asset_id', targetAssetId)
        .maybeSingle();

      const curQty = Number(holding?.total_quantity || 0);
      const sellPrice = Number(payload.price) > 0 ? Number(payload.price) : Number(holding?.current_price || holding?.avg_price || 0);

      if (sellQty >= curQty) {
        await supabase.from('transactions').delete().eq('asset_id', targetAssetId);
        return { success: true, fullySold: true };
      } else {
        const { data: tx, error: txErr } = await supabase.from('transactions').insert({
          asset_id: targetAssetId,
          tx_type: 'SELL',
          quantity: -Math.abs(sellQty),
          price: sellPrice,
          tx_date: new Date().toISOString()
        }).select().single();
        if (txErr) throw txErr;
        return { success: true, fullySold: false, transaction: tx };
      }
    }

    // 4. FD ACTIONS
    if (action === 'addFD') {
      return supabaseApi.executeDirectTrade({ action: 'addHolding', assetType: 'FD', ...payload });
    }

    if (action === 'deleteFD') {
      const targetTxId = payload.tx_id || payload.txId;
      const { error } = await supabase.from('transactions').delete().eq('tx_id', targetTxId);
      if (error) throw error;
      return { success: true, deleted: targetTxId };
    }

    if (action === 'updateFD') {
      const targetTxId = payload.tx_id || payload.txId;
      const updates = {};
      const principalVal = Number(payload.fd_principal || payload.principal || payload.price || payload.quantity || 0);
      if (principalVal > 0) {
        updates.price = principalVal;
        updates.fd_principal = principalVal;
      }
      if (payload.fd_rate || payload.interestRate) updates.fd_rate = Number(payload.fd_rate || payload.interestRate);
      if (payload.fd_maturity_date || payload.maturityDate) updates.fd_maturity_date = payload.fd_maturity_date || payload.maturityDate;
      if (payload.startDate) updates.tx_date = new Date(payload.startDate).toISOString();

      let query = supabase.from('transactions').update(updates);
      if (targetTxId) query = query.eq('tx_id', targetTxId);
      else query = query.eq('asset_id', payload.assetId || payload.asset_id);

      const { data: tx, error: txErr } = await query.select();
      if (txErr) throw txErr;
      return { success: true, transaction: tx };
    }

    // 5. WATCHLIST ACTIONS
    if (action === 'addWatchlistItem') {
      const sym = payload.symbol ? payload.symbol.trim().toUpperCase() : '';
      let addedPrice = Number(payload.added_price || payload.addedPrice || payload.price || 0);
      if (addedPrice <= 0 && sym) {
        const live = await fetchYahooStockQuote(sym);
        if (live && live.price > 0) addedPrice = live.price;
      }

      const { data, error } = await supabase.from('watchlist_items').upsert({
        symbol: sym,
        isin: payload.isin || null,
        name: payload.name ? payload.name.trim() : sym,
        sector: payload.sector || null,
        confidence: payload.confidence || 'Medium',
        badge: payload.badge || payload.tradeType || 'Trade',
        added_price: Number(addedPrice.toFixed(2)),
        target_price: payload.target_price || payload.targetPrice ? Number(payload.target_price || payload.targetPrice) : null,
        notes: payload.notes || null,
        added_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return { success: true, item: data };
    }

    if (action === 'removeWatchlistItem') {
      let query = supabase.from('watchlist_items').delete();
      if (payload.watchlistId || payload.watchlist_id) query = query.eq('watchlist_id', payload.watchlistId || payload.watchlist_id);
      else if (payload.symbol) query = query.eq('symbol', payload.symbol.trim().toUpperCase());
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    }

    // 6. PAPER TRADING ACTIONS
    if (action === 'updatePaperCapital') {
      const cap = Number(payload.newCapital || payload.initialCapital);
      const { data: config } = await supabase.from('paper_portfolio_config').select('*').maybeSingle();
      const oldInitial = config ? Number(config.initial_capital) : 5000000;
      const oldCash = config ? Number(config.current_cash) : 5000000;
      const diff = cap - oldInitial;
      const newCash = Math.max(0, oldCash + diff);

      const { data, error } = await supabase.from('paper_portfolio_config').upsert({
        initial_capital: cap,
        current_cash: newCash,
        updated_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return { success: true, config: data };
    }

    if (action === 'resetPaperPortfolio') {
      await supabase.from('paper_transactions').delete().neq('quantity', 0);
      await supabase.from('paper_assets').delete().neq('name', '');

      const { data: config } = await supabase.from('paper_portfolio_config').select('*').maybeSingle();
      const initCap = config ? Number(config.initial_capital) : 5000000;

      const { data, error } = await supabase.from('paper_portfolio_config').upsert({
        initial_capital: initCap,
        current_cash: initCap,
        realized_pnl: 0,
        updated_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return { success: true, config: data };
    }

    if (action === 'addPaperHolding' || action === 'buyPaperStock') {
      const buyQty = Number(payload.quantity);
      const buyPrice = Number(payload.price);
      const sym = payload.symbol ? payload.symbol.trim().toUpperCase() : '';
      const totalCost = buyQty * buyPrice;

      const { data: config } = await supabase.from('paper_portfolio_config').select('*').maybeSingle();
      const currentCash = config ? Number(config.current_cash) : 5000000;
      if (currentCash < totalCost) {
        throw new Error(`Insufficient virtual cash. Available: ₹${currentCash.toLocaleString('en-IN')}, Required: ₹${totalCost.toLocaleString('en-IN')}`);
      }

      let { data: pAsset } = await supabase.from('paper_assets').select('*').eq('symbol', sym).maybeSingle();
      if (!pAsset) {
        const { data: newPAsset, error: pCreateErr } = await supabase.from('paper_assets').insert({
          symbol: sym,
          name: payload.name ? payload.name.trim() : sym,
          sector: payload.sector || null,
          confidence: payload.confidence || 'Medium',
          trade_type: payload.badge || payload.tradeType || 'Trade',
          current_price: buyPrice,
          prev_close: buyPrice,
          isin: payload.isin || null,
          last_updated: new Date().toISOString()
        }).select().single();
        if (pCreateErr) throw pCreateErr;
        pAsset = newPAsset;
      }

      const { data: txData, error: txErr } = await supabase.from('paper_transactions').insert({
        asset_id: pAsset.asset_id,
        tx_type: 'BUY',
        quantity: buyQty,
        price: buyPrice,
        tx_date: new Date().toISOString()
      }).select().single();
      if (txErr) throw txErr;

      await supabase.from('paper_portfolio_config').update({
        current_cash: currentCash - totalCost,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);

      return { success: true, transaction: txData };
    }

    if (action === 'sellPaperHolding') {
      const sellQty = Number(payload.quantity);
      const targetPaperId = payload.assetId || payload.asset_id;

      const { data: holding } = await supabase.from('vw_paper_holdings').select('*').eq('asset_id', targetPaperId).single();
      if (!holding) throw new Error('No active paper holding found to sell.');
      const curQty = Number(holding.total_quantity || 0);
      const avgPrice = Number(holding.avg_price || 0);
      const finalSellPrice = Number(payload.price) > 0 ? Number(payload.price) : Number(holding.current_price || avgPrice);
      const proceeds = sellQty * finalSellPrice;
      const realizedGain = (finalSellPrice - avgPrice) * sellQty;

      if (sellQty >= curQty) {
        await supabase.from('paper_transactions').delete().eq('asset_id', targetPaperId);
      } else {
        await supabase.from('paper_transactions').insert({
          asset_id: targetPaperId,
          tx_type: 'SELL',
          quantity: -Math.abs(sellQty),
          price: finalSellPrice,
          realized_gain: realizedGain,
          tx_date: new Date().toISOString()
        });
      }

      const { data: config } = await supabase.from('paper_portfolio_config').select('*').maybeSingle();
      if (config) {
        await supabase.from('paper_portfolio_config').update({
          current_cash: Number(config.current_cash) + proceeds,
          realized_pnl: Number(config.realized_pnl) + realizedGain,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
      }

      return { success: true, realizedGain };
    }

    throw new Error('Unsupported action: ' + action);
  },

  // -----------------------------------------
  // Mutations via Edge Function with PostgREST Fallback
  // -----------------------------------------
  executeTrade: async (payload) => {
    try {
      const { data, error } = await supabase.functions.invoke('execute-trade', {
        body: payload
      });
      if (!error && data) return data;
      return await supabaseApi.executeDirectTrade(payload);
    } catch (_err) {
      return await supabaseApi.executeDirectTrade(payload);
    }
  },

  buyMore: async (payload) => {
    return supabaseApi.executeTrade({ action: 'buyMore', ...payload });
  },

  updateHolding: async (payload) => {
    return supabaseApi.executeTrade({ action: 'updateHolding', ...payload });
  },

  sellHolding: async (payload) => {
    return supabaseApi.executeTrade({ action: 'sellHolding', ...payload });
  },

  addHolding: async (payload) => {
    return supabaseApi.executeTrade({ action: 'addHolding', ...payload });
  },

  updateFD: async (payload) => {
    return supabaseApi.executeTrade({ action: 'updateFD', ...payload });
  },

  deleteFD: async (payload) => {
    return supabaseApi.executeTrade({ action: 'deleteFD', ...payload });
  },
};
