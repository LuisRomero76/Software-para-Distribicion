import type { Cliente, Colaborador, RutaFormData, Ruta } from '../types';

interface RutaAddModalProps {
  isOpen: boolean;
  newRuta: Partial<RutaFormData>;
  onRutaChange: (ruta: Partial<RutaFormData>) => void;
  clientes: Cliente[];
  colaboradores: Colaborador[];
  rutas: Ruta[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const RutaAddModal: React.FC<RutaAddModalProps> = ({
  isOpen,
  newRuta,
  onRutaChange,
  clientes,
  colaboradores,
  rutas,
  onClose,
  onSubmit,
  isLoading
}) => {
  if (!isOpen) return null;

  // Filtrar clientes que ya tienen rutas asignadas
  const clientesDisponibles = clientes.filter(
    cliente => !rutas.some(ruta => ruta.cliente_id === cliente.cliente_id)
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h3>Asignar nueva ruta</h3>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label style={{ gridColumn: '1 / -1' }}>
              <span className="label-text">Cliente *</span>
              <select
                value={newRuta.cliente_id || 0}
                onChange={e => onRutaChange({ ...newRuta, cliente_id: Number(e.target.value) })}
                className="form-input"
                required
              >
                <option value={0}>Seleccione un cliente</option>
                {clientesDisponibles.map(cliente => (
                  <option key={cliente.cliente_id} value={cliente.cliente_id}>
                    {cliente.nombre} - {cliente.direccion}
                  </option>
                ))}
              </select>
              {clientesDisponibles.length === 0 && (
                <small style={{ color: '#ff6b6b', marginTop: '0.25rem', display: 'block' }}>
                  Todos los clientes ya tienen rutas asignadas
                </small>
              )}
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              <span className="label-text">Colaborador *</span>
              <select
                value={newRuta.collaborator_id || 0}
                onChange={e => onRutaChange({ ...newRuta, collaborator_id: Number(e.target.value) })}
                className="form-input"
                required
              >
                <option value={0}>Seleccione un colaborador</option>
                {colaboradores.map(colaborador => (
                  <option key={colaborador.collaborator_id} value={colaborador.collaborator_id}>
                    {colaborador.nombre} {colaborador.apellido}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              <span className="label-text">Día de Visita *</span>
              <input
                type="date"
                value={newRuta.dia_visita || ''}
                onChange={e => onRutaChange({ ...newRuta, dia_visita: e.target.value })}
                className="form-input"
                required
              />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              <span className="label-text">Observaciones</span>
              <textarea
                value={newRuta.observaciones || ''}
                onChange={e => onRutaChange({ ...newRuta, observaciones: e.target.value })}
                className="form-input"
                rows={3}
                placeholder="Notas adicionales sobre la ruta..."
              />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Asignando...' : 'Asignar Ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
