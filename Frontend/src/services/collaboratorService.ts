import { request } from '../lib/http';

export interface Collaborator {
  colaborator_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  createdAt?: string;
  assignments?: any[];
}

export interface CreateCollaboratorDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}

export interface UpdateCollaboratorDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
}

export const getAllCollaborators = async (): Promise<Collaborator[]> => {
  return request<Collaborator[]>('/collaborator', { method: 'GET' });
};

export const getCollaboratorById = async (id: number): Promise<Collaborator> => {
  return request<Collaborator>(`/collaborator/${id}`, { method: 'GET' });
};

export const createCollaborator = async (data: CreateCollaboratorDto): Promise<Collaborator> => {
  return request<Collaborator>('/collaborator', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCollaborator = async (id: number, data: UpdateCollaboratorDto): Promise<Collaborator> => {
  return request<Collaborator>(`/collaborator/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteCollaborator = async (id: number): Promise<void> => {
  return request<void>(`/collaborator/${id}`, { method: 'DELETE' });
};
