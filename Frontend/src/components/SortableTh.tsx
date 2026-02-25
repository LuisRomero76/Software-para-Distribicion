import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { SortState } from '../hooks/useSorting'

interface SortableThProps {
  label: React.ReactNode
  sortKey: string
  sort: SortState | null
  onSort: (key: string) => void
  className?: string
}

/**
 * Encabezado de columna con indicador de ordenamiento.
 * Muestra una flecha hacia arriba/abajo según el estado activo,
 * o un icono neutro cuando la columna no está ordenada.
 */
export const SortableTh: React.FC<SortableThProps> = ({ label, sortKey, sort, onSort, className }) => (
  <th
    className={`sortable-th${className ? ' ' + className : ''}`}
    onClick={() => onSort(sortKey)}
  >
    <span className="th-content">
      {label}
      <span className="sort-icon">
        {sort?.key === sortKey
          ? sort.dir === 'asc'
            ? <ChevronUp size={13} />
            : <ChevronDown size={13} />
          : <ChevronsUpDown size={13} className="sort-inactive" />
        }
      </span>
    </span>
  </th>
)
