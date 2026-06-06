import { supabase } from './supabase';

const API_BASE = 'http://localhost:8000/api';

const reqCache = new Map();

export const clearApiCache = () => {
  reqCache.clear();
};

/**
 * Core fetch wrapper that automatically attaches the user's Supabase JWT
 * to the Authorization header for FastAPI endpoints.
 * Includes a simple 5-minute client-side cache for GET requests to prevent slow tab switching.
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('No active session. Please log in.');
  }

  const token = session.access_token;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `${endpoint}`;

  if (isGet && reqCache.has(cacheKey)) {
    const cached = reqCache.get(cacheKey);
    // 5 minute cache expiration
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  
  if (isGet) {
    reqCache.set(cacheKey, { timestamp: Date.now(), data });
  }

  return data;
};

export const dashboardApi = {
  getKPIs: (handle) => fetchWithAuth(`/dashboard/${handle}`),
  getAnalytics: (handle) => fetchWithAuth(`/analytics/${handle}`),
  getUpsolveQueue: (handle) => fetchWithAuth(`/upsolve/${handle}`),
};

export const contestApi = {
  getContests: (handle) => fetchWithAuth(`/contests/${handle}`),
  getContestDetail: (handle, contestId) => fetchWithAuth(`/contests/${handle}/${contestId}`),
};

export const userApi = {
  refreshData: async (handle) => {
    const res = await fetchWithAuth(`/user/${handle}/refresh`, { method: 'POST' });
    reqCache.clear(); // Invalidate all cached data after a sync
    return res;
  },
};

export const settingsApi = {
  getSettings: (handle) => fetchWithAuth(`/settings/${handle}`),
  updateSettings: (handle, data) => fetchWithAuth(`/settings/${handle}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const notifyApi = {
  triggerReminder: (handle, contestId) => fetchWithAuth(`/notify/${handle}?contest_id=${contestId}`, { method: 'POST' }),
};
