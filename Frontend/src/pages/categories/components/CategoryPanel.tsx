import { Pencil, Trash2, Save, X } from 'lucide-react';
import type { Category } from '../../../services/categoryService';

interface Props {
  categories: Category[];
  nombre: string;
  setNombre: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  editingId: number | null;
  editingNombre: string;
  setEditingNombre: (v: string) => void;
  onEdit: (c: Category) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
}

export default function CategoryPanel({
  categories,
  nombre,
  setNombre,
  onSubmit,
  editingId,
  editingNombre,
  setEditingNombre,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: Props) {
  return (
    <div className="card">
      <h2 className="card-title">
        <Save size={20} /> Registro de categorías
      </h2>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="form-input"
              placeholder="Ingrese el nombre de la categoría"
            />
          </div>
        </div>
        <button type="submit" className="btn">
          <Save size={16} /> Agregar categoría
        </button>
      </form>

      <div className="table-container cat-table">
        <table className="table">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th>Nombre</th>
              <th className="col-actions">Acción</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.category_id}>
                <td className="col-id">{category.category_id}</td>
                <td>
                  {editingId === category.category_id ? (
                    <input
                      type="text"
                      value={editingNombre}
                      onChange={(e) => setEditingNombre(e.target.value)}
                      className="form-input"
                      autoFocus
                    />
                  ) : (
                    category.nombre
                  )}
                </td>
                <td className="col-actions">
                  <div className="action-buttons">
                    {editingId === category.category_id ? (
                      <>
                        <button
                          className="btn-icon btn-icon-success"
                          onClick={() => onSaveEdit(category.category_id)}
                          title="Guardar"
                          type="button"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-secondary"
                          onClick={onCancelEdit}
                          title="Cancelar"
                          type="button"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-icon btn-icon-warning"
                          onClick={() => onEdit(category)}
                          title="Editar"
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => onDelete(category.category_id)}
                          title="Eliminar"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                  No hay categorías registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
