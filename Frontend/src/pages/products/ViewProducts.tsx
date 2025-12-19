import { useEffect, useState } from 'react';
import { request } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import { Eye, Edit2, Search, RefreshCw, Trash2, Download } from 'lucide-react';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';

interface Product {
  product_id: number;
  cod_barra?: string;
  nombre: string;
  descripcion?: string;
  tamaño?: string;
  category_id: number;
  sub_category_id: number;
  fecha_creacion: string;
  createdAt: string;
  category?: { category_id: number; nombre: string };
  subCategory?: { sub_category_id: number; nombre: string };
}

export default function ViewProducts() {
  const { auth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    cod_barra: '',
    nombre: '',
    descripcion: '',
    tamaño: '',
    category_id: '',
    sub_category_id: ''
  });
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await request<Product[]>('/product', {}, auth?.token);
      setProducts(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await request<any[]>('/category', {}, auth?.token);
      setCategories(data);
    } catch (e: any) {
      console.error('Error al cargar categorías:', e);
    }
  };

  const loadSubCategories = async () => {
    try {
      const data = await request<any[]>('/sub-category', {}, auth?.token);
      setSubCategories(data);
    } catch (e: any) {
      console.error('Error al cargar subcategorías:', e);
    }
  };

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Ver Productos';
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSubCategories();
  }, [auth?.token]);

  const filteredProducts = products.filter(product => 
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryDisplay = (product: Product) => {
    const categoryName = product.category?.nombre?.trim();
    const subCategoryName = product.subCategory?.nombre?.trim();
    if (categoryName && subCategoryName) return `${categoryName} - ${subCategoryName}`;
    return categoryName || '';
  };

  // Paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await request(`/product/${deleteProduct.product_id}`, { method: 'DELETE' }, auth?.token);
      setProducts(products.filter(p => p.product_id !== deleteProduct.product_id));
      setDeleteProduct(null);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo eliminar el producto');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditMode(true);
    setEditForm({
      cod_barra: product.cod_barra || '',
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      tamaño: product.tamaño || '',
      category_id: product.category_id.toString(),
      sub_category_id: product.sub_category_id.toString()
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setSaving(true);
    try {
      const payload: any = {
        nombre: editForm.nombre,
        category_id: parseInt(editForm.category_id),
        sub_category_id: parseInt(editForm.sub_category_id)
      };

      if (editForm.cod_barra?.trim()) payload.cod_barra = editForm.cod_barra.trim();
      if (editForm.descripcion?.trim()) payload.descripcion = editForm.descripcion.trim();
      if (editForm.tamaño?.trim()) payload.tamaño = editForm.tamaño.trim();

      const updated = await request<Product>(
        `/product/${selectedProduct.product_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        },
        auth?.token
      );
      
      setProducts(products.map(p => p.product_id === selectedProduct.product_id ? updated : p));
      setSelectedProduct(null);
      setEditMode(false);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = products.map(product => {
      return {
        'ID': product.product_id,
        'Código de Barras': product.cod_barra || '',
        'Nombre': product.nombre,
        'Descripción': product.descripcion || '',
        'Tamaño': product.tamaño || '',
        'Categoría': product.category?.nombre || '',
        'Subcategoría': product.subCategory?.nombre || '',
        'Fecha de Creación': new Date(product.createdAt).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    const columnWidths = [
      { wch: 8 }, // ID
      { wch: 20 }, // Código de Barras
      { wch: 30 }, // Nombre
      { wch: 40 }, // Descripción
      { wch: 15 }, // Tamaño
      { wch: 20 }, // Categoría
      { wch: 20 }, // Subcategoría
      { wch: 20 }  // Fecha de Creación
    ];
    worksheet['!cols'] = columnWidths;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `productos_${year}-${month}-${day}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Ver Productos</h2>
          <p className="page-subtitle">Gestiona el catálogo de productos</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-export" onClick={exportToExcel} disabled={products.length === 0} title="Exportar a Excel">
            <Download size={18} /> Exportar
          </button>
          <button className="btn-refresh" onClick={loadProducts} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por código, nombre o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-info">
            {filteredProducts.length} de {products.length} producto(s)
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando productos...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">No hay productos registrados.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Tamaño</th>
                <th>Categoría</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => (
                <tr key={product.product_id}>
                  <td className="id-col">{product.product_id}</td>
                  <td>{product.cod_barra || '-'}</td>
                  <td className="name-col">{product.nombre}</td>
                  <td>{product.descripcion || '-'}</td>
                  <td>{product.tamaño || '-'}</td>
                  <td>{getCategoryDisplay(product) || '-'}</td>
                  <td className="actions-col">
                    <button className="action-btn view" onClick={() => { setSelectedProduct(product); setEditMode(false); }} title="Ver detalles">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn edit" onClick={() => handleEdit(product)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => setDeleteProduct(product)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedProduct && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => { setSelectedProduct(null); setEditMode(false); }}>
          <div className="modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Producto' : 'Detalles del Producto'}</h3>
              <button className="modal-close" onClick={() => { setSelectedProduct(null); setEditMode(false); }}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="form-field">
                    <span className="label-text">Código de Barras</span>
                    <input
                      type="text"
                      className="form-input"
                      value={editMode ? editForm.cod_barra : selectedProduct.cod_barra}
                      onChange={e => setEditForm({ ...editForm, cod_barra: e.target.value })}
                      disabled={!editMode}
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Nombre</span>
                    <input
                      type="text"
                      className="form-input"
                      value={editMode ? editForm.nombre : selectedProduct.nombre}
                      onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                      disabled={!editMode}
                    />
                  </label>
                  <label className="form-field full-width">
                    <span className="label-text">Descripción</span>
                    <input
                      type="text"
                      className="form-input"
                      value={editMode ? editForm.descripcion : selectedProduct.descripcion}
                      onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
                      disabled={!editMode}
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Tamaño</span>
                    <input
                      type="text"
                      className="form-input"
                      value={editMode ? editForm.tamaño : (selectedProduct.tamaño || '')}
                      onChange={e => setEditForm({ ...editForm, tamaño: e.target.value })}
                      disabled={!editMode}
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Categoría</span>
                    {editMode ? (
                      <select
                        className="form-input"
                        value={editForm.category_id}
                        onChange={e => setEditForm({ ...editForm, category_id: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map(cat => (
                          <option key={cat.category_id} value={cat.category_id}>{cat.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-input" value={selectedProduct.category?.nombre || ''} disabled />
                    )}
                  </label>
                  <label className="form-field">
                    <span className="label-text">Subcategoría</span>
                    {editMode ? (
                      <select
                        className="form-input"
                        value={editForm.sub_category_id}
                        onChange={e => setEditForm({ ...editForm, sub_category_id: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        {subCategories.map(sub => (
                          <option key={sub.sub_category_id} value={sub.sub_category_id}>{sub.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-input" value={selectedProduct.subCategory?.nombre || ''} disabled />
                    )}
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setSelectedProduct(null); setEditMode(false); }} disabled={saving}>Cerrar</button>
                {editMode && (
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteProduct && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar producto?</h3>
            <p>Se eliminará el producto "{deleteProduct.nombre}" del sistema.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setDeleteProduct(null)}>Cancelar</button>
              <button className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
