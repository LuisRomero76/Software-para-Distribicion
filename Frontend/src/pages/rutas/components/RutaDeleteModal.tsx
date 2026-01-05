import type { Ruta } from '../types';

interface RutaDeleteModalProps {
  ruta: Ruta | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

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
          <strong>{new Date(ruta.dia_visita).toLocaleDateString('es-ES')}</strong>.
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
