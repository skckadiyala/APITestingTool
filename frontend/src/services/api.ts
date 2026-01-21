import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Construct API URL from environment variables
const getApiBaseUrl = (): string => {
  // First try VITE_API_BASE_URL
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback: construct from host and port
  const host = import.meta.env.VITE_BACKEND_HOST || 'localhost';
  const port = import.meta.env.VITE_BACKEND_PORT || '5000';
  return `http://${host}:${port}/api/v1`;
};

export const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Promise-based locking to prevent race conditions
// Only one token refresh can happen at a time
let refreshTokenPromise: Promise<string> | null = null;

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: any) => {
    const { accessToken } = useAuthStore.getState();
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.warn('No access token found in request interceptor');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // If refresh is already in progress, wait for it
        if (refreshTokenPromise) {
          console.log('[Auth] Waiting for existing token refresh...');
          const newAccessToken = await refreshTokenPromise;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }

        // Start a new refresh - store the promise to prevent race conditions
        console.log('[Auth] Starting token refresh...');
        refreshTokenPromise = (async () => {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
              response.data.data;

            setTokens({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            });

            console.log('[Auth] Token refresh successful');
            return newAccessToken;
          } finally {
            // Clear the promise when done (success or failure)
            refreshTokenPromise = null;
          }
        })();

        const newAccessToken = await refreshTokenPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('[Auth] Token refresh failed:', refreshError);
        refreshTokenPromise = null;
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
