import type { Ruta, Cliente, Colaborador, RutaFormData } from '../types';

interface RutaDetailModalProps {
  ruta: Ruta | null;
  editMode: boolean;
  editForm: Partial<RutaFormData>;
  onEditFormChange: (form: Partial<RutaFormData>) => void;
  clientes: Cliente[];
  colaboradores: Colaborador[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export const RutaDetailModal: React.FC<RutaDetailModalProps> = ({
  ruta,
  editMode,
  editForm,
  onEditFormChange,
  clientes,
  colaboradores,
  onClose,
  onSave,
  isSaving
}) => {
  if (!ruta) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editMode ? 'Editar ruta' : 'Información de la ruta'}</h3>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <form className="modal-form" onSubmit={onSave}>
          <div className="form-grid">
            <label>
              <span className="label-text">Cliente</span>
              {editMode ? (
                <select
                  value={editForm.cliente_id || ruta.cliente_id}
                  onChange={e => onEditFormChange({ ...editForm, cliente_id: Number(e.target.value) })}
                  className="form-input"
                  required
                >
                  {clientes.map(cliente => (
                    <option key={cliente.cliente_id} value={cliente.cliente_id}>
                      {cliente.nombre} - {cliente.direccion}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ruta.cliente ? `${ruta.cliente.nombre} - ${ruta.cliente.direccion}` : 'N/A'}
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
                  value={editForm.collaborator_id || ruta.collaborator_id}
                  onChange={e => onEditFormChange({ ...editForm, collaborator_id: Number(e.target.value) })}
                  className="form-input"
                  required
                >
                  {colaboradores.map(colaborador => (
                    <option key={colaborador.collaborator_id} value={colaborador.collaborator_id}>
                      {colaborador.nombre} {colaborador.apellido}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ruta.colaborador ? `${ruta.colaborador.nombre} ${ruta.colaborador.apellido}` : 'N/A'}
                  disabled
                  readOnly
                  className="form-input"
                />
              )}
            </label>

            <label>
              <span className="label-text">Día de Visita</span>
              <input
                type="date"
                value={editMode ? (editForm.dia_visita || ruta.dia_visita) : ruta.dia_visita}
                onChange={e => onEditFormChange({ ...editForm, dia_visita: e.target.value })}
                disabled={!editMode}
                readOnly={!editMode}
                className="form-input"
                required
              />
            </label>

            <label>
              <span className="label-text">Estado</span>
              <select
                value={editMode ? (editForm.estado || ruta.estado) : ruta.estado}
                onChange={e => onEditFormChange({ ...editForm, estado: e.target.value as any })}
                disabled={!editMode}
                className="form-input"
                required
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>

            {!editMode && (
              <>
                <label>
                  <span className="label-text">ID</span>
                  <input type="text" value={`#${ruta.ruta_id}`} disabled readOnly className="form-input" />
                </label>

                <label>
                  <span className="label-text">Fecha de Creación</span>
                  <input
                    type="text"
                    value={new Date(ruta.createdAt).toLocaleString('es-ES')}
                    disabled
                    readOnly
                    className="form-input"
                  />
                </label>
              </>
            )}

            <label style={{ gridColumn: '1 / -1' }}>
              <span className="label-text">Observaciones</span>
              <textarea
                value={editMode ? (editForm.observaciones || ruta.observaciones || '') : (ruta.observaciones || '')}
                onChange={e => onEditFormChange({ ...editForm, observaciones: e.target.value })}
                disabled={!editMode}
                readOnly={!editMode}
                className="form-input"
                rows={3}
                placeholder="Notas adicionales sobre la ruta..."
              />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={isSaving}>
              Cerrar
            </button>
            {editMode && (
              <button className="btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
