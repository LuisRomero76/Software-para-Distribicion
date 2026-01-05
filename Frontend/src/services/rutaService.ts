import { request } from '../lib/http';
import type { Ruta, RutaFormData, EstadoRuta } from '../pages/rutas/types';

export const getAllRutas = async (token?: string): Promise<Ruta[]> => {
  return await request<Ruta[]>('/ruta', {}, token);
};

export const getRutaById = async (id: number, token?: string): Promise<Ruta> => {
  return await request<Ruta>(`/ruta/${id}`, {}, token);
};

export const getRutasByColaborador = async (collaboratorId: number, token?: string): Promise<Ruta[]> => {
  return await request<Ruta[]>(`/ruta/colaborador/${collaboratorId}`, {}, token);
};

export const getRutasByCliente = async (clienteId: number, token?: string): Promise<Ruta[]> => {
  return await request<Ruta[]>(`/ruta/cliente/${clienteId}`, {}, token);
};

export const getRutasByFecha = async (fecha: string, token?: string): Promise<Ruta[]> => {
  return await request<Ruta[]>(`/ruta/fecha/${fecha}`, {}, token);
};

export const getRutasByEstado = async (estado: EstadoRuta, token?: string): Promise<Ruta[]> => {
  return await request<Ruta[]>(`/ruta/estado/${estado}`, {}, token);
};

export const createRuta = async (rutaData: RutaFormData, token?: string): Promise<Ruta> => {
  return await request<Ruta>(
    '/ruta',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rutaData)
    },
    token
  );
};

export const updateRuta = async (id: number, rutaData: Partial<RutaFormData>, token?: string): Promise<Ruta> => {
  return await request<Ruta>(
    `/ruta/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rutaData)
    },
    token
  );
};

export const cambiarEstadoRuta = async (id: number, estado: EstadoRuta, token?: string): Promise<Ruta> => {
  return await request<Ruta>(
    `/ruta/${id}/estado`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    },
    token
  );
};

export const deleteRuta = async (id: number, token?: string): Promise<void> => {
  await request(`/ruta/${id}`, { method: 'DELETE' }, token);
};
