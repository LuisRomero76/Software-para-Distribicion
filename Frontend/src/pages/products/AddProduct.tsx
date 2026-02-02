import { useEffect, useState } from 'react';
import { request } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import { Package, CheckCircle } from 'lucide-react';

export default function AddProduct() {
  const { auth } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    cod_barra: '',
    nombre: '',
    descripcion: '',
    tamaño: '',
    precio_venta_sin_factura: '',
    precio_venta_con_factura: '',
    precio_compra: '',
    precio_compra_paquete: '',
    precio_venta_paquete_sin_factura: '',
    precio_venta_paquete_con_factura: '',
    cant_por_paquete: '',
    category_id: '',
    sub_category_id: ''
  });

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Registrar Producto';
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await request<any[]>('/category', {}, auth?.token);
        setCategories(data);
      } catch (e) {
        console.error('Error al cargar categorías:', e);
      }
    };

    const loadSubCategories = async () => {
      try {
        const data = await request<any[]>('/sub-category', {}, auth?.token);
        setAllSubCategories(data);
      } catch (e) {
        console.error('Error al cargar subcategorías:', e);
      }
    };

    loadCategories();
    loadSubCategories();
  }, [auth?.token]);

  // Cuando cambia la categoría, filtrar subcategorías
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setFormData({ ...formData, category_id: categoryId, sub_category_id: '' });
    
    if (categoryId) {
      const filtered = allSubCategories.filter(sub => sub.category_id === parseInt(categoryId));
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.nombre || !formData.category_id) {
      setError('Completa el nombre y categoría.');
      return;
    }

    if (!formData.precio_venta_sin_factura || formData.precio_venta_sin_factura.trim() === '') {
      setError('El precio de venta sin factura es requerido.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        nombre: formData.nombre,
        category_id: parseInt(formData.category_id),
        precio_venta_sin_factura: parseFloat(formData.precio_venta_sin_factura)
      };

      if (formData.cod_barra?.trim()) payload.cod_barra = formData.cod_barra.trim();
      if (formData.descripcion?.trim()) payload.descripcion = formData.descripcion.trim();
      if (formData.tamaño?.trim()) payload.tamaño = formData.tamaño.trim();
      if (formData.sub_category_id) payload.sub_category_id = parseInt(formData.sub_category_id);
      if (formData.precio_venta_con_factura) payload.precio_venta_con_factura = parseFloat(formData.precio_venta_con_factura);
      if (formData.precio_compra) payload.precio_compra = parseFloat(formData.precio_compra);
      if (formData.precio_compra_paquete) payload.precio_compra_paquete = parseFloat(formData.precio_compra_paquete);
      if (formData.precio_venta_paquete_sin_factura) payload.precio_venta_paquete_sin_factura = parseFloat(formData.precio_venta_paquete_sin_factura);
      if (formData.precio_venta_paquete_con_factura) payload.precio_venta_paquete_con_factura = parseFloat(formData.precio_venta_paquete_con_factura);
      if (formData.cant_por_paquete) payload.cant_por_paquete = parseInt(formData.cant_por_paquete);

      await request('/product', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      }, auth?.token);

      setSuccess('Producto registrado correctamente.');
      setFormData({
        cod_barra: '',
        nombre: '',
        descripcion: '',
        tamaño: '',
        precio_venta_sin_factura: '',
        precio_venta_con_factura: '',
        precio_compra: '',
        precio_compra_paquete: '',
        precio_venta_paquete_sin_factura: '',
        precio_venta_paquete_con_factura: '',
        cant_por_paquete: '',
        category_id: '',
        sub_category_id: ''
      });
      setFilteredSubCategories([]);
    } catch (err: any) {
      setError(err?.message ?? 'Error al registrar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Package size={28} /> Registrar Producto</h2>
          <p className="page-subtitle">Agrega un nuevo producto al catálogo</p>
        </div>
      </div>

      <div className="form-container">
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="label-text">Código de Barras</span>
              <input
                type="text"
                className="form-input"
                value={formData.cod_barra}
                onChange={e => setFormData({ ...formData, cod_barra: e.target.value })}
                placeholder="7772107000308"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Nombre *</span>
              <input
                type="text"
                className="form-input"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Vino Tinto"
                required
              />
            </label>

            <label className="form-field">
              <span className="label-text">Descripción</span>
              <input
                type="text"
                className="form-input"
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Vino tinto premium de la casa"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Precio Venta Sin Factura (Unitario) *</span>
              <input
                type="number"
                className="form-input"
                value={formData.precio_venta_sin_factura}
                onChange={e => setFormData({ ...formData, precio_venta_sin_factura: e.target.value })}
                step={0.01}
                min={0}
                placeholder="0.00"
                required
              />
            </label>

            <label className="form-field">
              <span className="label-text">Precio Venta Con Factura (Unitario)</span>
              <input
                type="number"
                className="form-input"
                value={formData.precio_venta_con_factura}
                onChange={e => setFormData({ ...formData, precio_venta_con_factura: e.target.value })}
                step={0.01}
                min={0}
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Precio Venta Sin Factura (Paquete)</span>
              <input
                type="number"
                className="form-input"
                value={formData.precio_venta_paquete_sin_factura}
                onChange={e => setFormData({ ...formData, precio_venta_paquete_sin_factura: e.target.value })}
                step={0.01}
                min={0}
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Precio Venta Con Factura (Paquete)</span>
              <input
                type="number"
                className="form-input"
                value={formData.precio_venta_paquete_con_factura}
                onChange={e => setFormData({ ...formData, precio_venta_paquete_con_factura: e.target.value })}
                step={0.01}
                min={0}
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Precio de compra (Unitario)</span>
              <input
                type="number"
                className="form-input"
                value={formData.precio_compra}
                onChange={e => setFormData({ ...formData, precio_compra: e.target.value })}
                step={0.01}
                min={0}
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Precio de compra (Paquete)</span>
              <input
                type="number"
                className="form-input"
                value={formData.precio_compra_paquete}
                onChange={e => setFormData({ ...formData, precio_compra_paquete: e.target.value })}
                step={0.01}
                min={0}
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Cant. por paquete</span>
              <input
                type="number"
                className="form-input"
                value={formData.cant_por_paquete}
                onChange={e => setFormData({ ...formData, cant_por_paquete: e.target.value })}
                step={1}
                min={1}
                placeholder="1"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Tamaño</span>
              <input
                type="text"
                className="form-input"
                value={formData.tamaño}
                onChange={e => setFormData({ ...formData, tamaño: e.target.value })}
                placeholder="750ml"
              />
            </label>

            <label className="form-field">
              <span className="label-text">Categoría *</span>
              <select
                className="form-input"
                value={formData.category_id}
                onChange={handleCategoryChange}
                required
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </label>

            {filteredSubCategories.length > 0 && (
              <label className="form-field">
                <span className="label-text">Subcategoría</span>
                <select
                  className="form-input"
                  value={formData.sub_category_id}
                  onChange={e => setFormData({ ...formData, sub_category_id: e.target.value })}
                >
                  <option value="">Seleccionar subcategoría...</option>
                  {filteredSubCategories.map(sub => (
                    <option key={sub.sub_category_id} value={sub.sub_category_id}>
                      {sub.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={18} /> {success}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
