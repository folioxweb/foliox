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

const LIVE_REFRESH_INTERVAL_MS = 60_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function portfolioReducer(state, action) {
  const key = ENDPOINT_TO_KEY[action.endpoint];

  switch (action.type) {
    case "DASHBOARD_SUCCESS":
  return {
    ...state,

    overallInvestments: {
      data: action.data.overallInvestments,
      loading: false,
      error: null,
    },

    assetAllocation: {
      data: action.data.assetAllocation,
      loading: false,
      error: null,
    },

    overallSectorAllocation: {
      data: action.data.overallSectorAllocation,
      loading: false,
      error: null,
    },

    stocksAllocation: {
      data: action.data.stocksAllocation,
      loading: false,
      error: null,
    },

    lastUpdated: new Date(),
  };

  case "PORTFOLIO_SUCCESS":
  return {
    ...state,

    stocks: {
      data: action.data.stocks,
      loading: false,
      error: null,
    },

    etfs: {
      data: action.data.etfs,
      loading: false,
      error: null,
    },

    mutualFunds: {
      data: action.data.mutualFunds,
      loading: false,
      error: null,
    },

    fds: {
      data: action.data.fds,
      loading: false,
      error: null,
    },

    lastUpdated: new Date(),
  };

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

  const fetchDashboard = useCallback(async () => {
  try {

    dispatch({
      type: "FETCH_START",
      endpoint: "overallInvestments"
    });

    dispatch({
      type: "FETCH_START",
      endpoint: "assetAllocation"
    });

    dispatch({
      type: "FETCH_START",
      endpoint: "overallSectorAllocation"
    });

    dispatch({
      type: "FETCH_START",
      endpoint: "stocksAllocation"
    });


    const data = await api.getDashboard();

    console.log(
      "[API] dashboard ->",
      data
    );

    dispatch({
      type: "DASHBOARD_SUCCESS",
      data
    });


  } catch (error) {

    console.error(
      "[API ERROR] dashboard",
      error
    );

  }
}, []);

const fetchPortfolio = useCallback(async () => {
  try {

    dispatch({
      type: "FETCH_START",
      endpoint: "stocks"
    });

    dispatch({
      type: "FETCH_START",
      endpoint: "etfs"
    });

    dispatch({
      type: "FETCH_START",
      endpoint: "mutualFunds"
    });

    dispatch({
      type: "FETCH_START",
      endpoint: "fds"
    });


    const data = await api.getPortfolio();


    console.log(
      "[API] portfolio ->",
      data
    );


    dispatch({
      type: "PORTFOLIO_SUCCESS",
      data
    });


  } catch (error) {

    console.error(
      "[API ERROR] portfolio",
      error
    );

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

  // avoid duplicate refresh
  if (liveRefreshInFlight.current) return;


  liveRefreshInFlight.current = true;

  try {

    // refresh complete dashboard
    await fetchDashboard();


    // small gap to avoid Apps Script pressure
    await sleep(1000);


    // refresh complete portfolio
    await fetchPortfolio();


  } finally {

    liveRefreshInFlight.current = false;

  }

}, [
  fetchDashboard,
  fetchPortfolio
]);

  const refreshAll = useCallback(async () => {

  // dashboard single API
  await fetchDashboard();


  // wait before portfolio APIs
  await sleep(2000);


  await fetchPortfolio();


}, [
  fetchDashboard,
  fetchPortfolio,
]);


  const executeHoldingAction = useCallback(
  async (apiFn, payload) => {

    try {

      // 1. Execute POST action
      // buy / sell / update / add
      const result = await apiFn(payload);


      // 2. Refresh data in background
      // Do not block save success
      refreshAll().catch((error) => {

        console.error(
          "Background refresh failed:",
          error
        );

      });


      // 3. Return success immediately
      return result;


    } catch (error) {

      // Only actual save failure reaches here
      console.error(
        "Save failed:",
        error
      );

      throw error;

    }

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

  const updateFD = useCallback(
    (payload) =>
      executeHoldingAction(
        api.updateFD,
        payload
      ),
    [executeHoldingAction]
  );

  const deleteFD = useCallback(
    (payload) =>
      executeHoldingAction(
        api.deleteFD,
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