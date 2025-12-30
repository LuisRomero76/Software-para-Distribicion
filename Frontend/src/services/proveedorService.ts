import { request } from '../lib/http';

export interface Proveedor {
    proveedor_id: number;
    nombre: string;
    nit_ci?: string;
    email?: string;
    telefono?: string;
    ciudad?: string;
    createdAt?: string;
}

export interface CreateProveedorDto {
    nombre: string;
    nit_ci?: string;
    email?: string;
    telefono?: string;
    ciudad?: string;
}

export interface UpdateProveedorDto {
    nombre?: string;
    nit_ci?: string;
    email?: string;
    telefono?: string;
    ciudad?: string;
}

// Proveedor Services
export const getAllProveedores = async (): Promise<Proveedor[]> => {
    return request<Proveedor[]>('/proveedor', { method: 'GET' });
};

export const getProveedorById = async (id: number): Promise<Proveedor> => {
    return request<Proveedor>(`/proveedor/${id}`, { method: 'GET' });
};

export const createProveedor = async (data: CreateProveedorDto): Promise<Proveedor> => {
    return request<Proveedor>('/proveedor', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateProveedor = async (id: number, data: UpdateProveedorDto): Promise<Proveedor> => {
    return request<Proveedor>(`/proveedor/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteProveedor = async (id: number): Promise<void> => {
    return request<void>(`/proveedor/${id}`, { method: 'DELETE' });
};
