import type { Vehicle } from '../types';

interface VehicleDeleteModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const VehicleDeleteModal: React.FC<VehicleDeleteModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !isDeleting && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>¿Eliminar vehículo?</h3>
        <p>Estás a punto de eliminar el vehículo con placa <strong>{vehicle.placa}</strong> ({vehicle.marca} {vehicle.modelo}).</p>
        <p className="warning-text">Esta acción no se puede deshacer.</p>
        <div className="modal-actions">
          <button className="btn outline" onClick={onClose} disabled={isDeleting}>Cancelar</button>
          <button className="btn danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
