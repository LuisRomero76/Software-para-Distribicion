import type { Ruta } from '../types';

interface RutaDeleteModalProps {
  ruta: Ruta | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

// Helper para formatear fechas sin problemas de zona horaria
const formatDateLocal = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const [year, month, day] = date.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-ES');
};

export const RutaDeleteModal: React.FC<RutaDeleteModalProps> = ({
  ruta,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !ruta) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !isDeleting && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>¿Eliminar ruta?</h3>
        <p>
          Estás a punto de eliminar la ruta asignada a{' '}
          <strong>{ruta.cliente ? ruta.cliente.nombre : 'cliente'}</strong> para el día{' '}
          <strong>{formatDateLocal(ruta.dia_visita)}</strong>.
        </p>
        <p className="warning-text">Esta acción no se puede deshacer.</p>
        <div className="modal-actions">
          <button className="btn outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="btn danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
