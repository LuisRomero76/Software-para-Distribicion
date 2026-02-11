import { useEffect, useState } from 'react';
import { request } from '../../../lib/http';

export interface Collaborator {
  collaborator_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: 'preventista' | 'distribuidor';
  createdAt?: string;
}

export function useCollaborators(token?: string) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const data = await request<Collaborator[]>('/collaborator', {}, token);
      setCollaborators(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [token]);

  // Filtrar solo preventistas
  const preventistas = collaborators.filter(c => c.rol === 'preventista');

  return { collaborators, preventistas, loading, error, fetchCollaborators };
}
