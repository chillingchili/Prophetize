const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  path: string;

  constructor(message: string, status: number, path: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
  }
}

export const getStoredAdminToken = () => localStorage.getItem('admin_access_token') || '';

export const setStoredAdminToken = (token: string) => {
  const normalized = token.trim();
  if (!normalized) {
    localStorage.removeItem('admin_access_token');
    return;
  }
  localStorage.setItem('admin_access_token', normalized);
};

export const getApiBaseUrl = () => baseUrl;

let _clearAuth: (() => void) | null = null;
export const registerClearAuth = (fn: () => void) => { _clearAuth = fn; };

const buildHeaders = () => {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const parseErrorMessage = async (response: Response) => {
  const bodyText = await response.text();
  if (!bodyText) return `Request failed (${response.status})`;
  try {
    const payload = JSON.parse(bodyText) as { error?: string; message?: string };
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  } catch { /* ignore */ }
  return bodyText.slice(0, 180);
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const doRequest = () => fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...buildHeaders(), ...(options?.headers ?? {}) },
  });

  const response = await doRequest();

  if (!response.ok) {
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${baseUrl}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json() as { access_token: string };
            localStorage.setItem('admin_access_token', data.access_token);
            const retried = await doRequest();
            if (retried.ok) return retried.json() as Promise<T>;
            const msg = await parseErrorMessage(retried);
            throw new ApiError(msg, retried.status, path);
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
      _clearAuth?.();
      throw new ApiError('Session expired. Please log in again.', 401, path);
    }
    const message = await parseErrorMessage(response);
    throw new ApiError(message || 'Request failed', response.status, path);
  }

  return response.json() as Promise<T>;
};

export const apiGet = async <T>(path: string): Promise<T> => request<T>(path);

export const apiPost = async <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
