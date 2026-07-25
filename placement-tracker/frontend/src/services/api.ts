import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly cookies (refresh token)
  timeout: 10000,
});

// Response interceptor: on 401, try refresh then retry once
let refreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      refreshing = true;

      try {
        const { data } = await api.post<{ token: string }>('/auth/refresh');
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        queue.forEach((cb) => cb());
        queue = [];
        return api(originalRequest);
      } catch {
        queue = [];
        window.location.href = '/login';
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
