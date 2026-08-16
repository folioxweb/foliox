import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { api } from '../services/apiClient';
import { isIndianMarketOpen } from '../utils/marketHours';

function emptySlice() {
  return { data: null, loading: false, error: null };
}

const PREFETCH_DELAY_MS = 2000;

const initialState = {
  overallInvestments: emptySlice(),
  assetAllocation: emptySlice(),
  overallSectorAllocation: emptySlice(),
  stocksAllocation: emptySlice(),
  todayPerformance: emptySlice(),
  stocks: emptySlice(),
  etfs: emptySlice(),
  mutualFunds: emptySlice(),
  fds: emptySlice(),
  lastUpdated: null,
  // Prefetched secondary data
  news: emptySlice(),
  stockNews: {}, // { [SYMBOL]: { data: [], loading: false, error: null } }
};

const ENDPOINT_TO_KEY = {
  overallInvestments: 'overallInvestments',
  assetAllocation: 'assetAllocation',
  overallSectorAllocation: 'overallSectorAllocation',
  stocksAllocation: 'stocksAllocation',
  stocks: 'stocks',
  etfs: 'etfs',
  mutualFunds: 'mutualFunds',
  fds: 'fds',
};

const LIVE_REFRESH_INTERVAL_MS = 60_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CACHE_KEY = "portfolio-cache";

function portfolioReducer(state, action) {
  const key = ENDPOINT_TO_KEY[action.endpoint];

  switch (action.type) {
    case "DASHBOARD_SUCCESS":
      return {
        ...state,
        overallInvestments: { data: action.data.overallInvestments, loading: false, error: null },
        assetAllocation: { data: action.data.assetAllocation, loading: false, error: null },
        overallSectorAllocation: { data: action.data.overallSectorAllocation, loading: false, error: null },
        stocksAllocation: { data: action.data.stocksAllocation, loading: false, error: null },
        todayPerformance: { data: action.data.todayPerformance, loading: false, error: null },
        lastUpdated: new Date(),
      };

    case "PORTFOLIO_SUCCESS":
      return {
        ...state,
        stocks: { data: action.data.stocks, loading: false, error: null },
        etfs: { data: action.data.etfs, loading: false, error: null },
        mutualFunds: { data: action.data.mutualFunds, loading: false, error: null },
        fds: { data: action.data.fds, loading: false, error: null },
        lastUpdated: new Date(),
      };

    case 'FETCH_START':
      if (!key) return state;
      return { ...state, [key]: { ...state[key], loading: true, error: null } };

    case 'FETCH_SUCCESS':
      if (!key) return state;
      return { ...state, [key]: { data: action.data, loading: false, error: null }, lastUpdated: new Date() };

    case 'FETCH_ERROR':
      if (!key) return state;
      return { ...state, [key]: { ...state[key], loading: false, error: action.error } };

    // ── Prefetch: all news ───────────────────────────────────────────────────
    case 'NEWS_PREFETCH_SUCCESS':
      return { ...state, news: { data: action.data, loading: false, error: null } };

    // ── Prefetch: stock specific news ────────────────────────────────────────
    case 'STOCK_NEWS_PREFETCH_SUCCESS':
      return {
        ...state,
        stockNews: {
          ...state.stockNews,
          [action.symbol]: { data: action.data, loading: false, error: null },
        },
      };

    default:
      return state;
  }
}

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(
    portfolioReducer,
    initialState,
    () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return initialState;
        const parsed = JSON.parse(cached);
        // Keep loading/error clean
        Object.keys(ENDPOINT_TO_KEY).forEach((key) => {
          parsed[key].loading = false;
          parsed[key].error = null;
        });
        return parsed;
      } catch {
        return initialState;
      }
    }
  );
  
  const liveRefreshInFlight = useRef(false);
  const refreshInProgress = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEndpoint = useCallback(async (endpoint, apiFn) => {
    dispatch({ type: 'FETCH_START', endpoint });
    try {
      const data = await apiFn();

if (!data) return;

dispatch({
    type:"FETCH_SUCCESS",
    endpoint,
    data
});
    } catch (error) {
      console.error(`[API ERROR] ${endpoint} ->`, error);
      dispatch({ type: 'FETCH_ERROR', endpoint, error });
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      dispatch({ type: "FETCH_START", endpoint: "overallInvestments" });
      dispatch({ type: "FETCH_START", endpoint: "assetAllocation" });
      dispatch({ type: "FETCH_START", endpoint: "overallSectorAllocation" });
      dispatch({ type: "FETCH_START", endpoint: "stocksAllocation" });

      const data = await api.getDashboard();
      if (!data) {
        // Session expired — apiClient already dispatched app-logout.
        // Clear loading state so UI doesn't hang on skeletons.
        const sessionErr = { message: 'Session expired' };
        dispatch({ type: 'FETCH_ERROR', endpoint: 'overallInvestments', error: sessionErr });
        dispatch({ type: 'FETCH_ERROR', endpoint: 'assetAllocation', error: sessionErr });
        dispatch({ type: 'FETCH_ERROR', endpoint: 'overallSectorAllocation', error: sessionErr });
        dispatch({ type: 'FETCH_ERROR', endpoint: 'stocksAllocation', error: sessionErr });
        return;
      }
      dispatch({ type: "DASHBOARD_SUCCESS", data });
    } catch (error) {
      console.error("[API ERROR] dashboard", error);
      const sessionErr = { message: error.message || 'Failed to load dashboard' };
      dispatch({ type: 'FETCH_ERROR', endpoint: 'overallInvestments', error: sessionErr });
      dispatch({ type: 'FETCH_ERROR', endpoint: 'assetAllocation', error: sessionErr });
      dispatch({ type: 'FETCH_ERROR', endpoint: 'overallSectorAllocation', error: sessionErr });
      dispatch({ type: 'FETCH_ERROR', endpoint: 'stocksAllocation', error: sessionErr });
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      dispatch({ type: "FETCH_START", endpoint: "stocks" });
      dispatch({ type: "FETCH_START", endpoint: "etfs" });
      dispatch({ type: "FETCH_START", endpoint: "mutualFunds" });
      dispatch({ type: "FETCH_START", endpoint: "fds" });

      const data = await api.getPortfolio();
      if (!data) {
        // Session expired — apiClient already dispatched app-logout.
        const sessionErr = { message: 'Session expired' };
        dispatch({ type: 'FETCH_ERROR', endpoint: 'stocks', error: sessionErr });
        dispatch({ type: 'FETCH_ERROR', endpoint: 'etfs', error: sessionErr });
        dispatch({ type: 'FETCH_ERROR', endpoint: 'mutualFunds', error: sessionErr });
        dispatch({ type: 'FETCH_ERROR', endpoint: 'fds', error: sessionErr });
        return;
      }
      dispatch({ type: "PORTFOLIO_SUCCESS", data });
    } catch (error) {
      console.error("[API ERROR] portfolio", error);
      const sessionErr = { message: error.message || 'Failed to load portfolio' };
      dispatch({ type: 'FETCH_ERROR', endpoint: 'stocks', error: sessionErr });
      dispatch({ type: 'FETCH_ERROR', endpoint: 'etfs', error: sessionErr });
      dispatch({ type: 'FETCH_ERROR', endpoint: 'mutualFunds', error: sessionErr });
      dispatch({ type: 'FETCH_ERROR', endpoint: 'fds', error: sessionErr });
    }
  }, []);

  const fetchOverallInvestments = useCallback(() => fetchEndpoint('overallInvestments', api.getOverallInvestments), [fetchEndpoint]);
  const fetchAssetAllocation = useCallback(() => fetchEndpoint('assetAllocation', api.getAssetAllocation), [fetchEndpoint]);
  const fetchOverallSectorAllocation = useCallback(() => fetchEndpoint('overallSectorAllocation', api.getOverallSectorAllocation), [fetchEndpoint]);
  const fetchStocksAllocation = useCallback(() => fetchEndpoint('stocksAllocation', api.getStocksAllocation), [fetchEndpoint]);
  const fetchStocks = useCallback(() => fetchEndpoint('stocks', api.getStocks), [fetchEndpoint]);
  const fetchEtfs = useCallback(() => fetchEndpoint('etfs', api.getEtfs), [fetchEndpoint]);
  const fetchMutualFunds = useCallback(() => fetchEndpoint('mutualFunds', api.getMutualFunds), [fetchEndpoint]);
  const fetchFDs = useCallback(() => fetchEndpoint('fds', api.getFDs), [fetchEndpoint]);


  const refreshAll = useCallback(async () => {
    if (refreshInProgress.current) {
      return;
    }
    refreshInProgress.current = true;
    setRefreshing(true);
    try {
      const isSupabase = localStorage.getItem('backend_target') === 'SUPABASE' || (!localStorage.getItem('backend_target') && import.meta.env.VITE_BACKEND_TARGET === 'SUPABASE');
      const promises = [
        fetchDashboard(),
        fetchPortfolio(),
      ];

      if (isSupabase) {
        promises.push(
          api.getNews().then(newsData => {
            if (Array.isArray(newsData)) {
              dispatch({ type: 'NEWS_PREFETCH_SUCCESS', data: newsData });
            }
          }).catch(e => console.warn('[Prefetch] News failed silently:', e?.message))
        );
      }

      await Promise.all(promises);
    } finally {
      refreshInProgress.current = false;
      setRefreshing(false);
    }
  }, [fetchDashboard, fetchPortfolio]);

  const refreshLiveHoldings = useCallback(async () => {
    if (!isIndianMarketOpen()) return;
    if (liveRefreshInFlight.current) return;
    liveRefreshInFlight.current = true;
    try {
      await refreshAll();
    } finally {
      liveRefreshInFlight.current = false;
    }
  }, [refreshAll]);


  const executeHoldingAction = useCallback(async (apiFn, payload) => {
    try {
      const result = await apiFn(payload);
      refreshAll().catch((error) => {
        console.error("Background refresh failed:", error);
      });
      return result;
    } catch (error) {
      console.error("Save failed:", error);
      throw error;
    }
  }, [refreshAll]);

  const buyMore = useCallback((payload) => executeHoldingAction(api.buyMore, payload), [executeHoldingAction]);
  const updateHolding = useCallback((payload) => executeHoldingAction(api.updateHolding, payload), [executeHoldingAction]);
  const sellHolding = useCallback((payload) => executeHoldingAction(api.sellHolding, payload), [executeHoldingAction]);
  const addHolding = useCallback((payload) => executeHoldingAction(api.addHolding, payload), [executeHoldingAction]);
  const updateFD = useCallback((payload) => executeHoldingAction(api.updateFD, payload), [executeHoldingAction]);
  const deleteFD = useCallback((payload) => executeHoldingAction(api.deleteFD, payload), [executeHoldingAction]);

  // ── Prefetch main news (fired 2s after startup load) ─────────────
  const prefetchSecondaryData = useCallback((portfolioData) => {
    // portfolioData is the current state snapshot at prefetch time
    const isSupabase = localStorage.getItem('backend_target') === 'SUPABASE' || (!localStorage.getItem('backend_target') && import.meta.env.VITE_BACKEND_TARGET === 'SUPABASE');

    setTimeout(async () => {
      // 1. Prefetch main news (fire-and-forget) - ONLY for GAS
      if (!isSupabase) {
        try {
          const newsData = await api.getNews();
          if (Array.isArray(newsData)) {
            dispatch({ type: 'NEWS_PREFETCH_SUCCESS', data: newsData });
          }
        } catch (e) {
          console.warn('[Prefetch] News failed silently:', e?.message);
        }
      }

      // 2. Prefetch news for every stock + ETF symbol in parallel
      const stockSymbols = (portfolioData?.stocks?.data || []).map((s) => s.symbol).filter(Boolean);
      const etfSymbols  = (portfolioData?.etfs?.data  || []).map((e) => e.symbol).filter(Boolean);
      const allSymbols  = [...new Set([...stockSymbols, ...etfSymbols])]
        .map((s) => s.replace(/^[^:]+:/, '')); // strip NSE:/BSE: prefix

      await Promise.allSettled(
        allSymbols.map(async (symbol) => {
          try {
            const stockNews = await api.getStockNews(symbol);
            if (Array.isArray(stockNews)) {
              dispatch({ type: 'STOCK_NEWS_PREFETCH_SUCCESS', symbol, data: stockNews });
            }
          } catch (e) {
            console.warn(`[Prefetch] News for ${symbol} failed:`, e?.message);
          }
        })
      );
    }, PREFETCH_DELAY_MS);
  }, []);

  useEffect(() => {
    let intervalId;
    let cancelled = false;

    refreshAll().then(() => {
      if (!cancelled) {
        // Kick off prefetch of news + company docs after primary data is loaded
        prefetchSecondaryData(state);
        intervalId = window.setInterval(refreshLiveHoldings, LIVE_REFRESH_INTERVAL_MS);
      }
    }).catch(() => {
      if (!cancelled) {
        intervalId = window.setInterval(refreshLiveHoldings, LIVE_REFRESH_INTERVAL_MS);
      }
    });

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Optimized Cache Sync
  useEffect(() => {
    const hasData =
      state.overallInvestments.data ||
      state.assetAllocation.data ||
      state.overallSectorAllocation.data ||
      state.stocksAllocation.data ||
      state.todayPerformance.data ||
      state.stocks.data ||
      state.etfs.data ||
      state.mutualFunds.data ||
      state.fds.data;

    if (!hasData) return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Unable to cache portfolio", e);
    }
  }, [state.lastUpdated]);

  const value = {
    state,
    refreshing,
    fetchDashboard,
    fetchPortfolio,
    fetchOverallInvestments,
    fetchAssetAllocation,
    fetchOverallSectorAllocation,
    fetchStocksAllocation,
    fetchStocks,
    fetchEtfs,
    fetchMutualFunds,
    fetchFDs,
    refreshLiveHoldings,
    refreshAll,
    buyMore,
    updateHolding,
    sellHolding,
    addHolding,
    updateFD,
    deleteFD,
    // Prefetched secondary data
    prefetchedNews: state.news,
    prefetchedStockNews: state.stockNews,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}