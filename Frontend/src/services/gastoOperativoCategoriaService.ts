import { request } from '../lib/http';

export interface GastoOperativoCategoria {
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
}

export const listCategorias = async (token?: string): Promise<GastoOperativoCategoria[]> => {
  return request<GastoOperativoCategoria[]>('/gasto-operativo/categorias', {}, token);
};

export const listCategoriasActivas = async (token?: string): Promise<GastoOperativoCategoria[]> => {
  return request<GastoOperativoCategoria[]>('/gasto-operativo/categorias/activas', {}, token);
};

export const getCategoriaById = async (id: number, token?: string): Promise<GastoOperativoCategoria> => {
  return request<GastoOperativoCategoria>(`/gasto-operativo/categorias/${id}`, {}, token);
};

export const createCategoria = async (data: CreateCategoriaDto, token?: string): Promise<GastoOperativoCategoria> => {
  return request<GastoOperativoCategoria>('/gasto-operativo/categorias', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const updateCategoria = async (id: number, data: Partial<CreateCategoriaDto>, token?: string): Promise<GastoOperativoCategoria> => {
  return request<GastoOperativoCategoria>(`/gasto-operativo/categorias/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, token);
};

export const deleteCategoria = async (id: number, token?: string): Promise<void> => {
  return request<void>(`/gasto-operativo/categorias/${id}`, {
    method: 'DELETE',
  }, token);
};
