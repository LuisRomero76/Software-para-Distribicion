import { request } from '../lib/http'

export type CategoriaGasto = 'COMBUSTIBLE' | 'MANTENIMIENTO' | 'GENERAL'

export interface GastoOperativo {
  gasto_id: number
  categoria?: CategoriaGasto
  categoria_id?: number
  descripcion: string
  monto: number
  vehiculo_id?: number | null
  createdAt: string
  vehiculo?: {
    vehicle_id: number
    placa?: string
    modelo?: string
  } | null
  categoriaRelacion?: {
    categoria_id: number
    nombre: string
    descripcion?: string
  } | null
}

export interface CreateGastoOperativoInput {
  categoria?: CategoriaGasto
  categoria_id?: number
  descripcion: string
  monto: number
  vehiculo_id?: number | null
}

export const getAllGastosOperativos = async (token?: string): Promise<GastoOperativo[]> => {
  return request<GastoOperativo[]>('/gasto-operativo', {}, token)
}

export const createGastoOperativo = async (data: CreateGastoOperativoInput, token?: string): Promise<GastoOperativo> => {
  return request<GastoOperativo>(
    '/gasto-operativo',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    token
  )
}

export const updateGastoOperativo = async (id: number, data: Partial<CreateGastoOperativoInput>, token?: string): Promise<GastoOperativo> => {
  return request<GastoOperativo>(
    `/gasto-operativo/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    token
  )
}
