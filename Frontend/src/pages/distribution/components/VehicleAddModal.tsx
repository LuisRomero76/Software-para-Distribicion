
interface VehicleAddModalProps {
  isOpen: boolean;
  newVehicle: any;
  onVehicleChange: (vehicle: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const VehicleAddModal: React.FC<VehicleAddModalProps> = ({
  isOpen,
  newVehicle,
  onVehicleChange,
  onClose,
  onSubmit,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Agregar nuevo vehículo</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              <span className="label-text">Placa *</span>
              <input
                type="text"
                value={newVehicle.placa ?? ''}
                onChange={e => onVehicleChange({ ...newVehicle, placa: e.target.value })}
                className="form-input"
                placeholder="ABC-123"
                required
              />
            </label>
            <label>
              <span className="label-text">Marca *</span>
              <input
                type="text"
                value={newVehicle.marca ?? ''}
                onChange={e => onVehicleChange({ ...newVehicle, marca: e.target.value })}
                className="form-input"
                placeholder="Toyota"
                required
              />
            </label>
            <label>
              <span className="label-text">Modelo *</span>
              <input
                type="text"
                value={newVehicle.modelo ?? ''}
                onChange={e => onVehicleChange({ ...newVehicle, modelo: e.target.value })}
                className="form-input"
                placeholder="Hilux"
                required
              />
            </label>
            <label>
              <span className="label-text">Año *</span>
              <input
                type="number"
                value={newVehicle.año ?? ''}
                onChange={e => onVehicleChange({ ...newVehicle, año: parseInt(e.target.value) })}
                className="form-input"
                required
              />
            </label>
            <label>
              <span className="label-text">Capacidad de Carga</span>
              <input
                type="number"
                step="0.01"
                value={newVehicle.capacidad_carga ?? ''}
                onChange={e => onVehicleChange({ ...newVehicle, capacidad_carga: parseFloat(e.target.value) })}
                className="form-input"
                placeholder="1500"
              />
            </label>
            <label>
              <span className="label-text">Disponible</span>
              <select
                value={newVehicle.disponible ? 'sí' : 'no'}
                onChange={e => onVehicleChange({ ...newVehicle, disponible: e.target.value === 'sí' })}
                className="form-input"
              >
                <option value="sí">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={isLoading}>Cancelar</button>
            <button className="btn-primary" type="submit" disabled={isLoading}>{isLoading ? 'Agregando...' : 'Agregar vehículo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
