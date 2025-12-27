export const API_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const STORAGE_KEY = 'gv_auth';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw);
    return auth?.token ?? null;
  } catch {
    return null;
  }
}

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  
  // Si no se pasa un token explícitamente, obtenerlo del localStorage
  const authToken = token ?? getToken();
  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let message: unknown = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      message = (data as any)?.message ?? message;
    } catch {}
    throw new Error(Array.isArray(message) ? message.join(', ') : String(message));
  }

  if (res.status === 204) return undefined as unknown as T;
  
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as unknown as T;
  }
  
  return (await res.json()) as T;
}
