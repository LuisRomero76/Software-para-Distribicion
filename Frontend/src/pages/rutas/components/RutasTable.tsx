import { Eye, Edit2, Trash2 } from 'lucide-react';
import type { Ruta } from '../types';

interface RutasTableProps {
  rutas: Ruta[];
  isLoading: boolean;
  hasError: boolean;
  onView: (ruta: Ruta) => void;
  onEdit: (ruta: Ruta) => void;
  onDelete: (ruta: Ruta) => void;
  getStatusBadgeClass: (estado: string) => string;
}

export const RutasTable: React.FC<RutasTableProps> = ({
  rutas,
  isLoading,
  hasError,
  onView,
  onEdit,
  onDelete,
  getStatusBadgeClass
}) => {
  if (isLoading) {
    return <div className="loading-state">Cargando rutas...</div>;
  }

  if (hasError) {
    return <div className="error">No se pudieron cargar las rutas</div>;
  }

  if (rutas.length === 0) {
    return <div className="empty-state">No se encontraron rutas asignadas</div>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Dirección</th>
          <th>Colaborador</th>
          <th>Día de Visita</th>
          <th>Estado</th>
          <th className="actions-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {rutas.map(ruta => (
          <tr key={ruta.ruta_id}>
            <td className="id-col">{ruta.ruta_id}</td>
            <td className="name-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {ruta.cliente ? ruta.cliente.nombre : 'N/A'}
              </div>
            </td>
            <td>{ruta.cliente ? ruta.cliente.direccion : '-'}</td>
            <td>
              {ruta.colaborador ? `${ruta.colaborador.nombre} ${ruta.colaborador.apellido}` : 'N/A'}
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {new Date(ruta.dia_visita).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </td>
            <td>
              <span className={`badge ${getStatusBadgeClass(ruta.estado)}`}>
                {ruta.estado.replace('_', ' ')}
              </span>
            </td>
            <td className="actions-col">
              <button
                className="action-btn view"
                onClick={() => onView(ruta)}
                title="Ver información"
              >
                <Eye size={16} />
              </button>
              <button
                className="action-btn edit"
                onClick={() => onEdit(ruta)}
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="action-btn delete"
                onClick={() => onDelete(ruta)}
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
