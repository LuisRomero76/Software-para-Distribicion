import { request } from '../lib/http';

export interface Producto {
    product_id: number;
    nombre: string;
    descripcion?: string;
    precio: number; // precio de venta
    precio_compra?: number; // precio de compra por unidad
    cant_por_paquete?: number; // unidades por paquete
    cod_barra?: string;
    categoria_id: number;
    sub_categoria_id: number;
    stock?: number;
    categoria?: any;
    subCategoria?: any;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateProductoDto {
    nombre: string;
    descripcion?: string;
    precio: number;
    cod_barra?: string;
    categoria_id: number;
    sub_categoria_id: number;
    stock?: number;
    precio_compra?: number;
    cant_por_paquete?: number;
}

export interface UpdateProductoDto {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    cod_barra?: string;
    categoria_id?: number;
    sub_categoria_id?: number;
    stock?: number;
    precio_compra?: number;
    cant_por_paquete?: number;
}

// Producto Services
export const getAllProducts = async (): Promise<Producto[]> => {
    return request<Producto[]>('/product', { method: 'GET' });
};

export const getProductById = async (id: number): Promise<Producto> => {
    return request<Producto>(`/product/${id}`, { method: 'GET' });
};

export const getProductByBarcode = async (barcode: string): Promise<Producto> => {
    return request<Producto>(`/product/barcode/${barcode}`, { method: 'GET' });
};

export const createProduct = async (data: CreateProductoDto): Promise<Producto> => {
    return request<Producto>('/product', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateProduct = async (id: number, data: UpdateProductoDto): Promise<Producto> => {
    return request<Producto>(`/product/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteProduct = async (id: number): Promise<void> => {
    return request<void>(`/product/${id}`, { method: 'DELETE' });
};
