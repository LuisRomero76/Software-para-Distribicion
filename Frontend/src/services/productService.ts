import { request } from '../lib/http';

export interface Producto {
    product_id: number;
    nombre: string;
    descripcion?: string;
    precio_venta_sin_factura: number; // precio de venta por unidad sin factura
    precio_venta_con_factura?: number; // precio de venta por unidad con factura
    precio_compra?: number; // precio de compra por unidad
    precio_compra_paquete?: number; // precio de compra por paquete
    precio_venta_paquete_sin_factura?: number; // precio de venta por paquete sin factura
    precio_venta_paquete_con_factura?: number; // precio de venta por paquete con factura
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
    precio_venta_sin_factura: number;
    precio_venta_con_factura?: number;
    cod_barra?: string;
    categoria_id: number;
    sub_categoria_id: number;
    stock?: number;
    precio_compra?: number;
    precio_compra_paquete?: number;
    precio_venta_paquete_sin_factura?: number;
    precio_venta_paquete_con_factura?: number;
    cant_por_paquete?: number;
}

export interface UpdateProductoDto {
    nombre?: string;
    descripcion?: string;
    precio_venta_sin_factura?: number;
    precio_venta_con_factura?: number;
    cod_barra?: string;
    categoria_id?: number;
    sub_categoria_id?: number;
    stock?: number;
    precio_compra?: number;
    precio_compra_paquete?: number;
    precio_venta_paquete_sin_factura?: number;
    precio_venta_paquete_con_factura?: number;
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
