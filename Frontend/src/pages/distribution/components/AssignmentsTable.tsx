import { Eye, Edit2, Trash2 } from 'lucide-react';
import type { VehicleAssignment } from '../types';

interface AssignmentsTableProps {
  assignments: VehicleAssignment[];
  isLoading: boolean;
  hasError: boolean;
  onView: (assignment: VehicleAssignment) => void;
  onEdit: (assignment: VehicleAssignment) => void;
  onDelete: (assignment: VehicleAssignment) => void;
  getStatusBadgeClass: (estado: string) => string;
}

export const AssignmentsTable: React.FC<AssignmentsTableProps> = ({
  assignments,
  isLoading,
  hasError,
  onView,
  onEdit,
  onDelete,
  getStatusBadgeClass
}) => {
  if (isLoading) {
    return <div className="loading-state">Cargando asignaciones...</div>;
  }

  if (hasError) {
    return <div className="error">No se pudieron cargar las asignaciones</div>;
  }

  if (assignments.length === 0) {
    return <div className="empty-state">No se encontraron asignaciones</div>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Vehículo</th>
          <th>Colaborador</th>
          <th>Inicio</th>
          <th>Fin</th>
          <th>Estado</th>
          <th className="actions-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {assignments.map(assignment => (
          <tr key={assignment.assignment_id}>
            <td className="id-col">{assignment.assignment_id}</td>
            <td className="name-col">
              {assignment.vehicle ? `${assignment.vehicle.placa} - ${assignment.vehicle.marca} ${assignment.vehicle.modelo}` : 'N/A'}
            </td>
            <td>
              {assignment.collaborator ? `${assignment.collaborator.nombre} ${assignment.collaborator.apellido}` : 'N/A'}
            </td>
            <td>{assignment.fecha_inicio}</td>
            <td>{assignment.fecha_fin}</td>
            <td>
              <span className={`badge ${getStatusBadgeClass(assignment.estado)}`}>
                {assignment.estado.charAt(0).toUpperCase() + assignment.estado.slice(1)}
              </span>
            </td>
            <td className="actions-col">
              <button
                className="action-btn view"
                onClick={() => onView(assignment)}
                title="Ver información"
              >
                <Eye size={16} />
              </button>
              <button
                className="action-btn edit"
                onClick={() => onEdit(assignment)}
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="action-btn delete"
                onClick={() => onDelete(assignment)}
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
