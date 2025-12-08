import type { VehicleAssignment, Vehicle, Collaborator } from '../types';

interface AssignmentDetailModalProps {
  assignment: VehicleAssignment | null;
  editMode: boolean;
  editForm: any;
  onEditFormChange: (form: any) => void;
  vehicles: Vehicle[];
  collaborators: Collaborator[];
  assignments: VehicleAssignment[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = ({
  assignment,
  editMode,
  editForm,
  onEditFormChange,
  vehicles,
  collaborators,
  assignments,
  onClose,
  onSave,
  isSaving
}) => {
  if (!assignment) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editMode ? 'Editar asignación' : 'Información de la asignación'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={onSave}>
          <div className="form-grid">
            <label>
              <span className="label-text">Vehículo</span>
              {editMode ? (
                <select
                  value={String(editForm.vehicle_id)}
                  onChange={e => {
                    const newForm = { ...editForm, vehicle_id: parseInt(e.target.value) };
                    onEditFormChange(newForm);
                  }}
                  className="form-input"
                  required
                >
                  <option value="0">Selecciona un vehículo</option>
                  {vehicles.map(v => {
                    const isAssigned = assignments.some(a => 
                      a.vehicle_id === v.vehicle_id && 
                      a.estado === 'activo' && 
                      a.assignment_id != assignment.assignment_id
                    );
                    return (
                      <option 
                        key={v.vehicle_id} 
                        value={String(v.vehicle_id)}
                        disabled={isAssigned}
                        style={{ color: isAssigned ? '#999' : 'inherit' }}
                      >
                        {v.placa} - {v.marca} {v.modelo} {isAssigned ? '(Asignado)' : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={assignment.vehicle ? `${assignment.vehicle.placa} - ${assignment.vehicle.marca} ${assignment.vehicle.modelo}` : 'N/A'}
                  disabled 
                  readOnly 
                  className="form-input" 
                />
              )}
            </label>
            <label>
              <span className="label-text">Colaborador</span>
              {editMode ? (
                <select
                  value={String(editForm.collaborator_id)}
                  onChange={e => {
                    const newForm = { ...editForm, collaborator_id: parseInt(e.target.value) };
                    onEditFormChange(newForm);
                  }}
                  className="form-input"
                  required
                >
                  <option value="0">Selecciona un colaborador</option>
                  {collaborators.map(c => {
                    const isAssigned = assignments.some(a => 
                      a.collaborator_id === c.collaborator_id && 
                      a.estado === 'activo' && 
                      a.assignment_id != assignment.assignment_id
                    );
                    return (
                      <option 
                        key={c.collaborator_id} 
                        value={String(c.collaborator_id)}
                        disabled={isAssigned}
                        style={{ color: isAssigned ? '#999' : 'inherit' }}
                      >
                        {c.nombre} {c.apellido} {isAssigned ? '(Asignado)' : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={assignment.collaborator ? `${assignment.collaborator.nombre} ${assignment.collaborator.apellido}` : 'N/A'}
                  disabled 
                  readOnly 
                  className="form-input" 
                />
              )}
            </label>
            <label>
              <span className="label-text">Fecha de Inicio</span>
              {editMode ? (
                <input
                  type="date"
                  value={editForm.fecha_inicio}
                  onChange={e => onEditFormChange({ ...editForm, fecha_inicio: e.target.value })}
                  className="form-input"
                  required
                />
              ) : (
                <input
                  type="date"
                  value={assignment.fecha_inicio}
                  disabled
                  readOnly
                  className="form-input"
                  required
                />
              )}
            </label>
            <label>
              <span className="label-text">Fecha de Fin</span>
              {editMode ? (
                <input
                  type="date"
                  value={editForm.fecha_fin}
                  onChange={e => onEditFormChange({ ...editForm, fecha_fin: e.target.value })}
                  className="form-input"
                  required
                />
              ) : (
                <input
                  type="date"
                  value={assignment.fecha_fin}
                  disabled
                  readOnly
                  className="form-input"
                  required
                />
              )}
            </label>
            <label>
              <span className="label-text">Estado</span>
              {editMode ? (
                <select
                  value={editForm.estado}
                  onChange={e => onEditFormChange({ ...editForm, estado: e.target.value })}
                  className="form-input"
                >
                  <option value="activo">Activo</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              ) : (
                <select
                  value={assignment.estado}
                  disabled
                  className="form-input"
                >
                  <option value="activo">Activo</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              )}
            </label>
            <label>
              <span className="label-text">ID</span>
              <input type="text" value={`#${assignment.assignment_id}`} disabled readOnly className="form-input" />
            </label>
            <label>
              <span className="label-text">Fecha de Creación</span>
              <input type="text" value={new Date(assignment.createdAt).toLocaleString('es-ES')} disabled readOnly className="form-input" />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={isSaving}>Cerrar</button>
            {editMode && <button className="btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</button>}
          </div>
        </form>
      </div>
    </div>
  );
};
