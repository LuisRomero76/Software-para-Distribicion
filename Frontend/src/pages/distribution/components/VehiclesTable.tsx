import { Eye, Edit2, Trash2 } from 'lucide-react';
import type { Vehicle } from '../types';
import type { SortState } from '../../../hooks/useSorting';
import { SortableTh } from '../../../components/SortableTh';

interface VehiclesTableProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  hasError: boolean;
  onView: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  sort: SortState | null;
  onSort: (key: string) => void;
}

export const VehiclesTable: React.FC<VehiclesTableProps> = ({
  vehicles,
  isLoading,
  hasError,
  onView,
  onEdit,
  onDelete,
  selectedIds,
  onToggle,
  onToggleAll,
  allSelected,
  sort,
  onSort
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
          <th className="check-col">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              title="Seleccionar todos"
            />
          </th>
          <th>ID</th>
          <SortableTh label="Placa" sortKey="placa" sort={sort} onSort={onSort} />
          <SortableTh label="Marca" sortKey="marca" sort={sort} onSort={onSort} />
          <SortableTh label="Modelo" sortKey="modelo" sort={sort} onSort={onSort} />
          <SortableTh label="Año" sortKey="año" sort={sort} onSort={onSort} />
          <SortableTh label="Capacidad" sortKey="capacidad_carga" sort={sort} onSort={onSort} />
          <SortableTh label="Disponible" sortKey="disponible" sort={sort} onSort={onSort} />
          <th className="actions-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map(vehicle => (
          <tr key={vehicle.vehicle_id} className={selectedIds.has(vehicle.vehicle_id) ? 'row-selected' : ''}>
            <td className="check-col">
              <input
                type="checkbox"
                checked={selectedIds.has(vehicle.vehicle_id)}
                onChange={() => onToggle(vehicle.vehicle_id)}
              />
            </td>
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
