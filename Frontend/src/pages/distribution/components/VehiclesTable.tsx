import { Eye, Edit2, Trash2 } from 'lucide-react';
import type { Vehicle } from '../types';

interface VehiclesTableProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  hasError: boolean;
  onView: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export const VehiclesTable: React.FC<VehiclesTableProps> = ({
  vehicles,
  isLoading,
  hasError,
  onView,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return <div className="loading-state">Cargando vehículos...</div>;
  }

  if (hasError) {
    return <div className="error">No se pudieron cargar los vehículos</div>;
  }

  if (vehicles.length === 0) {
    return <div className="empty-state">No se encontraron vehículos</div>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Placa</th>
          <th>Marca</th>
          <th>Modelo</th>
          <th>Año</th>
          <th>Capacidad</th>
          <th>Disponible</th>
          <th className="actions-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map(vehicle => (
          <tr key={vehicle.vehicle_id}>
            <td className="id-col">{vehicle.vehicle_id}</td>
            <td className="name-col">{vehicle.placa}</td>
            <td>{vehicle.marca}</td>
            <td>{vehicle.modelo}</td>
            <td>{vehicle.año}</td>
            <td>{vehicle.capacidad_carga} Kg.</td>
            <td>
              <span className={`badge ${vehicle.disponible ? 'badge-success' : 'badge-secondary'}`}>
                {vehicle.disponible ? 'Disponible' : 'No disponible'}
              </span>
            </td>
            <td className="actions-col">
              <button
                className="action-btn view"
                onClick={() => onView(vehicle)}
                title="Ver información"
              >
                <Eye size={16} />
              </button>
              <button
                className="action-btn edit"
                onClick={() => onEdit(vehicle)}
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="action-btn delete"
                onClick={() => onDelete(vehicle)}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
