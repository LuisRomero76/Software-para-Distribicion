import type { Cliente } from '../hooks/useClientes';

export function ClientesTable({ clientes, onDelete }: { clientes: Cliente[]; onDelete: (id: number) => void }) {
  return (
    <div className="table-container">
      <div className="table-controls">
        <h3>Clientes</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Ciudad</th>
            <th>Teléfono</th>
            <th>Categorías</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.cliente_id}>
              <td>{c.cliente_id}</td>
              <td>{c.nombre}</td>
              <td>{c.ciudad || '-'}</td>
              <td>{c.telefono || '-'}</td>
              <td>{c.categorias.map(k => k.nombre).join(', ')}</td>
              <td>
                <button className="action-btn delete" onClick={() => onDelete(c.cliente_id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
