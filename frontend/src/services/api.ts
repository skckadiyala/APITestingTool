import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for adding auth tokens later)
apiClient.interceptors.request.use(
  (config) => {
    // Will add JWT token here when authentication is implemented
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for handling errors globally)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
    } else if (error.request) {
      // Request made but no response
    } else {
      // Something else happened
    }
    return Promise.reject(error);
  }
);

export default apiClient;
