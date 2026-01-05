import { request } from '../../../lib/http';
import type { Cliente } from '../hooks/useClientes';

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

export async function getAllClientes(token?: string): Promise<Cliente[]> {
  return request<Cliente[]>('/clientes', {}, token);
}
