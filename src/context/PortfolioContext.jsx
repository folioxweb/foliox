import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/apiClient';
import { isIndianMarketOpen } from '../utils/marketHours';

function emptySlice() {
  return { data: null, loading: false, error: null };
}

const initialState = {
  overallInvestments: emptySlice(),
  assetAllocation: emptySlice(),
  overallSectorAllocation: emptySlice(),
  stocksAllocation: emptySlice(),
  stocks: emptySlice(),
  etfs: emptySlice(),
  mutualFunds: emptySlice(),
  fds: emptySlice(),
  lastUpdated: null,
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

const LIVE_REFRESH_INTERVAL_MS = 10_000;

function portfolioReducer(state, action) {
  const key = ENDPOINT_TO_KEY[action.endpoint];

  switch (action.type) {
    case 'FETCH_START':
      if (!key) return state;
      return {
        ...state,
        [key]: { ...state[key], loading: true, error: null },
      };

    case 'FETCH_SUCCESS':
      if (!key) return state;
      return {
        ...state,
        [key]: { data: action.data, loading: false, error: null },
        lastUpdated: new Date(),
      };

    case 'FETCH_ERROR':
      if (!key) return state;
      return {
        ...state,
        [key]: { ...state[key], loading: false, error: action.error },
      };

    default:
      return state;
  }
}

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);
  const liveRefreshInFlight = useRef(false);

  const fetchEndpoint = useCallback(async (endpoint, apiFn) => {
    dispatch({ type: 'FETCH_START', endpoint });
    try {
      const data = await apiFn();
      console.log(`[API] ${endpoint} ->`, data);
      dispatch({ type: 'FETCH_SUCCESS', endpoint, data });
    } catch (error) {
      console.error(`[API ERROR] ${endpoint} ->`, error);
      dispatch({ type: 'FETCH_ERROR', endpoint, error });
    }
  }, []);

  const fetchOverallInvestments = useCallback(() => fetchEndpoint('overallInvestments', api.getOverallInvestments), [fetchEndpoint]);
  const fetchAssetAllocation = useCallback(() => fetchEndpoint('assetAllocation', api.getAssetAllocation), [fetchEndpoint]);
  const fetchOverallSectorAllocation = useCallback(() => fetchEndpoint('overallSectorAllocation', api.getOverallSectorAllocation), [fetchEndpoint]);
  const fetchStocksAllocation = useCallback(() => fetchEndpoint('stocksAllocation', api.getStocksAllocation), [fetchEndpoint]);
  
  const fetchStocks = useCallback(() => fetchEndpoint('stocks', api.getStocks), [fetchEndpoint]);
  const fetchEtfs = useCallback(() => fetchEndpoint('etfs', api.getEtfs), [fetchEndpoint]);
  const fetchMutualFunds = useCallback(() => fetchEndpoint('mutualFunds', api.getMutualFunds), [fetchEndpoint]);
  const fetchFDs = useCallback(
  () => fetchEndpoint('fds', api.getFDs),
  [fetchEndpoint]
);

  // These market-sensitive datasets refresh continuously. The rest load once
  // on startup (or when the user explicitly refreshes).
  const refreshLiveHoldings = useCallback(async () => {
    // Automatic polling is limited to regular NSE market hours in IST.
    if (!isIndianMarketOpen()) return;
    if (liveRefreshInFlight.current) return;

    liveRefreshInFlight.current = true;
    try {
      await Promise.all([fetchOverallInvestments(), fetchStocks(), fetchEtfs()]);
    } finally {
      liveRefreshInFlight.current = false;
    }
  }, [fetchOverallInvestments, fetchStocks, fetchEtfs]);

  const refreshAll = useCallback(async () => {
    const endpoints = [
      { endpoint: 'overallInvestments', apiFn: api.getOverallInvestments },
      { endpoint: 'assetAllocation', apiFn: api.getAssetAllocation },
      { endpoint: 'overallSectorAllocation', apiFn: api.getOverallSectorAllocation },
      { endpoint: 'stocksAllocation', apiFn: api.getStocksAllocation },
      { endpoint: 'stocks', apiFn: api.getStocks },
      { endpoint: 'etfs', apiFn: api.getEtfs },
      { endpoint: 'mutualFunds', apiFn: api.getMutualFunds },
      {
  endpoint: 'fds',
  apiFn: api.getFDs
},
    ];

    endpoints.forEach(({ endpoint }) =>
      dispatch({ type: 'FETCH_START', endpoint })
    );

    const results = await Promise.allSettled(
      endpoints.map(({ apiFn }) => apiFn())
    );

    results.forEach((result, i) => {
      const { endpoint } = endpoints[i];
      if (result.status === 'fulfilled') {
        dispatch({ type: 'FETCH_SUCCESS', endpoint, data: result.value });
      } else {
        dispatch({ type: 'FETCH_ERROR', endpoint, error: result.reason });
      }
    });
  }, []);

  const executeHoldingAction = useCallback(
  async (apiFn, payload) => {
    const result = await apiFn(payload);
    await refreshAll();
    return result;
  },
  [refreshAll]
);

const buyMore = useCallback(
  (payload) =>
    executeHoldingAction(
      api.buyMore,
      payload
    ),
  [executeHoldingAction]
);
const updateHolding = useCallback(
  (payload) =>
    executeHoldingAction(
      api.updateHolding,
      payload
    ),
  [executeHoldingAction]
);

const sellHolding = useCallback(
  (payload) =>
    executeHoldingAction(
      api.sellHolding,
      payload
    ),
  [executeHoldingAction]
);

const addHolding = useCallback(
  (payload) =>
    executeHoldingAction(
      api.addHolding,
      payload
    ),
  [executeHoldingAction]
);

  useEffect(() => {
    let intervalId;
    let cancelled = false;

    // Load the complete dashboard once, then poll live market-sensitive data.
    // Starting the interval after the initial request avoids overlapping the
    // first full load with the first live refresh.
    refreshAll().finally(() => {
      if (!cancelled) {
        intervalId = window.setInterval(refreshLiveHoldings, LIVE_REFRESH_INTERVAL_MS);
      }
    });

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [refreshAll, refreshLiveHoldings]);

  const value = {
  state,
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
  addHolding
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
