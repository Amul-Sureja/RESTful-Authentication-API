import axios from 'axios';

// Uses Vite proxy — no hardcoded localhost:3000 needed
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Auto-attach accessToken to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.get('/api/auth/refreshToken', { withCredentials: true });
        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Call this once on app startup.
 * If an accessToken exists but may be stale, silently refresh it via the
 * httpOnly refreshToken cookie.  If the cookie is missing/expired the user
 * is quietly logged out so they start from a clean state.
 */
export async function initAuth() {
  const token = localStorage.getItem('accessToken');

  // Nothing stored — user is not logged in, nothing to do.
  if (!token) return;

  try {
    // Try to get a fresh access token using the httpOnly refresh cookie.
    const res = await axios.get('/api/auth/refreshToken', { withCredentials: true });
    const { accessToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
  } catch {
    // Refresh cookie is gone / expired — clear local state so the app
    // doesn't think the user is still logged in.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
}

export default api;