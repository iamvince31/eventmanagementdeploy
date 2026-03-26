import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 60000, // 60 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Configure concurrency limits
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const requestQueue = [];

// Helper to run the next queued request
const processQueue = () => {
  if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    const nextFn = requestQueue.shift();
    nextFn();
  }
};

// Request Interceptor: Add token + Queueing logic
api.interceptors.request.use((config) => {
  return new Promise((resolve) => {
    const executeRequest = () => {
      // Add Authorization Token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(config);
    };

    // If we have room, execute immediately
    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      activeRequests++;
      executeRequest();
    } else {
      // Otherwise, queue it up
      requestQueue.push(executeRequest);
    }
  });
});

// Response Interceptor: Decrement active requests & unqueue next
api.interceptors.response.use(
  (response) => {
    activeRequests--;
    processQueue();
    return response;
  },
  (error) => {
    activeRequests--;
    processQueue();

    // Original error handling logic
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('Request timeout:', error);
      return Promise.reject(new Error('Request timed out. Please check your connection and try again.'));
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('lastActivity');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
