import { useState, useCallback } from 'react';
import { getAllRutas, createRuta, updateRuta, deleteRuta } from '../../../services/rutaService';
import { getAllClientes } from '../../clientes/services/api';
import { request } from '../../../lib/http';
import type { Ruta, RutaFormData, Cliente, Colaborador } from '../types';

export const useRutas = (token?: string) => {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rutasData, clientesData, colaboradoresData] = await Promise.all([
        getAllRutas(token),
        getAllClientes(token),
        request<Colaborador[]>('/collaborator', {}, token)
      ]);

      setRutas(Array.isArray(rutasData) ? rutasData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setColaboradores(Array.isArray(colaboradoresData) ? colaboradoresData : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos');
      console.error('Error al cargar datos:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addRuta = useCallback(
    async (rutaData: RutaFormData) => {
      try {
        const created = await createRuta(rutaData, token);
        // Enriquecemos con relaciones para evitar refrescar
        const cliente = clientes.find(c => c.cliente_id === rutaData.cliente_id);
        const colaborador = colaboradores.find(c => c.collaborator_id === rutaData.collaborator_id);
        setRutas([{ ...created, cliente, colaborador }, ...rutas]);
        return created;
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo crear la ruta');
      }
    },
    [rutas, token, clientes, colaboradores]
  );

  const updateRutaData = useCallback(
    async (id: number, rutaData: Partial<RutaFormData>) => {
      try {
        const updated = await updateRuta(id, rutaData, token);
        const cliente = rutaData.cliente_id
          ? clientes.find(c => c.cliente_id === rutaData.cliente_id)
          : undefined;
        const colaborador = rutaData.collaborator_id
          ? colaboradores.find(c => c.collaborator_id === rutaData.collaborator_id)
          : undefined;

        setRutas(rutas.map(r => {
          if (r.ruta_id !== id) return r;
          return {
            ...updated,
            cliente: cliente ?? r.cliente,
            colaborador: colaborador ?? r.colaborador,
          } as Ruta;
        }));
        return updated;
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo actualizar la ruta');
      }
    },
    [rutas, token, clientes, colaboradores]
  );

  const deleteRutaData = useCallback(
    async (id: number) => {
      try {
        await deleteRuta(id, token);
        setRutas(rutas.filter(r => r.ruta_id !== id));
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo eliminar la ruta');
      }
    },
    [rutas, token]
  );

  return {
    rutas,
    clientes,
    colaboradores,
    loading,
    error,
    loadData,
    addRuta,
    updateRuta: updateRutaData,
    deleteRuta: deleteRutaData,
    setRutas
  };
};
