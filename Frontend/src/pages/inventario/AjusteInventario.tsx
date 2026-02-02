import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllProducts, type Producto } from '../../services/productService';
import { crearAjusteInventario, type AjusteInventario } from '../../services/loteService';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '../../components/Autocomplete';
import '../../styles/page.css';
import '../compras/compras.css';

interface AjusteFormItem {
  id: string;
  producto_id: number;
  cantidad: number;
  modo: 'unidad' | 'paquete';
  paquetes?: number;
  fecha_vencimiento: string;
  observaciones: string;
  producto?: Producto;
}

export default function AjusteInventario() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ajustes, setAjustes] = useState<AjusteFormItem[]>([{
    id: crypto.randomUUID(),
    producto_id: 0,
    cantidad: 1,
    modo: 'paquete',
    paquetes: 1,
    fecha_vencimiento: '',
    observaciones: 'Inventario inicial',
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProductos(data);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const agregarAjuste = () => {
    setAjustes([
      ...ajustes,
      {
        id: crypto.randomUUID(),
        producto_id: 0,
        cantidad: 1,
        modo: 'paquete',
        paquetes: 1,
        fecha_vencimiento: '',
        observaciones: 'Inventario inicial',
      },
    ]);
  };

  const eliminarAjuste = (index: number) => {
    if (ajustes.length > 1) {
      setAjustes(ajustes.filter((_, i) => i !== index));
    }
  };

  const handleAjusteChange = (index: number, field: string, value: any) => {
    const nuevosAjustes = [...ajustes];
    
    if (field === 'producto_id') {
      const producto = productos.find(p => p.product_id === value);
      if (producto) {
        nuevosAjustes[index].producto_id = value;
        nuevosAjustes[index].producto = producto;
        nuevosAjustes[index].cantidad = 1;
        nuevosAjustes[index].paquetes = 1;
      }
    } else if (field === 'cantidad') {
      nuevosAjustes[index].cantidad = Math.max(1, parseInt(value) || 0);
    } else if (field === 'paquetes') {
      nuevosAjustes[index].paquetes = Math.max(1, parseInt(value) || 0);
    } else if (field === 'modo') {
      nuevosAjustes[index].modo = value as 'unidad' | 'paquete';
    } else if (field === 'fecha_vencimiento') {
      nuevosAjustes[index].fecha_vencimiento = value;
    } else if (field === 'observaciones') {
      nuevosAjustes[index].observaciones = value;
    }
    
    setAjustes(nuevosAjustes);
  };

  const validarFormulario = (): boolean => {
    if (ajustes.some(a => a.producto_id === 0)) {
      setError('Todos los productos deben estar seleccionados');
      return false;
    }
    
    if (ajustes.some(a => (a.modo === 'unidad' ? a.cantidad <= 0 : (a.paquetes ?? 0) <= 0))) {
      setError('La cantidad/paquetes debe ser mayor a 0');
      return false;
    }
    
    if (ajustes.some(a => !a.fecha_vencimiento)) {
      setError('Todos los ajustes deben tener fecha de vencimiento');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setLoading(true);
    setError(null);
    
    try {
      for (const ajuste of ajustes) {
        const ajusteData: AjusteInventario = {
          producto_id: ajuste.producto_id,
          cantidad: ajuste.modo === 'paquete' ? (ajuste.paquetes ?? 1) : ajuste.cantidad,
          modo: ajuste.modo,
          fecha_vencimiento: ajuste.fecha_vencimiento,
          observaciones: ajuste.observaciones,
        };
        await crearAjusteInventario(ajusteData);
      }

      alert('¡Ajustes de inventario registrados exitosamente!');
      navigate('/inventario/lotes-disponibles');
    } catch (err) {
      setError('Error al registrar ajustes de inventario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && productos.length === 0) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Ajuste de Inventario</h2>
          <p className="page-subtitle">
            Registra productos que ya tienes en stock sin crear una compra
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <AlertCircle size={18} />
        <div>
          <strong>Nota importante:</strong> Este módulo NO crea compras ni registra gastos. 
          Solo agrega productos a tu inventario disponible para ventas.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="compra-form">
        {/* Productos */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title">Productos a Registrar</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={agregarAjuste}
            >
              <Plus size={18} />
              Agregar Producto
            </button>
          </div>

          <div className="products-list">
            {ajustes.map((item, index) => {
              const unidadesPorPaquete = item.producto?.cant_por_paquete ?? 0;
              const totalUnidades = item.modo === 'paquete' 
                ? (item.paquetes ?? 1) * unidadesPorPaquete 
                : item.cantidad;

              return (
                <div key={item.id} className="product-card">
                  <div className="product-form-group">
                    <label htmlFor={`producto-${index}`}>Producto *</label>
                    <Autocomplete
                      id={`producto-${index}`}
                      options={productos.map(p => ({
                        value: p.product_id,
                        label: p.nombre,
                        subtitle: p.categoria ? `Categoría: ${p.categoria.nombre}` : undefined
                      }))}
                      value={item.producto_id}
                      onChange={(value) => {
                        const idVal = typeof value === 'number' ? value : parseInt(value as string);
                        handleAjusteChange(index, 'producto_id', idVal);
                      }}
                      placeholder="Buscar producto..."
                      required
                    />
                  </div>

                  <div className="product-form-group">
                    <label htmlFor={`modo-${index}`}>Modo *</label>
                    <select
                      id={`modo-${index}`}
                      value={item.modo}
                      onChange={(e) => handleAjusteChange(index, 'modo', e.target.value)}
                      required
                    >
                      <option value="unidad">Por unidad</option>
                      <option value="paquete">Por paquete</option>
                    </select>
                  </div>

                  {item.modo === 'paquete' && (
                    <div className="product-form-group">
                      <label htmlFor={`paquetes-${index}`}>Paquetes *</label>
                      <input
                        id={`paquetes-${index}`}
                        type="number"
                        min="1"
                        value={item.paquetes ?? 1}
                        onChange={(e) => handleAjusteChange(index, 'paquetes', e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {item.modo === 'paquete' && (
                    <div className="product-form-group">
                      <label>Unidades por paquete</label>
                      <input
                        type="text"
                        value={unidadesPorPaquete}
                        className="input-disabled"
                        disabled
                      />
                    </div>
                  )}

                  {item.modo === 'unidad' && (
                    <div className="product-form-group">
                      <label htmlFor={`cantidad-${index}`}>Cantidad *</label>
                      <input
                        id={`cantidad-${index}`}
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleAjusteChange(index, 'cantidad', e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="product-form-group">
                    <label htmlFor={`vencimiento-${index}`}>Fecha de Vencimiento *</label>
                    <input
                      id={`vencimiento-${index}`}
                      type="date"
                      value={item.fecha_vencimiento}
                      onChange={(e) => handleAjusteChange(index, 'fecha_vencimiento', e.target.value)}
                      required
                    />
                  </div>

                  <div className="product-form-group">
                    <label htmlFor={`observaciones-${index}`}>Observaciones</label>
                    <input
                      id={`observaciones-${index}`}
                      type="text"
                      value={item.observaciones}
                      onChange={(e) => handleAjusteChange(index, 'observaciones', e.target.value)}
                      placeholder="Ej: Inventario inicial, Corrección de stock, etc."
                    />
                  </div>

                  <div className="product-form-group">
                    <label>Total en Unidades</label>
                    <input
                      type="text"
                      value={`${totalUnidades} unidades`}
                      className="input-disabled"
                      disabled
                    />
                  </div>

                  {ajustes.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => eliminarAjuste(index)}
                      title="Eliminar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/inventario/lotes-disponibles')}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Registrar Inventario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
