/**
 * Real API Client
 * Google Apps Script API Client
 */
import { mockApi } from './mockClient.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT_MS = 10000;

const TOKEN_KEY = "sessionToken";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}
/**
 * -----------------------------------------
 * GET Request
 * -----------------------------------------
 */
async function apiFetch(action) {
  const separator = BASE_URL.includes("?") ? "&" : "?";
  const token = getToken();
  const url =
  `${BASE_URL}${separator}action=${encodeURIComponent(action)}&token=${encodeURIComponent(token || "")}&_=${Date.now()}`;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      mode: "cors",
      redirect: "follow",
      cache: "no-store"
    });

    clearTimeout(timer);

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (
  json.error &&
  String(json.error).includes("Unauthorized")
) {

  logout();

  window.location.reload();

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
async function apiPost(body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
    const json = await res.json();

    // Handle expired session
    if (json.error && String(json.error).includes("Unauthorized")) {
      logout();
      throw new Error("Session expired");
    }

    if (!res.ok) {
      throw {
        endpoint: body.action,
        status: res.status,
        message: res.statusText
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

  login: async (password) => {
  const data = await apiPost({
    action: "login",
    password
  });
  setToken(data.token);
  return data;
},

  buyMore: (payload) => apiPost({ action: "buyMore", ...payload }),
  updateHolding: (payload) => apiPost({ action: "updateHolding", ...payload }),
  sellHolding: (payload) => apiPost({ action: "sellHolding", ...payload }),
  addHolding: (payload) => apiPost({ action: "addHolding", ...payload }),
  updateFD: (payload) => apiPost({ action: "updateFD", ...payload }),
  deleteFD: (payload) => apiPost({ action: "deleteFD", ...payload }),
};

export const api = import.meta.env.VITE_USE_MOCK === "true" ? mockApi : realApi;

export function isLoggedIn() {
  return !!getToken();
}