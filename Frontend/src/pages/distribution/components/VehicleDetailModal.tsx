interface VehicleDetailModalProps {
  vehicle: any | null;
  editMode: boolean;
  editForm: any;
  onEditFormChange: (form: any) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  editMode,
  editForm,
  onEditFormChange,
  onClose,
  onSave,
  isSaving
}) => {
  if (!vehicle) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editMode ? 'Editar vehículo' : 'Información del vehículo'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={onSave}>
          <div className="form-grid">
            <label>
              <span className="label-text">Placa</span>
              <input
                type="text"
                value={editMode ? editForm.placa : vehicle.placa}
                onChange={e => onEditFormChange({ ...editForm, placa: e.target.value })}
                disabled={!editMode}
                readOnly={!editMode}
                className="form-input"
                required
              />
            </label>
            <label>
              <span className="label-text">Marca</span>
              <input
                type="text"
                value={editMode ? editForm.marca : vehicle.marca}
                onChange={e => onEditFormChange({ ...editForm, marca: e.target.value })}
                disabled={!editMode}
                readOnly={!editMode}
                className="form-input"
                required
              />
            </label>
            <label>
              <span className="label-text">Modelo</span>
              <input
                type="text"
                value={editMode ? editForm.modelo : vehicle.modelo}
                onChange={e => onEditFormChange({ ...editForm, modelo: e.target.value })}
                disabled={!editMode}
                readOnly={!editMode}
                className="form-input"
                required
              />
            </label>
            <label>
              <span className="label-text">Año</span>
              <input
                type="number"
                value={editMode ? editForm.año : vehicle.año}
                onChange={e => onEditFormChange({ ...editForm, año: parseInt(e.target.value) })}
                disabled={!editMode}
                readOnly={!editMode}
                className="form-input"
                required
              />
            </label>
            <label>
              <span className="label-text">Capacidad de Carga</span>
              <input
                type="number"
                value={editMode ? editForm.capacidad_carga : vehicle.capacidad_carga}
                onChange={e => onEditFormChange({ ...editForm, capacidad_carga: parseFloat(e.target.value) })}
                disabled={!editMode}
                readOnly={!editMode}
                className="form-input"
              />
            </label>
            <label>
              <span className="label-text">Disponible</span>
              <select
                value={editMode ? editForm.disponible ? 'sí' : 'no' : vehicle.disponible ? 'sí' : 'no'}
                onChange={e => onEditFormChange({ ...editForm, disponible: e.target.value === 'sí' })}
                disabled={!editMode}
                className="form-input"
              >
                <option value="sí">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
            <label>
              <span className="label-text">ID</span>
              <input type="text" value={`#${vehicle.vehicle_id}`} disabled readOnly className="form-input" />
            </label>
            <label>
              <span className="label-text">Fecha de Creación</span>
              <input type="text" value={new Date(vehicle.createdAt).toLocaleString('es-ES')} disabled readOnly className="form-input" />
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
