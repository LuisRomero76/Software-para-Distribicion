interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  if (totalItems <= itemsPerPage) return null;

  return (
    <div className="pagination-controls">
      <button
        className="btn-pagination"
        onClick={() => onPageChange(1)}
        disabled={!canPrev}
      >
        Primera
      </button>
      <button
        className="btn-pagination"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={!canPrev}
      >
        Anterior
      </button>

      <span className="pagination-info">
        Página {currentPage} de {totalPages} ({totalItems} resultados)
      </span>

      <button
        className="btn-pagination"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={!canNext}
      >
        Siguiente
      </button>
      <button
        className="btn-pagination"
        onClick={() => onPageChange(totalPages)}
        disabled={!canNext}
      >
        Última
      </button>
    </div>
  );
}
