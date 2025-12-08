import { useState, useCallback } from 'react';
import { request } from '../../../lib/http';
import type { Vehicle, VehicleFormData } from '../types';

export const useVehicles = (token?: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<Vehicle[]>('/vehicle', {}, token);
      setVehicles(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addVehicle = useCallback(
    async (vehicleData: VehicleFormData) => {
      try {
        const created = await request<Vehicle>(
          '/vehicle',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData)
          },
          token
        );
        setVehicles([created, ...vehicles]);
        return created;
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo agregar el vehículo');
      }
    },
    [vehicles, token]
  );

  const updateVehicle = useCallback(
    async (id: number, vehicleData: Partial<VehicleFormData>) => {
      try {
        const updated = await request<Vehicle>(
          `/vehicle/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData)
          },
          token
        );
        setVehicles(vehicles.map(v => (v.vehicle_id === id ? updated : v)));
        return updated;
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo actualizar el vehículo');
      }
    },
    [vehicles, token]
  );

  const deleteVehicle = useCallback(
    async (id: number) => {
      try {
        await request(`/vehicle/${id}`, { method: 'DELETE' }, token);
        setVehicles(vehicles.filter(v => v.vehicle_id !== id));
      } catch (e: any) {
        throw new Error(e?.message ?? 'No se pudo eliminar el vehículo');
      }
    },
    [vehicles, token]
  );

  return {
    vehicles,
    loading,
    error,
    loadVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setVehicles
  };
};
