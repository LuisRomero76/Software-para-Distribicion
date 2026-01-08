import { request } from '../lib/http'

export type TipoIngreso = 'VENTA' | 'COMPRA' | 'PRESTAMO' | 'DEVOLUCION' | 'OTRO'

export interface IngresoCategoria {
  categoria_id: number
  nombre: string
  descripcion?: string
  createdAt: string
  updatedAt: string
}

export interface Ingreso {
  ingreso_id: number
  tipo: TipoIngreso
  categoria_id?: number | null
  descripcion: string
  monto: number
  referencia_id?: number | null
  createdAt: string
  updatedAt: string
  categoriaRelacion?: IngresoCategoria | null
}

export interface CreateIngresoInput {
  tipo?: TipoIngreso
  categoria_id?: number | null
  descripcion: string
  monto: number
  referencia_id?: number | null
}

export interface CreateIngresoCategoriaInput {
  nombre: string
  descripcion?: string
}

export const getAllIngresos = async (token?: string): Promise<Ingreso[]> => {
  return request<Ingreso[]>('/ingreso', {}, token)
}

export const createIngreso = async (data: CreateIngresoInput, token?: string): Promise<Ingreso> => {
  return request<Ingreso>(
    '/ingreso',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    token
  )
}

export const updateIngreso = async (id: number, data: Partial<CreateIngresoInput>, token?: string): Promise<Ingreso> => {
  return request<Ingreso>(
    `/ingreso/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    token
  )
}

export const deleteIngreso = async (id: number, token?: string): Promise<void> => {
  return request<void>(
    `/ingreso/${id}`,
    {
      method: 'DELETE'
    },
    token
  )
}

// Categorías de Ingresos
export const listIngresoCategorias = async (token?: string): Promise<IngresoCategoria[]> => {
  return request<IngresoCategoria[]>('/ingreso/categorias', {}, token)
}

export const listIngresoCategoriaActivas = async (token?: string): Promise<IngresoCategoria[]> => {
  return request<IngresoCategoria[]>('/ingreso/categorias/activas', {}, token)
}

export const createIngresoCategoria = async (data: CreateIngresoCategoriaInput, token?: string): Promise<IngresoCategoria> => {
  return request<IngresoCategoria>(
    '/ingreso/categorias',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    token
  )
}

export const updateIngresoCategoria = async (id: number, data: Partial<CreateIngresoCategoriaInput>, token?: string): Promise<IngresoCategoria> => {
  return request<IngresoCategoria>(
    `/ingreso/categorias/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    token
  )
}

export const deleteIngresoCategoria = async (id: number, token?: string): Promise<void> => {
  return request<void>(
    `/ingreso/categorias/${id}`,
    {
      method: 'DELETE'
    },
    token
  )
}
