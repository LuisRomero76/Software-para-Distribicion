import type { Vehicle, Collaborator, VehicleAssignment } from '../types';

interface AssignmentAddModalProps {
  isOpen: boolean;
  newAssignment: any;
  onAssignmentChange: (assignment: any) => void;
  vehicles: Vehicle[];
  collaborators: Collaborator[];
  assignments: VehicleAssignment[]; // <-- AGREGAR ESTA PROP
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const AssignmentAddModal: React.FC<AssignmentAddModalProps> = ({
  isOpen,
  newAssignment,
  onAssignmentChange,
  vehicles,
  collaborators,
  assignments,
  onClose,
  onSubmit,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Asignar nuevo vehículo</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              <span className="label-text">Vehículo *</span>
              <select
                value={newAssignment.vehicle_id ?? 0}
                onChange={e => onAssignmentChange({ ...newAssignment, vehicle_id: parseInt(e.target.value) })}
                className="form-input"
                required
              >
                <option value="0">Selecciona un vehículo</option>
                {vehicles.map(v => {
                  const isAssigned = assignments.some(a => 
                    a.vehicle_id === v.vehicle_id && a.estado === 'activo'
                  );
                  return (
                    <option 
                      key={v.vehicle_id} 
                      value={v.vehicle_id}
                      disabled={isAssigned}
                      style={{ color: isAssigned ? '#999' : 'inherit' }}
                    >
                      {v.placa} - {v.marca} {v.modelo} {isAssigned ? '(Asignado)' : ''}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              <span className="label-text">Colaborador *</span>
              <select
                value={newAssignment.collaborator_id ?? 0}
                onChange={e => onAssignmentChange({ ...newAssignment, collaborator_id: parseInt(e.target.value) })}
                className="form-input"
                required
              >
                <option value="0">Selecciona un colaborador</option>
                {collaborators.map(c => {
                  const isAssigned = assignments.some(a => 
                    a.collaborator_id === c.collaborator_id && a.estado === 'activo'
                  );
                  return (
                    <option 
                      key={c.collaborator_id} 
                      value={c.collaborator_id}
                      disabled={isAssigned}
                      style={{ color: isAssigned ? '#999' : 'inherit' }}
                    >
                      {c.nombre} {c.apellido} {isAssigned ? '(Asignado)' : ''}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              <span className="label-text">Fecha de Inicio *</span>
              <input
                type="date"
                value={newAssignment.fecha_inicio ?? ''}
                onChange={e => onAssignmentChange({ ...newAssignment, fecha_inicio: e.target.value })}
                className="form-input"
                required
              />
            </label>
            <label>
              <span className="label-text">Fecha de Fin *</span>
              <input
                type="date"
                value={newAssignment.fecha_fin ?? ''}
                onChange={e => onAssignmentChange({ ...newAssignment, fecha_fin: e.target.value })}
                className="form-input"
                required
              />
            </label>
            <label>
              <span className="label-text">Estado</span>
              <select
                value={newAssignment.estado ?? 'activo'}
                onChange={e => onAssignmentChange({ ...newAssignment, estado: e.target.value })}
                className="form-input"
              >
                <option value="activo">Activo</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={isLoading}>Cancelar</button>
            <button className="btn-primary" type="submit" disabled={isLoading}>{isLoading ? 'Asignando...' : 'Asignar vehículo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
