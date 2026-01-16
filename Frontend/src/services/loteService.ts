import { request } from '../lib/http';

export interface Lote {
    lote_id: number;
    product_id: number;
    cantidad_inicial: number;
    cantidad_actual: number;
    unidades_sueltas: number;
    costo_unitario: number;
    fecha_vencimiento?: string;
    detalle_compra_id?: number;
    fecha_ingreso: string;
    producto?: {
        product_id: number;
        nombre: string;
        descripcion?: string;
        precio: number;
        cod_barra?: string;
        cant_por_paquete?: number;
        categoria?: {
            categoria_id: number;
            nombre: string;
        };
        subCategoria?: {
            sub_categoria_id: number;
            nombre: string;
        };
    };
}

// Obtener todos los lotes
export const getAllLotes = async (): Promise<Lote[]> => {
    return request<Lote[]>('/lote', { method: 'GET' });
};

// Obtener lotes disponibles (con stock > 0)
export const getLotesDisponibles = async (): Promise<Lote[]> => {
    return request<Lote[]>('/lote/available', { method: 'GET' });
};

// Obtener lotes por producto
export const getLotesByProduct = async (productId: number): Promise<Lote[]> => {
    return request<Lote[]>(`/lote/product/${productId}`, { method: 'GET' });
};

// Obtener un lote por ID
export const getLoteById = async (id: number): Promise<Lote> => {
    return request<Lote>(`/lote/${id}`, { method: 'GET' });
};
