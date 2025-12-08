import { useState, useCallback } from 'react';
import { request } from '../../../lib/http';
import type { Collaborator, Vehicle, VehicleAssignment, VehicleAssignmentFormData } from '../types';

export const useVehicleAssignments = (token?: string) => {
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const assignmentsData = await request<VehicleAssignment[]>('/distribution/assignments', {}, token);
      const vehiclesData = await request<Vehicle[]>('/vehicle', {}, token);
      const collaboratorsData = await request<Collaborator[]>('/collaborator', {}, token);

      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setCollaborators(Array.isArray(collaboratorsData) ? collaboratorsData : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addAssignment = useCallback(
    async (assignmentData: VehicleAssignmentFormData) => {
      try {
        const created = await request<VehicleAssignment>(
          '/distribution/assignment',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData)
          },
          token
        );
        setAssignments([created, ...assignments]);
        return created;
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo agregar la asignación');
      }
    },
    [assignments, token]
  );

  const updateAssignment = useCallback(
    async (id: number, assignmentData: Partial<VehicleAssignmentFormData>) => {
      try {
        const updated = await request<VehicleAssignment>(
          `/distribution/assignment/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData)
          },
          token
        );
        setAssignments(assignments.map(a => (a.assignment_id === id ? updated : a)));
        return updated;
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo actualizar la asignación');
      }
    },
    [assignments, token]
  );

  const deleteAssignment = useCallback(
    async (id: number) => {
      try {
        await request(`/distribution/assignment/${id}`, { method: 'DELETE' }, token);
        setAssignments(assignments.filter(a => a.assignment_id !== id));
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo eliminar la asignación');
      }
    },
    [assignments, token]
  );

  return {
    assignments,
    vehicles,
    collaborators,
    loading,
    error,
    loadData,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    setAssignments
  };
};
