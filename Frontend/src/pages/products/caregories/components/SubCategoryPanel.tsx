import { Pencil, Trash2, Save, X } from 'lucide-react';
import type { Category, SubCategory } from '../../../../services/categoryService';

interface Props {
  categories: Category[];
  subCategories: SubCategory[];
  subNombre: string;
  setSubNombre: (v: string) => void;
  subCategoryId: number | '';
  setSubCategoryId: (v: number | '') => void;
  onSubmit: (e: React.FormEvent) => void;
  editingSubId: number | null;
  editingSubNombre: string;
  setEditingSubNombre: (v: string) => void;
  editingSubCategoryId: number | '';
  setEditingSubCategoryId: (v: number | '') => void;
  onEditSub: (s: SubCategory) => void;
  onSaveEditSub: (id: number) => void;
  onCancelEditSub: () => void;
  onDeleteSub: (id: number) => void;
}

export default function SubCategoryPanel({
  categories,
  subCategories,
  subNombre,
  setSubNombre,
  subCategoryId,
  setSubCategoryId,
  onSubmit,
  editingSubId,
  editingSubNombre,
  setEditingSubNombre,
  editingSubCategoryId,
  setEditingSubCategoryId,
  onEditSub,
  onSaveEditSub,
  onCancelEditSub,
  onDeleteSub,
}: Props) {
  return (
    <div className="card">
      <h2 className="card-title">
        <Save size={20} /> Registro de subcategorías
      </h2>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sub-category">Categoría:</label>
            <select
              id="sub-category"
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              className="form-input"
            >
              <option value="">Seleccione categoría</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="sub-nombre">Nombre:</label>
            <input
              type="text"
              id="sub-nombre"
              value={subNombre}
              onChange={(e) => setSubNombre(e.target.value)}
              className="form-input"
              placeholder="Ingrese el nombre de la subcategoría"
            />
          </div>
        </div>
        <button type="submit" className="btn">
          <Save size={16} /> Guardar
        </button>
      </form>

      <div className="table-container subcat-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Subcategoría</th>
              <th className="col-actions">Acción</th>
            </tr>
          </thead>
          <tbody>
            {subCategories.map((subCategory) => (
              <tr key={subCategory.sub_category_id}>
                <td>
                  {editingSubId === subCategory.sub_category_id ? (
                    <select
                      value={editingSubCategoryId}
                      onChange={(e) => setEditingSubCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-input"
                    >
                      <option value="">Seleccione categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    subCategory.category?.nombre || 'Sin categoría'
                  )}
                </td>
                <td>
                  {editingSubId === subCategory.sub_category_id ? (
                    <input
                      type="text"
                      value={editingSubNombre}
                      onChange={(e) => setEditingSubNombre(e.target.value)}
                      className="form-input"
                      autoFocus
                    />
                  ) : (
                    subCategory.nombre
                  )}
                </td>
                <td className="col-actions">
                  <div className="action-buttons">
                    {editingSubId === subCategory.sub_category_id ? (
                      <>
                        <button
                          className="btn-icon btn-icon-success"
                          onClick={() => onSaveEditSub(subCategory.sub_category_id)}
                          title="Guardar"
                          type="button"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-secondary"
                          onClick={onCancelEditSub}
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
                          onClick={() => onEditSub(subCategory)}
                          title="Editar"
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => onDeleteSub(subCategory.sub_category_id)}
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
            {subCategories.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                  No hay subcategorías registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
