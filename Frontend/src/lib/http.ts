export const API_BASE: string = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

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
  return (await res.json()) as T;
}
