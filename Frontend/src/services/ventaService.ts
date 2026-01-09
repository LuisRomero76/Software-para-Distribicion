import { request } from '../lib/http';

export interface Cliente {
    cliente_id: number;
    nombre: string;
    nit_ci?: number;
    direccion?: string;
    telefono?: string;
    ciudad?: string;
}

export interface Lote {
    lote_id: number;
    product_id: number;
    cantidad_actual: number;
    costo_unitario: number;
    fecha_vencimiento?: string;
    producto?: {
        product_id: number;
        nombre: string;
        precio: number;
    };
}

export interface DetalleVenta {
    detalle_venta_id?: number;
    venta_id?: number;
    lote_id: number;
    lote?: Lote;
    cantidad: number;
    precio_venta_real: number;
    subtotal?: number;
}

export interface Venta {
    venta_id: number;
    cliente_id?: number;
    cliente?: Cliente;
    fecha_venta: string;
    tipo_venta: 'CONTADO' | 'CREDITO';
    total: number;
    observaciones?: string;
    detalles?: DetalleVenta[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateVentaDto {
    cliente_id?: number;
    fecha_venta?: string;
    tipo_venta?: 'CONTADO' | 'CREDITO';
    observaciones?: string;
    detalles: Array<{
        lote_id: number;
        cantidad: number;
    }>;
}

export interface UpdateVentaDto {
    cliente_id?: number;
    fecha_venta?: string;
    tipo_venta?: 'CONTADO' | 'CREDITO';
    observaciones?: string;
}

// Venta Services
export const getAllVentas = async (token?: string): Promise<Venta[]> => {
    return request<Venta[]>('/venta', {}, token);
};

export const getVentaById = async (id: number, token?: string): Promise<Venta> => {
    return request<Venta>(`/venta/${id}`, {}, token);
};

export const createVenta = async (data: CreateVentaDto, token?: string): Promise<Venta> => {
    return request<Venta>('/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }, token);
};

export const updateVenta = async (id: number, data: UpdateVentaDto, token?: string): Promise<Venta> => {
    return request<Venta>(`/venta/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }, token);
};

export const deleteVenta = async (id: number, token?: string): Promise<void> => {
    return request<void>(`/venta/${id}`, {
        method: 'DELETE',
    }, token);
};

// Lote Services
export const getAllLotes = async (token?: string): Promise<Lote[]> => {
    return request<Lote[]>('/lote', {}, token);
};

export const getLotesByProducto = async (productId: number, token?: string): Promise<Lote[]> => {
    return request<Lote[]>(`/lote/producto/${productId}`, {}, token);
};
