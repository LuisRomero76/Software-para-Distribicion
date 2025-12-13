import { request } from '../../../lib/http';

export async function apiGet<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'GET' });
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(url: string, body: any): Promise<T> {
  return request<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' });
}
