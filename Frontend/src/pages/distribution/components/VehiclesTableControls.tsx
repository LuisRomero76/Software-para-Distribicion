import { Search } from 'lucide-react';

interface VehiclesTableControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const VehiclesTableControls: React.FC<VehiclesTableControlsProps> = ({
  searchTerm,
  onSearchChange,
  filteredCount,
  totalCount
}) => {
  return (
    <div className="table-controls">
      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por placa, marca o modelo..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className="table-info">
        {filteredCount} de {totalCount} vehículo(s)
      </div>
    </div>
  );
};
