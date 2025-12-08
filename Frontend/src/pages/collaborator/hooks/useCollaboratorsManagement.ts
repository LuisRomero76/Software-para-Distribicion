import { useState, useCallback } from 'react';
import { request } from '../../../lib/http';

export interface Collaborator {
  colaborator_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  createdAt?: string;
}

export interface CollaboratorFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  password?: string;
}

export const useCollaboratorsManagement = (token?: string) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCollaborators = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<Collaborator[]>('/collaborator', {}, token);
      setCollaborators(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addCollaborator = useCallback(
    async (data: CollaboratorFormData) => {
      try {
        const newCollaborator = await request<Collaborator>('/collaborator', {
          method: 'POST',
          body: JSON.stringify(data),
        }, token);
        setCollaborators([...collaborators, newCollaborator]);
        setSuccessMessage('¡Colaborador agregado exitosamente!');
        return newCollaborator;
      } catch (e: any) {
        throw new Error(e?.message ?? 'Error al agregar colaborador');
      }
    },
    [collaborators, token]
  );

  const updateCollaborator = useCallback(
    async (collaborator_id: number, data: Partial<CollaboratorFormData>) => {
      try {
        const updated = await request<Collaborator>(`/collaborator/${collaborator_id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }, token);
        setCollaborators(collaborators.map(c => c.colaborator_id === collaborator_id ? updated : c));
        setSuccessMessage('¡Colaborador actualizado exitosamente!');
        return updated;
      } catch (e: any) {
        throw new Error(e?.message ?? 'Error al actualizar colaborador');
      }
    },
    [collaborators, token]
  );

  const deleteCollaborator = useCallback(
    async (collaborator_id: number) => {
      try {
        await request(`/collaborator/${collaborator_id}`, { method: 'DELETE' }, token);
        setCollaborators(collaborators.filter(c => c.colaborator_id !== collaborator_id));
        setSuccessMessage('¡Colaborador eliminado exitosamente!');
      } catch (e: any) {
        throw new Error(e?.message ?? 'Error al eliminar colaborador');
      }
    },
    [collaborators, token]
  );

  return {
    collaborators,
    loading,
    error,
    successMessage,
    setSuccessMessage,
    loadCollaborators,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    setCollaborators,
  };
};
