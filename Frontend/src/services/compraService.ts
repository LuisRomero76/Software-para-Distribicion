import { request } from '../lib/http';

export interface Proveedor {
    proveedor_id: number;
    nombre: string;
    ruc?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
}

export interface Producto {
    product_id: number;
    nombre: string;
    precio: number; // venta
    precio_compra?: number; // compra
    cant_por_paquete?: number;
    categoria_id: number;
    sub_categoria_id: number;
}

export interface DetalleCompra {
    detalle_compra_id?: number;
    compra_id?: number;
    producto_id: number;
    producto?: Producto;
    cantidad: number;
    precio_compra: number;
    subtotal?: number;
}

export interface Compra {
    compra_id: number;
    proveedor_id: number;
    proveedor?: Proveedor;
    fecha_compra: string;
    total: number;
    observaciones?: string;
    detalles?: DetalleCompra[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCompraDto {
    proveedor_id?: number; // opcional
    fecha_compra?: string; // opcional; se genera en backend si falta
    observaciones?: string;
    detalles: Array<{
        product_id: number;
        cantidad: number;
        precio_unitario: number;
        fecha_vencimiento?: string;
    }>;
}

export interface UpdateCompraDto {
    proveedor_id?: number;
    fecha_compra?: string;
    observaciones?: string;
}

// Compra Services
export const getAllCompras = async (): Promise<Compra[]> => {
    return request<Compra[]>('/compra', { method: 'GET' });
};

export const getCompraById = async (id: number): Promise<Compra> => {
    return request<Compra>(`/compra/${id}`, { method: 'GET' });
};

export const createCompra = async (data: CreateCompraDto): Promise<Compra> => {
    return request<Compra>('/compra', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateCompra = async (id: number, data: UpdateCompraDto): Promise<Compra> => {
    return request<Compra>(`/compra/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteCompra = async (id: number): Promise<void> => {
    return request<void>(`/compra/${id}`, { method: 'DELETE' });
};
