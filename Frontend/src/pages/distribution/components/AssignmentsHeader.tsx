import { Download, RefreshCw, Plus } from 'lucide-react';

interface AssignmentsHeaderProps {
  onExport: () => void;
  onRefresh: () => void;
  onAddNew: () => void;
  assignmentsCount: number;
  isLoading: boolean;
}

export const AssignmentsHeader: React.FC<AssignmentsHeaderProps> = ({
  onExport,
  onRefresh,
  onAddNew,
  assignmentsCount,
  isLoading
}) => {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">Asignaciones de Vehículos</h2>
        <p className="page-subtitle">Gestiona las asignaciones de vehículos a colaboradores</p>
      </div>
      <div className="page-header-actions">
        <button
          className="btn-export"
          onClick={onExport}
          disabled={assignmentsCount === 0}
          title="Exportar a Excel"
        >
          <Download size={18} /> Exportar
        </button>
        <button
          className="btn-refresh"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} /> Actualizar
        </button>
        <button
          className="btn-primary"
          onClick={onAddNew}
          disabled={isLoading}
        >
          <Plus size={18} /> Asignar vehículo
        </button>
      </div>
    </div>
  );
};
