import { handleLocalRequest } from './localApi';
import { getSession, encodeSessionToken } from './dataStore';

type RequestConfig = {
  url?: string;
  method?: string;
  data?: unknown;
  headers?: Record<string, string>;
  _retry?: boolean;
};

type ApiResponse<T = unknown> = {
  data: T;
  status: number;
  config: RequestConfig;
};

function normalizePath(url: string): string {
  const path = url.replace(/^\/api/, '');
  return path.startsWith('/') ? path : `/${path}`;
}

async function rawRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
  const path = normalizePath(config.url || '/');
  const method = (config.method || 'GET').toUpperCase();
  const authHeader =
    config.headers?.Authorization ||
    (typeof api.defaults.headers.common['Authorization'] === 'string'
      ? (api.defaults.headers.common['Authorization'] as string)
      : undefined);

  const { status, data } = await handleLocalRequest(method, path, config.data, authHeader);

  if (status >= 400) {
    const error = new Error((data as { error?: string })?.error || 'Request failed') as Error & {
      response?: { status: number; data: unknown };
      config: RequestConfig;
    };
    error.response = { status, data };
    error.config = config;
    throw error;
  }

  return { data: data as T, status, config };
}

let refreshing = false;
let queue: Array<() => void> = [];

async function executeRequest<T>(config: RequestConfig): Promise<{ data: T; status: number }> {
  try {
    const res = await rawRequest<T>(config);
    return { data: res.data, status: res.status };
  } catch (error) {
    const err = error as Error & { response?: { status: number }; config?: RequestConfig };

    if (
      err.response?.status === 401 &&
      err.config &&
      !err.config._retry &&
      !err.config.url?.includes('/auth/')
    ) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push(() => {
            executeRequest<T>(err.config!).then(resolve).catch(reject);
          });
        });
      }

      err.config._retry = true;
      refreshing = true;

      try {
        const { data } = await rawRequest<{ token: string }>({ url: '/auth/refresh', method: 'POST' });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        err.config.headers = {
          ...err.config.headers,
          Authorization: `Bearer ${data.token}`,
        };
        queue.forEach((cb) => cb());
        queue = [];
        return executeRequest<T>(err.config);
      } catch (refreshErr) {
        queue = [];
        window.location.href = '/login';
        throw refreshErr;
      } finally {
        refreshing = false;
      }
    }

    throw error;
  }
}

const api = {
  defaults: {
    headers: {
      common: {} as Record<string, string>,
    },
  },

  get<T>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>) {
    return executeRequest<T>({ ...config, url, method: 'GET' });
  },

  post<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) {
    return executeRequest<T>({ ...config, url, method: 'POST', data });
  },

  put<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) {
    return executeRequest<T>({ ...config, url, method: 'PUT', data });
  },

  delete<T>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>) {
    return executeRequest<T>({ ...config, url, method: 'DELETE' });
  },

  interceptors: {
    response: {
      use: (_onFulfilled: unknown, _onRejected: unknown) => {
        // Kept for compatibility with previous axios-based setup
      },
    },
  },
};

const existingSession = getSession();
if (existingSession) {
  api.defaults.headers.common['Authorization'] = `Bearer ${encodeSessionToken(existingSession)}`;
}

export default api;
