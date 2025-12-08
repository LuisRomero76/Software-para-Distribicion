import type { VehicleAssignment } from '../types';

interface AssignmentDeleteModalProps {
  assignment: VehicleAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const AssignmentDeleteModal: React.FC<AssignmentDeleteModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !assignment) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !isDeleting && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>¿Eliminar asignación?</h3>
        <p>
          Estás a punto de eliminar la asignación de <strong>{assignment.vehicle ? assignment.vehicle.placa : 'vehículo'}</strong> a{' '}
          <strong>{assignment.collaborator ? `${assignment.collaborator.nombre} ${assignment.collaborator.apellido}` : 'colaborador'}</strong>.
        </p>
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
