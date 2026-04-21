import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devdeck_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('devdeck_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('devdeck_token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/';
      }
    } else if (err.response?.status === 401 && !original._retry) {
      // User deleted from DB or invalid token -> hard logout immediately
      localStorage.removeItem('devdeck_token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
