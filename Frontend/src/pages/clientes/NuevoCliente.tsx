import { useState, useEffect } from 'react';
import { useClientes, type CreateClientePayload } from './hooks/useClientes';
import { useCategoriasClientes } from './hooks/useCategoriasClientes';
import { Visita } from './types/visita';
import { DiaVisita } from './types/dia-visita';
import { UserPlus, Trash2, Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapSelector from './components/MapSelector';

export default function NuevoCliente() {
  const { createCliente } = useClientes();
  const { categorias } = useCategoriasClientes();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const [form, setForm] = useState<CreateClientePayload>({
    sub_canal: '',
    nombre: '',
    direccion: '',
    cliente_categoria_ids: [],
  });
  const [telefonos, setTelefonos] = useState<{ numero: string; nombre_contacto?: string }[]>([]);

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Nuevo Cliente';
  }, []);

  const update = (k: keyof CreateClientePayload, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }));
    // Limpiar error si el usuario está editando el campo que tiene error
    if (k === errorField) {
      setError(null);
      setErrorField(null);
    }
  };

  const toggleCategoria = (id: number) => {
    setForm(prev => {
      const set = new Set(prev.cliente_categoria_ids);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...prev, cliente_categoria_ids: Array.from(set) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.nombre || !form.direccion || !form.sub_canal) {
      setError('Por favor completa los campos obligatorios (Nombre, Dirección, Sub Canal)');
      return;
    }

    setLoading(true);
    try {
      await createCliente({ ...form, telefonos_referencia: telefonos });
      setSuccess('Cliente registrado correctamente');
      setTimeout(() => {
        navigate('/clientes');
      }, 1500);
    } catch (err: any) {
      console.error('Error al crear cliente:', err);
      
      // Detectar errores específicos
      let errorMessage = 'Error al crear cliente';
      let fieldWithError: string | null = null;
      
      if (err?.message) {
        const msg = err.message.toLowerCase();
        
        // Detectar error de NIT/CI duplicado
        if (msg.includes('duplicate') || msg.includes('duplicado') || msg.includes('unique') || msg.includes('nit_ci') || msg.includes('ya está registrado')) {
          errorMessage = '❌ El campo NIT/CI ya está registrado en otro cliente';
          fieldWithError = 'nit_ci';
        } 
        // Detectar otros errores de duplicados
        else if (msg.includes('already exists') || msg.includes('ya existe')) {
          errorMessage = 'Ya existe un cliente con estos datos. Por favor, verifique la información ingresada.';
        }
        // Error de validación
        else if (msg.includes('validation') || msg.includes('validación')) {
          errorMessage = 'Error de validación: ' + err.message;
        }
        // Si es "Internal server error" y tenemos un NIT/CI, probablemente sea duplicado
        else if (msg.includes('internal server error') && form.nit_ci) {
          errorMessage = '❌ El campo NIT/CI ya está registrado en otro cliente';
          fieldWithError = 'nit_ci';
        }
        // Otros errores
        else if (!msg.includes('internal server error')) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setErrorField(fieldWithError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title"><UserPlus size={28} /> Registrar Cliente</h2>
          <p className="page-subtitle">Agrega un nuevo cliente a la base de datos</p>
        </div>
      </div>

      <div className="form-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Información General</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Nombre del Contribuyente *</label>
                <input
                  className="form-input"
                  value={form.nombre}
                  onChange={e => update('nombre', e.target.value)}
                  maxLength={100}
                  placeholder="Ej. María Rosales"
                />
              </div>

              <div className="form-group">
                <label>NIT / CI {errorField === 'nit_ci' && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginLeft: '8px' }}>⚠ Este campo está duplicado</span>}</label>
                <input
                  type="number"
                  className={`form-input ${errorField === 'nit_ci' ? 'input-error' : ''}`}
                  value={form.nit_ci || ''}
                  onChange={e => update('nit_ci', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Número de identificación"
                  style={errorField === 'nit_ci' ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                />
              </div>

              <div className="form-group">
                <label>Sub Canal *</label>
                <input
                  className="form-input"
                  value={form.sub_canal}
                  onChange={e => update('sub_canal', e.target.value)}
                  maxLength={100}
                  placeholder="Ej. Tienda de Barrio"
                />
              </div>

              <div className="form-group">
                <label>Visita</label>
                <select
                  className="form-input"
                  value={form.visita || ''}
                  onChange={e => update('visita', e.target.value as any)}
                >
                  <option value="">Sin especificar</option>
                  <option value={Visita.DIA}>{Visita.DIA}</option>
                  <option value={Visita.NOCHE}>{Visita.NOCHE}</option>
                </select>
              </div>

              <div className="form-group">
                <label>Día de visita</label>
                <select
                  className="form-input"
                  value={form.dia_visita || ''}
                  onChange={e => update('dia_visita', e.target.value || undefined)}
                >
                  <option value="">Sin especificar</option>
                  <option value={DiaVisita.LUNES}>{DiaVisita.LUNES}</option>
                  <option value={DiaVisita.MARTES}>{DiaVisita.MARTES}</option>
                  <option value={DiaVisita.MIERCOLES}>{DiaVisita.MIERCOLES}</option>
                  <option value={DiaVisita.JUEVES}>{DiaVisita.JUEVES}</option>
                  <option value={DiaVisita.VIERNES}>{DiaVisita.VIERNES}</option>
                  <option value={DiaVisita.SABADO}>{DiaVisita.SABADO}</option>
                  <option value={DiaVisita.DOMINGO}>{DiaVisita.DOMINGO}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Ubicación y Contacto</h3>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Dirección *</label>
                <input
                  className="form-input"
                  value={form.direccion}
                  onChange={e => update('direccion', e.target.value)}
                  maxLength={200}
                  placeholder="Dirección completa"
                />
              </div>

              <div className="form-group">
                <label>Ciudad</label>
                <input
                  className="form-input"
                  value={form.ciudad || ''}
                  onChange={e => update('ciudad', e.target.value || undefined)}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Teléfono Principal</label>
                <input
                  className="form-input"
                  value={form.telefono || ''}
                  onChange={e => update('telefono', e.target.value || undefined)}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label>Coordenadas</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="form-input"
                    value={form.coordenadas || ''}
                    onChange={e => update('coordenadas', e.target.value || undefined)}
                    maxLength={200}
                    placeholder="-16.5,-68.15"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowMapModal(true)}
                    title="Seleccionar en el mapa"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <MapPin size={18} /> Mapa
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Categorización</h3>
            <div className="form-group">
              <label>Seleccione las categorías</label>
              <div className="chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {categorias.map(cat => (
                  <button
                    type="button"
                    key={cat.cliente_categoria_id}
                    className={`chip ${form.cliente_categoria_ids.includes(cat.cliente_categoria_id) ? 'active' : ''}`}
                    onClick={() => toggleCategoria(cat.cliente_categoria_id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      border: '1px solid var(--border)',
                      background: form.cliente_categoria_ids.includes(cat.cliente_categoria_id) ? 'var(--primary)' : 'var(--card)',
                      color: form.cliente_categoria_ids.includes(cat.cliente_categoria_id) ? 'white' : 'var(--text)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Teléfonos de Referencia</h3>
            {telefonos.map((tel, idx) => (
              <div key={idx} className="form-grid" style={{ marginBottom: '1rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label>Número</label>
                  <input
                    className="form-input"
                    value={tel.numero}
                    onChange={e => {
                      const newTels = [...telefonos];
                      newTels[idx].numero = e.target.value;
                      setTelefonos(newTels);
                    }}
                    placeholder="Número de referencia"
                  />
                </div>
                <div className="form-group">
                  <label>Nombre Contacto</label>
                  <input
                    className="form-input"
                    value={tel.nombre_contacto || ''}
                    onChange={e => {
                      const newTels = [...telefonos];
                      newTels[idx].nombre_contacto = e.target.value;
                      setTelefonos(newTels);
                    }}
                    placeholder="Nombre del contacto"
                  />
                </div>
                <button
                  type="button"
                  className="btn-icon btn-icon-danger"
                  onClick={() => setTelefonos(telefonos.filter((_, i) => i !== idx))}
                  style={{ marginBottom: '2px', height: '42px', width: '42px' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setTelefonos([...telefonos, { numero: '' }])}
            >
              <Plus size={16} /> Añadir teléfono
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn outline" onClick={() => navigate('/clientes')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>

      <MapSelector
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelect={(coordinates) => update('coordenadas', coordinates)}
        initialCoordinates={form.coordenadas}
      />
    </div>
  );
}
