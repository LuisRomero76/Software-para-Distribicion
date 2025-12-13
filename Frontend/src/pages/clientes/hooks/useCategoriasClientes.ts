import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/api';

export interface CategoriaCliente {
  cliente_categoria_id: number;
  nombre: string;
  createdAt: string;
}

export function useCategoriasClientes() {
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const data = await apiGet<CategoriaCliente[]>('/categoria-clientes');
      setCategorias(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createCategoria = async (nombre: string) => {
    await apiPost<CategoriaCliente>('/categoria-clientes', { nombre });
    await fetchCategorias();
  };

  const updateCategoria = async (id: number, nombre: string) => {
    await apiPatch<CategoriaCliente>(`/categoria-clientes/${id}`, { nombre });
    await fetchCategorias();
  };

  const deleteCategoria = async (id: number) => {
    await apiDelete(`/categoria-clientes/${id}`);
    await fetchCategorias();
  };

  useEffect(() => { fetchCategorias(); }, []);

  return { categorias, loading, error, fetchCategorias, createCategoria, updateCategoria, deleteCategoria };
}
