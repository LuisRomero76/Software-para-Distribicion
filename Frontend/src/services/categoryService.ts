import { request } from '../lib/http';

export interface Category {
    category_id: number;
    nombre: string;
    createdAt: string;
    subCategories?: SubCategory[];
}

export interface SubCategory {
    sub_category_id: number;
    nombre: string;
    category_id: number;
    createdAt: string;
    category?: Category;
}

export interface CreateCategoryDto {
    nombre: string;
}

export interface UpdateCategoryDto {
    nombre?: string;
}

export interface CreateSubCategoryDto {
    nombre: string;
    category_id: number;
}

export interface UpdateSubCategoryDto {
    nombre?: string;
    category_id?: number;
}

// Category Services
export const getAllCategories = async (): Promise<Category[]> => {
    return request<Category[]>('/category', { method: 'GET' });
};

export const getCategoryById = async (id: number): Promise<Category> => {
    return request<Category>(`/category/${id}`, { method: 'GET' });
};

export const createCategory = async (data: CreateCategoryDto): Promise<Category> => {
    return request<Category>('/category', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateCategory = async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    return request<Category>(`/category/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteCategory = async (id: number): Promise<void> => {
    return request<void>(`/category/${id}`, { method: 'DELETE' });
};

// SubCategory Services
export const getAllSubCategories = async (): Promise<SubCategory[]> => {
    return request<SubCategory[]>('/sub-category', { method: 'GET' });
};

export const getSubCategoryById = async (id: number): Promise<SubCategory> => {
    return request<SubCategory>(`/sub-category/${id}`, { method: 'GET' });
};

export const createSubCategory = async (data: CreateSubCategoryDto): Promise<SubCategory> => {
    return request<SubCategory>('/sub-category', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateSubCategory = async (id: number, data: UpdateSubCategoryDto): Promise<SubCategory> => {
    return request<SubCategory>(`/sub-category/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteSubCategory = async (id: number): Promise<void> => {
    return request<void>(`/sub-category/${id}`, { method: 'DELETE' });
};
