import { Search } from 'lucide-react';

interface AssignmentsTableControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const AssignmentsTableControls: React.FC<AssignmentsTableControlsProps> = ({
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
          placeholder="Buscar por vehículo o colaborador..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className="table-info">
        {filteredCount} de {totalCount} asignación(es)
      </div>
    </div>
  );
};
