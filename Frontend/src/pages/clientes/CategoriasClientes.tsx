import { useState } from 'react';
import { useCategoriasClientes, type CategoriaCliente } from './hooks/useCategoriasClientes';
import ClientCategoryPanel from './components/ClientCategoryPanel';
import './CategoriasClientes.css';

export default function CategoriasClientes() {
  const { categorias, loading, error, createCategoria, updateCategoria, deleteCategoria } = useCategoriasClientes();
  const [nombre, setNombre] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para edición
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');

  // Estados para eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    try {
      await createCategoria(nombre);
      setNombre('');
      setSuccessMessage('Categoría creada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      // El error ya se maneja en el hook
    }
  };

  const handleEdit = (category: CategoriaCliente) => {
    setEditingId(category.cliente_categoria_id);
    setEditingNombre(category.nombre);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingNombre.trim()) return;
    try {
      await updateCategoria(id, editingNombre);
      setEditingId(null);
      setEditingNombre('');
      setSuccessMessage('Categoría actualizada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      // Error manejado en hook
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingNombre('');
  };

  const handleAskDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCategoria(deleteId);
      setSuccessMessage('Categoría eliminada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      // Error manejado en hook
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="page-container client-category-page">
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="state-info">Cargando...</div>}

      <div className="client-category-grid">
        <ClientCategoryPanel
          categorias={categorias}
          nombre={nombre}
          setNombre={setNombre}
          onSubmit={handleSubmit}
          editingId={editingId}
          editingNombre={editingNombre}
          setEditingNombre={setEditingNombre}
          onEdit={handleEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleAskDelete}
        />
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar categoría?</h3>
            <p>Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar esta categoría?</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={handleCancelDelete}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
