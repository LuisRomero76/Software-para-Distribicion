import { useEffect, useState } from 'react';
import { request } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import { Package, CheckCircle } from 'lucide-react';

export default function AddProduct() {
  const { auth } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showShipping, setShowShipping] = useState(false);
  
  const [formData, setFormData] = useState({
    cod_barra: '',
    nombre: '',
    descripcion: '',
    tamaño: '',
    precio_unitario: '',
    fecha_vencimiento: '',
    category_id: '',
    sub_category_id: ''
  });

  const [shippingData, setShippingData] = useState({
    unidades_caja: '',
    precio_unidad_envio: '',
    precio_caja_envio: '',
    flete: ''
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
        setSubCategories(data);
      } catch (e) {
        console.error('Error al cargar subcategorías:', e);
      }
    };

    loadCategories();
    loadSubCategories();
  }, [auth?.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.cod_barra || !formData.nombre || !formData.descripcion || 
        !formData.tamaño || !formData.precio_unitario || !formData.fecha_vencimiento ||
        !formData.category_id || !formData.sub_category_id) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    if (showShipping && (!shippingData.unidades_caja || !shippingData.precio_unidad_envio || 
        !shippingData.precio_caja_envio || !shippingData.flete)) {
      setError('Si agregas información de envío, completa todos los campos de envío.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        cod_barra: formData.cod_barra,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tamaño: formData.tamaño,
        precio_unitario: parseFloat(formData.precio_unitario),
        fecha_vencimiento: formData.fecha_vencimiento,
        category_id: parseInt(formData.category_id),
        sub_category_id: parseInt(formData.sub_category_id)
      };

      if (showShipping) {
        payload.shipping = {
          unidades_caja: parseInt(shippingData.unidades_caja),
          precio_unidad_envio: parseFloat(shippingData.precio_unidad_envio),
          precio_caja_envio: parseFloat(shippingData.precio_caja_envio),
          flete: parseFloat(shippingData.flete)
        };
      }

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
        precio_unitario: '',
        fecha_vencimiento: '',
        category_id: '',
        sub_category_id: ''
      });
      setShippingData({
        unidades_caja: '',
        precio_unidad_envio: '',
        precio_caja_envio: '',
        flete: ''
      });
      setShowShipping(false);
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
              <span className="label-text">Código de Barras *</span>
              <input
                type="text"
                className="form-input"
                value={formData.cod_barra}
                onChange={e => setFormData({ ...formData, cod_barra: e.target.value })}
                placeholder="7772107000308"
                required
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

            <label className="form-field full-width">
              <span className="label-text">Descripción *</span>
              <input
                type="text"
                className="form-input"
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Vino tinto premium de la casa"
                required
              />
            </label>

            <label className="form-field">
              <span className="label-text">Tamaño *</span>
              <input
                type="text"
                className="form-input"
                value={formData.tamaño}
                onChange={e => setFormData({ ...formData, tamaño: e.target.value })}
                placeholder="750ml"
                required
              />
            </label>

            <label className="form-field">
              <span className="label-text">Precio Unitario (S/) *</span>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.precio_unitario}
                onChange={e => setFormData({ ...formData, precio_unitario: e.target.value })}
                placeholder="12.99"
                required
              />
            </label>

            <label className="form-field">
              <span className="label-text">Fecha de Vencimiento *</span>
              <input
                type="date"
                className="form-input"
                value={formData.fecha_vencimiento}
                onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                required
              />
            </label>

            <label className="form-field">
              <span className="label-text">Categoría *</span>
              <select
                className="form-input"
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
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

            <label className="form-field">
              <span className="label-text">Subcategoría *</span>
              <select
                className="form-input"
                value={formData.sub_category_id}
                onChange={e => setFormData({ ...formData, sub_category_id: e.target.value })}
                required
              >
                <option value="">Seleccionar subcategoría...</option>
                {subCategories.map(sub => (
                  <option key={sub.sub_category_id} value={sub.sub_category_id}>
                    {sub.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: '20px', marginBottom: '15px' }}>
            <button
              type="button"
              className="btn outline"
              onClick={() => setShowShipping(!showShipping)}
            >
              {showShipping ? 'Ocultar información de envío' : 'Agregar información de envío'}
            </button>
          </div>

          {showShipping && (
            <>
              <h4 style={{ marginBottom: '10px' }}>Información de Envío</h4>
              <div className="form-grid">
                <label className="form-field">
                  <span className="label-text">Unidades por Caja *</span>
                  <input
                    type="number"
                    className="form-input"
                    value={shippingData.unidades_caja}
                    onChange={e => setShippingData({ ...shippingData, unidades_caja: e.target.value })}
                    placeholder="6"
                  />
                </label>

                <label className="form-field">
                  <span className="label-text">Precio Unidad Envío (S/) *</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={shippingData.precio_unidad_envio}
                    onChange={e => setShippingData({ ...shippingData, precio_unidad_envio: e.target.value })}
                    placeholder="432.00"
                  />
                </label>

                <label className="form-field">
                  <span className="label-text">Precio Caja Envío (S/) *</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={shippingData.precio_caja_envio}
                    onChange={e => setShippingData({ ...shippingData, precio_caja_envio: e.target.value })}
                    placeholder="2052.00"
                  />
                </label>

                <label className="form-field">
                  <span className="label-text">Flete (S/) *</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={shippingData.flete}
                    onChange={e => setShippingData({ ...shippingData, flete: e.target.value })}
                    placeholder="5.00"
                  />
                </label>
              </div>
            </>
          )}

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
