import { request } from '../lib/http';
import type { Ruta, RutaFormData, EstadoRuta } from '../pages/rutas/types';

// Helper para convertir fecha YYYY-MM-DD a ISO con hora local (mediodía para evitar cambios de día)
const normalizarFechaParaEnvio = (fecha: string): string => {
  if (!fecha) return fecha;
  // Si ya tiene hora, devolverla tal cual
  if (fecha.includes('T')) return fecha;
  // Si es solo fecha (YYYY-MM-DD), agregar hora del mediodía local para evitar cambios de zona horaria
  return `${fecha}T12:00:00`;
};

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
  // Normalizar la fecha antes de enviar
  const dataToSend = {
    ...rutaData,
    dia_visita: normalizarFechaParaEnvio(rutaData.dia_visita)
  };
  
  return await request<Ruta>(
    '/ruta',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    },
    token
  );
};

export const updateRuta = async (id: number, rutaData: Partial<RutaFormData>, token?: string): Promise<Ruta> => {
  // Normalizar la fecha antes de enviar si existe
  const dataToSend: any = {};
  
  if (rutaData.cliente_id !== undefined) {
    dataToSend.cliente_id = rutaData.cliente_id;
  }
  
  if (rutaData.collaborator_id !== undefined) {
    dataToSend.collaborator_id = rutaData.collaborator_id;
  }
  
  if (rutaData.dia_visita) {
    dataToSend.dia_visita = normalizarFechaParaEnvio(rutaData.dia_visita);
  }
  
  if (rutaData.estado !== undefined) {
    dataToSend.estado = rutaData.estado;
  }
  
  if (rutaData.observaciones !== undefined) {
    dataToSend.observaciones = rutaData.observaciones;
  }
  
  return await request<Ruta>(
    `/ruta/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
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
