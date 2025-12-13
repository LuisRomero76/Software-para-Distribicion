import type { CategoriaCliente } from '../hooks/useCategoriasClientes';

export function CategoriasTable({ categorias }: { categorias: CategoriaCliente[] }) {
  return (
    <div className="table-container">
      <div className="table-controls">
        <h3>Categorías de clientes</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map(cat => (
            <tr key={cat.cliente_categoria_id}>
              <td>{cat.cliente_categoria_id}</td>
              <td>{cat.nombre}</td>
              <td>{new Date(cat.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
