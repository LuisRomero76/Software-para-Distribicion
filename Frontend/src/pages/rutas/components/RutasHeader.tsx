import { Download, RefreshCw, Plus } from 'lucide-react';

interface RutasHeaderProps {
  onExport: () => void;
  onRefresh: () => void;
  onAddNew: () => void;
  rutasCount: number;
  isLoading: boolean;
}

export const RutasHeader: React.FC<RutasHeaderProps> = ({
  onExport,
  onRefresh,
  onAddNew,
  rutasCount,
  isLoading
}) => {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">Asignación de Rutas</h2>
        <p className="page-subtitle">Gestiona las rutas de visita a clientes</p>
      </div>
      <div className="page-header-actions">
        <button
          className="btn-export"
          onClick={onExport}
          disabled={rutasCount === 0}
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
          <Plus size={18} /> Asignar ruta
        </button>
      </div>
    </div>
  );
};
