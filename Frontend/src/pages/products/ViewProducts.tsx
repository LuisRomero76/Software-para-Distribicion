import { useEffect, useState } from 'react';
import { request } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import { Eye, Edit2, Search, RefreshCw, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Product {
  product_id: number;
  cod_barra: string;
  nombre: string;
  descripcion: string;
  tamaño: string;
  precio_unitario: number;
  fecha_vencimiento: string;
  category_id: number;
  sub_category_id: number;
  fecha_creacion: string;
  createdAt: string;
  category?: { category_id: number; nombre: string };
  subCategory?: { sub_category_id: number; nombre: string };
  shippingInfo?: Array<{
    shipping_id: number;
    unidades_caja: number;
    precio_unidad_envio: number;
    precio_caja_envio: number;
    flete: number;
  }>;
}

export default function ViewProducts() {
  const { auth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    cod_barra: '',
    nombre: '',
    descripcion: '',
    tamaño: '',
    precio_unitario: '',
    fecha_vencimiento: '',
    category_id: '',
    sub_category_id: '',
    unidades_caja: '',
    precio_unidad_envio: '',
    precio_caja_envio: '',
    flete: ''
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
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.cod_barra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const shipping = product.shippingInfo?.[0];
    setEditForm({
      cod_barra: product.cod_barra,
      nombre: product.nombre,
      descripcion: product.descripcion,
      tamaño: product.tamaño,
      precio_unitario: product.precio_unitario.toString(),
      fecha_vencimiento: product.fecha_vencimiento.split('T')[0],
      category_id: product.category_id.toString(),
      sub_category_id: product.sub_category_id.toString(),
      unidades_caja: shipping?.unidades_caja?.toString() || '',
      precio_unidad_envio: shipping?.precio_unidad_envio?.toString() || '',
      precio_caja_envio: shipping?.precio_caja_envio?.toString() || '',
      flete: shipping?.flete?.toString() || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setSaving(true);
    try {
      const payload: any = {
        cod_barra: editForm.cod_barra,
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        tamaño: editForm.tamaño,
        precio_unitario: parseFloat(editForm.precio_unitario),
        fecha_vencimiento: editForm.fecha_vencimiento,
        category_id: parseInt(editForm.category_id),
        sub_category_id: parseInt(editForm.sub_category_id)
      };

      if (editForm.unidades_caja) {
        payload.shipping = {
          unidades_caja: parseInt(editForm.unidades_caja),
          precio_unidad_envio: parseFloat(editForm.precio_unidad_envio),
          precio_caja_envio: parseFloat(editForm.precio_caja_envio),
          flete: parseFloat(editForm.flete)
        };
      }

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
      const shipping = product.shippingInfo?.[0];
      return {
        'ID': product.product_id,
        'Código de Barras': product.cod_barra,
        'Nombre': product.nombre,
        'Descripción': product.descripcion,
        'Tamaño': product.tamaño,
        'Precio Unitario': product.precio_unitario,
        'Fecha Vencimiento': new Date(product.fecha_vencimiento).toLocaleDateString('es-ES'),
        'Categoría': product.category?.nombre || '',
        'Subcategoría': product.subCategory?.nombre || '',
        'Unidades por Caja': shipping?.unidades_caja || '',
        'Precio Unidad Envío': shipping?.precio_unidad_envio || '',
        'Precio Caja Envío': shipping?.precio_caja_envio || '',
        'Flete': shipping?.flete || '',
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
      { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, 
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
      { wch: 10 }, { wch: 20 }
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
                <th>Tamaño</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.product_id}>
                  <td className="id-col">{product.product_id}</td>
                  <td>{product.cod_barra}</td>
                  <td className="name-col">{product.nombre}</td>
                  <td>{product.tamaño}</td>
                  <td>Bs/ {Number(product.precio_unitario).toFixed(2)}</td>
                  <td>{product.category?.nombre || ''}</td>
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
                      value={editMode ? editForm.tamaño : selectedProduct.tamaño}
                      onChange={e => setEditForm({ ...editForm, tamaño: e.target.value })}
                      disabled={!editMode}
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Precio Unitario</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editMode ? editForm.precio_unitario : selectedProduct.precio_unitario}
                      onChange={e => setEditForm({ ...editForm, precio_unitario: e.target.value })}
                      disabled={!editMode}
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Fecha de Vencimiento</span>
                    <input
                      type="date"
                      className="form-input"
                      value={editMode ? editForm.fecha_vencimiento : selectedProduct.fecha_vencimiento.split('T')[0]}
                      onChange={e => setEditForm({ ...editForm, fecha_vencimiento: e.target.value })}
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

                {(selectedProduct.shippingInfo?.[0] || editMode) && (
                  <>
                    <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Información de Envío</h4>
                    <div className="form-grid">
                      <label className="form-field">
                        <span className="label-text">Unidades por Caja</span>
                        <input
                          type="number"
                          className="form-input"
                          value={editMode ? editForm.unidades_caja : selectedProduct.shippingInfo?.[0]?.unidades_caja || ''}
                          onChange={e => setEditForm({ ...editForm, unidades_caja: e.target.value })}
                          disabled={!editMode}
                        />
                      </label>
                      <label className="form-field">
                        <span className="label-text">Precio Unidad Envío</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={editMode ? editForm.precio_unidad_envio : selectedProduct.shippingInfo?.[0]?.precio_unidad_envio || ''}
                          onChange={e => setEditForm({ ...editForm, precio_unidad_envio: e.target.value })}
                          disabled={!editMode}
                        />
                      </label>
                      <label className="form-field">
                        <span className="label-text">Precio Caja Envío</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={editMode ? editForm.precio_caja_envio : selectedProduct.shippingInfo?.[0]?.precio_caja_envio || ''}
                          onChange={e => setEditForm({ ...editForm, precio_caja_envio: e.target.value })}
                          disabled={!editMode}
                        />
                      </label>
                      <label className="form-field">
                        <span className="label-text">Flete</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={editMode ? editForm.flete : selectedProduct.shippingInfo?.[0]?.flete || ''}
                          onChange={e => setEditForm({ ...editForm, flete: e.target.value })}
                          disabled={!editMode}
                        />
                      </label>
                    </div>
                  </>
                )}
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
