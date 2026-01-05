import { Search } from 'lucide-react';

interface RutasTableControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const RutasTableControls: React.FC<RutasTableControlsProps> = ({
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
          placeholder="Buscar por cliente, colaborador o dirección..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className="table-info">
        {filteredCount} de {totalCount} ruta(s)
      </div>
    </div>
  );
};
