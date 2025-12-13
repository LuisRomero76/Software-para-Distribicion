import './CategoriesManagement.css';
import { useCategoriesManagement } from './hooks/useCategoriesManagement';
import CategoryPanel from './components/CategoryPanel';
import SubCategoryPanel from './components/SubCategoryPanel';

export default function CategoriesManagement() {
  const vm = useCategoriesManagement();

  return (
    <div className="page-container category-page">
      {vm.successMessage && <div className="alert alert-success">{vm.successMessage}</div>}
      {vm.errorMessage && <div className="alert alert-error">{vm.errorMessage}</div>}

      <div className="category-grid">
        <CategoryPanel
          categories={vm.categories}
          nombre={vm.nombre}
          setNombre={vm.setNombre}
          onSubmit={vm.submitCategory}
          editingId={vm.editingId}
          editingNombre={vm.editingNombre}
          setEditingNombre={vm.setEditingNombre}
          onEdit={vm.startEditCategory}
          onSaveEdit={vm.saveEditCategory}
          onCancelEdit={vm.cancelEditCategory}
          onDelete={vm.askDeleteCategory}
        />

        <SubCategoryPanel
          categories={vm.categories}
          subCategories={vm.subCategories}
          subNombre={vm.subNombre}
          setSubNombre={vm.setSubNombre}
          subCategoryId={vm.subCategoryId}
          setSubCategoryId={vm.setSubCategoryId}
          onSubmit={vm.submitSubCategory}
          editingSubId={vm.editingSubId}
          editingSubNombre={vm.editingSubNombre}
          setEditingSubNombre={vm.setEditingSubNombre}
          editingSubCategoryId={vm.editingSubCategoryId}
          setEditingSubCategoryId={vm.setEditingSubCategoryId}
          onEditSub={vm.startEditSubCategory}
          onSaveEditSub={vm.saveEditSubCategory}
          onCancelEditSub={vm.cancelEditSubCategory}
          onDeleteSub={vm.askDeleteSubCategory}
        />
      </div>

      {vm.showDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar categoría?</h3>
            <p>Esta acción no se puede deshacer. Al eliminar esta categoría, también se eliminarán todas sus subcategorías.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={vm.cancelDeleteCategory}>Cancelar</button>
              <button className="btn btn-danger" onClick={vm.confirmDeleteCategory}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {vm.showDeleteSubModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar subcategoría?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={vm.cancelDeleteSubCategory}>Cancelar</button>
              <button className="btn btn-danger" onClick={vm.confirmDeleteSubCategory}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
