import { Download, RefreshCw, Plus } from 'lucide-react';

interface VehiclesHeaderProps {
  onExport: () => void;
  onRefresh: () => void;
  onAddNew: () => void;
  vehiclesCount: number;
  isLoading: boolean;
}

export const VehiclesHeader: React.FC<VehiclesHeaderProps> = ({
  onExport,
  onRefresh,
  onAddNew,
  vehiclesCount,
  isLoading
}) => {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">Vehículos</h2>
        <p className="page-subtitle">Gestiona los vehículos del sistema</p>
      </div>
      <div className="page-header-actions">
        <button
          className="btn-export"
          onClick={onExport}
          disabled={vehiclesCount === 0}
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
          <Plus size={18} /> Agregar vehículo
        </button>
      </div>
    </div>
  );
};
