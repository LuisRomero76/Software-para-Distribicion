import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPatch } from '../services/api';

export interface TelefonoReferencia {
  telefono_referencia_id?: number;
  numero: string;
  nombre_contacto?: string;
}

export interface Cliente {
  cliente_id: number;
  sub_canal: string;
  visita?: string;
  nit_ci?: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  coordenadas?: string;
  telefono?: string;
  dia_visita?: string;
  preventista_id?: number;
  preventista?: { collaborator_id: number; nombre: string; apellido: string; rol: string };
  telefonos_referencia: TelefonoReferencia[];
}

export interface CreateClientePayload {
  sub_canal: string;
  visita?: string;
  nit_ci?: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  coordenadas?: string;
  telefono?: string;
  dia_visita?: string;
  preventista_id: number;
  telefonos_referencia?: TelefonoReferencia[];
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Cliente[]>('/clientes');
      setClientes(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createCliente = async (payload: CreateClientePayload) => {
    await apiPost<Cliente>('/clientes', payload);
    await fetchClientes();
  };

  const deleteCliente = async (id: number) => {
    await apiDelete(`/clientes/${id}`);
    await fetchClientes();
  };

  const updateCliente = async (id: number, payload: Partial<CreateClientePayload>) => {
    // Saneamos nit_ci por si llega como string o vacío
    const body: any = { ...payload };
    if (Object.prototype.hasOwnProperty.call(body, 'nit_ci')) {
      const v = body.nit_ci as any;
      if (v === undefined || v === null || v === '') {
        delete body.nit_ci;
      } else {
        const parsed = typeof v === 'string' ? parseInt(v, 10) : v;
        if (Number.isNaN(parsed)) {
          delete body.nit_ci;
        } else {
          body.nit_ci = parsed;
        }
      }
    }
    
    // Asegurar que preventista_id sea un número válido si está presente
    if (Object.prototype.hasOwnProperty.call(body, 'preventista_id')) {
      const v = body.preventista_id;
      if (v !== undefined && v !== null) {
        const parsed = typeof v === 'string' ? parseInt(v, 10) : v;
        if (Number.isNaN(parsed) || parsed <= 0) {
          throw new Error('El ID del preventista no es válido');
        }
        body.preventista_id = parsed;
      }
    }
    
    const clienteActualizado = await apiPatch(`/clientes/${id}`, body);
    await fetchClientes();
    return clienteActualizado;
  };

  useEffect(() => { fetchClientes(); }, []);

  return { clientes, loading, error, fetchClientes, createCliente, updateCliente, deleteCliente };
}
