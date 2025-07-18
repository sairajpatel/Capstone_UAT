import axios from 'axios';

const API_URL = 'https://capstone-uat-z57k.vercel.app/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add token to headers if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For file uploads, let the browser set the Content-Type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error
    if (!error.response) {
      console.error('Network Error:', error);
      return Promise.reject({
        message: 'Network error - please check your connection',
        error
      });
    }

    // Unauthorized
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Server error
    if (error.response.status >= 500) {
      console.error('Server Error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
