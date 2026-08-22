/**
 * Real API Client
 * Google Apps Script API Client
 */

import { mockApi } from './mockClient.js';
import { supabaseApi } from './supabaseClient.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT_MS = 10000;

const TOKEN_KEY = "sessionToken";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  logoutInProgress = false;
  localStorage.setItem(TOKEN_KEY, token);
}

let logoutInProgress = false;

export function logout(message = null) {

  if (logoutInProgress) return;

  logoutInProgress = true;

  localStorage.removeItem(TOKEN_KEY);

  if (message) {
    sessionStorage.setItem("logoutMessage", message);
  }

  window.dispatchEvent(new Event("app-logout"));
}
/**
 * -----------------------------------------
 * GET Request
 * -----------------------------------------
 */
async function apiFetch(action, extraParams = {}, timeoutMs = TIMEOUT_MS) {
  const separator = BASE_URL.includes("?") ? "&" : "?";
  const token = getToken();
  // Build extra query params (e.g. symbol=, limit=)
  const extras = Object.entries(extraParams)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('');
  const url =
  `${BASE_URL}${separator}action=${encodeURIComponent(action)}${extras}&token=${encodeURIComponent(token || "")}&_=${Date.now()}`;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      mode: "cors",
      redirect: "follow",
      cache: "no-store"
    });

    clearTimeout(timer);

    if (res.status === 401 || res.status === 403) {
      logout("Your session has expired. Please sign in again.");
      return null;
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (
        json.error &&
        (String(json.error).toLowerCase().includes("unauthorized") ||
         String(json.error).toLowerCase().includes("expired") ||
         String(json.error).toLowerCase().includes("invalid token"))
      ) {
        logout("Your session has expired. Please sign in again.");
        return null;
      }

      if (!res.ok) {
        throw {
          endpoint: action,
          status: res.status,
          message: res.statusText,
          payload: json
        };
      }
      return json.data;
    }

    throw {
      endpoint: action,
      status: res.status,
      message: "Invalid JSON response"
    };

  } catch (err) {
    clearTimeout(timer);

    if (err.name === "AbortError") {
      throw {
        endpoint: action,
        status: "timeout",
        message: "Request timed out"
      };
    }

    if (err.endpoint) {
      throw err;
    }

    throw {
      endpoint: action,
      status: "network",
      message: err.message || String(err)
    };
  }
}

/**
 * -----------------------------------------
 * POST Request
 * -----------------------------------------
 */
async function apiPost(body, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Automatically attach session token
  const payload = {
    ...body,
    token: getToken()
  };

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      signal: controller.signal,
      mode: "cors",
      redirect: "follow",
      cache: "no-store",
      credentials: "omit",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(payload)
    });

    clearTimeout(timer);

    if (res.status === 401 || res.status === 403) {
      logout("Your session has expired. Please sign in again.");
      return null;
    }

    const json = await res.json();

    // Handle expired session
    if (
      json.error &&
      (String(json.error).toLowerCase().includes("unauthorized") ||
       String(json.error).toLowerCase().includes("expired") ||
       String(json.error).toLowerCase().includes("invalid token"))
    ) {
      logout("Your session has expired. Please sign in again.");
      return null;
    }

    if (!res.ok) {
      throw {
        endpoint: body.action,
        status: res.status,
        message: res.statusText,
        payload: json
      };
    }

    return json.data;

  } catch (err) {
    clearTimeout(timer);

    if (err.name === "AbortError") {
      throw {
        endpoint: body.action,
        status: "timeout",
        message: "Request timed out"
      };
    }

    if (err.endpoint) {
      throw err;
    }

    throw {
      endpoint: body.action,
      status: "network",
      message: err.message || String(err)
    };
  }
}

/**
 * -----------------------------------------
 * API
 * -----------------------------------------
 */
const realApi = {
  // Dashboard combined API
  getDashboard: () => apiFetch("dashboard"),  

  // Combined Portfolio API
  getPortfolio: () => apiFetch("portfolio"),
  getOverallInvestments: () => apiFetch("overallInvestments"),
  getAssetAllocation: () => apiFetch("assetAllocation"),
  getOverallSectorAllocation: () => apiFetch("overallSectorAllocation"),
  getStocksAllocation: () => apiFetch("stocksAllocation"),
  getStocks: () => apiFetch("stocks"),
  getEtfs: () => apiFetch("etfs"),
  getMutualFunds: () => apiFetch("mutualFunds"),
  getFDs: () => apiFetch("fds"),

  // News API
  // ?action=news                  → all latest news
  // ?action=news&limit=N          → all news, capped at N items
  // ?action=news&symbol=SYMBOL    → news for one stock
  getNews: (limit) => apiFetch("news", limit ? { limit } : {}, 20000),
  getStockNews: (symbol, limit) => apiFetch("news", { symbol, ...(limit ? { limit } : {}) }, 20000),

  // Company Documents API
  // ?action=companyDocuments&symbol=HDFCBANK
  getCompanyDocuments: (symbol) => apiFetch("companyDocuments", { symbol }),

  // AI Summary API — uses a 100s timeout to allow backend generation time
  summarizeDocument: (documentId) => apiPost({ action: "summarizeDocument", documentId }, 100000),

  sendVoiceQuery: (query) => apiPost({ action: "processVoiceQuery", query }, 20000),

  login: async (password) => {
  const data = await apiPost({
    action: "login",
    password
  });

  if (!data) {
    return null;
  }

  setToken(data.token);
  return data;
},

  buyMore: (payload) => apiPost({ action: "buyMore", ...payload }),
  updateHolding: (payload) => apiPost({ action: "updateHolding", ...payload }),
  sellHolding: (payload) => apiPost({ action: "sellHolding", ...payload }),
  addHolding: (payload) => apiPost({ action: "addHolding", ...payload }),
  updateFD: (payload) => apiPost({ action: "updateFD", ...payload }),
  deleteFD: (payload) => apiPost({ action: "deleteFD", ...payload }),

  // Watchlist & Paper Trading
  searchNseStocks: (query) => supabaseApi.searchNseStocks(query),
  getWatchlist: () => supabaseApi.getWatchlist(),
  addWatchlistItem: (payload) => supabaseApi.addWatchlistItem(payload),
  removeWatchlistItem: (payload) => supabaseApi.removeWatchlistItem(payload),
  getPaperPortfolio: () => supabaseApi.getPaperPortfolio(),
  addPaperHolding: (payload) => supabaseApi.addPaperHolding(payload),
  sellPaperHolding: (payload) => supabaseApi.sellPaperHolding(payload),
  updatePaperCapital: (payload) => supabaseApi.updatePaperCapital(payload),
  resetPaperPortfolio: () => supabaseApi.resetPaperPortfolio(),

  // Mainboard IPO API
  getIpos: () => supabaseApi.getIpos(),
  getIpoById: (id) => supabaseApi.getIpoById(id),
};

function getActiveApi() {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return mockApi;
  }
  
  const storedTarget = localStorage.getItem("backend_target");
  if (storedTarget === "SUPABASE") return supabaseApi;
  if (storedTarget === "GAS") return realApi;
  
  if (import.meta.env.VITE_BACKEND_TARGET === "SUPABASE") {
    return supabaseApi;
  }
  return realApi;
}

export const api = getActiveApi();

export function isLoggedIn() {
  if (getActiveApi() === supabaseApi) {
    return Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  }
  return !!getToken();
}