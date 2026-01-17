import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, Edit2, Calendar, Map, Trash2, Plus, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiGet } from './services/api';
import { useClientes, type Cliente, type CreateClientePayload } from './hooks/useClientes';
import { useCategoriasClientes } from './hooks/useCategoriasClientes';
import { Visita } from './types/visita';
import { DiaVisita } from './types/dia-visita';
import MapSelector from './components/MapSelector';
import './ClientDetails.css';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para forzar el resize del mapa
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    // Múltiples intentos para asegurar que el mapa se renderice correctamente
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 500),
      setTimeout(() => map.invalidateSize(), 1000)
    ];
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [map]);
  
  return null;
}

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateCliente } = useClientes();
  const { categorias } = useCategoriasClientes();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CreateClientePayload>>({});
  const [telefonos, setTelefonos] = useState<{ numero: string; nombre_contacto?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [, setErrorField] = useState<string | null>(null);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        setLoading(true);
        const data = await apiGet<Cliente>(`/clientes/${id}`);
        setCliente(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCliente();
    }
  }, [id]);

  if (loading) return <div className="page-container"><div className="state-info">Cargando información del cliente...</div></div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!cliente) return <div className="page-container"><div className="alert alert-error">Cliente no encontrado</div></div>;

  // Parsear coordenadas
  const parseCoordinates = (coords?: string): [number, number] | null => {
    if (!coords) return null;
    const parts = coords.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return null;
  };

  const coordinates = parseCoordinates(cliente.coordenadas);

  const handleOpenEdit = () => {
    setEditForm({
      sub_canal: cliente.sub_canal,
      visita: cliente.visita,
      dia_visita: cliente.dia_visita,
      nit_ci: cliente.nit_ci,
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      coordenadas: cliente.coordenadas,
      telefono: cliente.telefono,
      cliente_categoria_ids: cliente.categorias.map(c => c.cliente_categoria_id),
    });
    setTelefonos(cliente.telefonos_referencia || []);
    setEditError(null);
    setEditSuccess(null);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditForm({});
    setTelefonos([]);
    setEditError(null);
    setEditSuccess(null);
  };

  const updateEditForm = (k: keyof CreateClientePayload, v: any) => {
    setEditForm(prev => ({ ...prev, [k]: v }));
  };

  const toggleCategoria = (catId: number) => {
    setEditForm(prev => {
      const set = new Set(prev.cliente_categoria_ids);
      set.has(catId) ? set.delete(catId) : set.add(catId);
      return { ...prev, cliente_categoria_ids: Array.from(set) };
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    setEditError(null);
    setEditSuccess(null);

    const payload: Partial<CreateClientePayload> = {
      sub_canal: editForm.sub_canal,
      visita: editForm.visita,
      dia_visita: editForm.dia_visita,
      nombre: editForm.nombre,
      direccion: editForm.direccion,
      ciudad: editForm.ciudad,
      coordenadas: editForm.coordenadas,
      telefono: editForm.telefono,
      cliente_categoria_ids: editForm.cliente_categoria_ids,
      telefonos_referencia: telefonos,
    };

    if (editForm.nit_ci !== undefined && editForm.nit_ci !== null) {
      payload.nit_ci = editForm.nit_ci;
    }

    try {
      setSaving(true);
      await updateCliente(cliente.cliente_id, payload);
      // Recargar datos del cliente
      const data = await apiGet<Cliente>(`/clientes/${id}`);
      setCliente(data);
      setEditSuccess('Cliente actualizado correctamente');
      
      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        setShowEditModal(false);
        setEditForm({});
        setTelefonos([]);
        setEditSuccess(null);
      }, 1500);
    } catch (e: any) {
      console.error('Error al actualizar cliente:', e);
      
      // Detectar errores específicos
      let errorMessage = 'Error al actualizar cliente';
      let fieldWithError: string | null = null;
      
      if (e.message) {
        const msg = e.message.toLowerCase();
        
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
          errorMessage = 'Error de validación: ' + e.message;
        }
        // Si es "Internal server error" y tenemos un NIT/CI, probablemente sea duplicado
        else if (msg.includes('internal server error') && editForm.nit_ci) {
          errorMessage = '❌ El campo NIT/CI ya está registrado en otro cliente';
          fieldWithError = 'nit_ci';
        }
        // Otros errores
        else if (!msg.includes('internal server error')) {
          errorMessage = e.message;
        }
      }
      
      setEditError(errorMessage);
      setErrorField(fieldWithError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="client-details-page">
      {/* Header */}
      <div className="client-details-header">
        <div className="client-details-title-section">
          <h1>{cliente.nombre}</h1>
          <span className="client-badge">Nit/CI: {cliente.nit_ci}</span>
          
          {cliente.categorias.length > 0 ? (
            <div className="categories-list">
              {cliente.categorias.map(cat => (
                <span key={cat.cliente_categoria_id} className="category-tag">
                  {cat.nombre}
                </span>
              ))}
            </div>
          ) : (<span className="empty">Sin categorías asignadas</span>)}
          
        </div>
        <div className="client-actions">
          <button onClick={() => navigate('/clientes')} className="btn-back">
            <ArrowLeft size={18} /> Volver
          </button>
          <button className="btn-edit-client" onClick={handleOpenEdit}>
            <Edit2 size={18} /> Editar Cliente
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="client-details-grid">
        {/* Información General */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-icon">
              <User size={20} />
            </div>
            <h3>Información General</h3>
          </div>
          <div className="info-grid">
            <div className="info-field">
              <span className="info-field-label">NIT/CI</span>
              <span className="info-field-value">{cliente.nit_ci || <span className="empty">No registrado</span>}</span>
            </div>
            <div className="info-field">
              <span className="info-field-label">Sub Canal</span>
              <span className="info-field-value">{cliente.sub_canal}</span>
            </div>
            <div className="info-field">
              <span className="info-field-label">Tipo de Visita</span>
              <span className="info-field-value">{cliente.visita || <span className="empty">No especificado</span>}</span>
            </div>
            <div className="info-field">
              <span className="info-field-label">Ruta Asignada</span>
              <span className="info-field-value">{cliente.ruta || <span className="empty">No asignada</span>}</span>
            </div>
          </div>
        </div>

        {/* Contacto y Programación */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-icon">
              <Phone size={20} />
            </div>
            <h3>Contacto</h3>
          </div>
          <div className="info-grid">
            <div className="info-field full-width">
              <span className="info-field-label">Teléfono Principal</span>
              <span className="info-field-value phone-value">
                {cliente.telefono ? (
                  <span className="phone-link">
                    <Phone size={16} />
                    {cliente.telefono}
                  </span>
                ) : (
                  <span className="empty">No registrado</span>
                )}
              </span>
            </div>
          </div>

          <div className="detail-section-header" style={{ marginTop: '1.5rem' }}>
            <div className="detail-section-icon">
              <Calendar size={20} />
            </div>
            <h3>Programación</h3>
          </div>
          <div className="info-grid">
            <div className="info-field full-width">
              <span className="info-field-label">Día de Visita</span>
              <span className="info-field-value">
                {cliente.dia_visita ? (cliente.dia_visita) : <span className="empty">No asignado</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda Fila */}
      <div className="client-details-grid">
        {/* Ubicación y Mapa */}
        <div className="detail-section location-section">
          <div className="detail-section-header">
            <div className="detail-section-icon">
              <MapPin size={20} />
            </div>
            <h3>Ubicación</h3>
          </div>
          <div className="info-grid">
            <div className="info-field full-width">
              <span className="info-field-label">Dirección</span>
              <span className="info-field-value">{cliente.direccion}</span>
            </div>
            <div className="info-field">
              <span className="info-field-label">Ciudad</span>
              <span className="info-field-value">{cliente.ciudad || <span className="empty">No registrada</span>}</span>
            </div>
            <div className="info-field">
              <span className="info-field-label">Coordenadas</span>
              <span className="info-field-value">{cliente.coordenadas || <span className="empty">No disponibles</span>}</span>
            </div>
          </div>

          {/* Mapa embebido */}
          <div className="embedded-map-section">
            <div className="embedded-map-header">
              <Map size={18} />
              <span>Ubicación en el Mapa</span>
            </div>
            {coordinates ? (
              <div className="embedded-map-container">
                <MapContainer
                  center={coordinates}
                  zoom={15}
                  scrollWheelZoom={false}
                  zoomControl={true}
                  style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                >
                  <MapResizer />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={coordinates}>
                    <Popup>
                      <strong>{cliente.nombre}</strong><br />
                      {cliente.direccion}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="map-not-available">
                <MapPin size={48} />
                <p>Ubicación no disponible</p>
                <span>No hay coordenadas registradas para este cliente</span>
              </div>
            )}
          </div>
        </div>

        {/* Teléfonos de Referencia */}
        {cliente.telefonos_referencia.length > 0 && (
          <div className="detail-section full-width-section">
            <div className="detail-section-header">
              <div className="detail-section-icon">
                <Phone size={20} />
              </div>
              <h3>Teléfonos de Referencia</h3>
            </div>
            <table className="phones-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Nombre de Contacto</th>
                </tr>
              </thead>
              <tbody>
                {cliente.telefonos_referencia.map((tel, idx) => (
                  <tr key={tel.telefono_referencia_id || idx}>
                    <td>{tel.numero}</td>
                    <td>{tel.nombre_contacto || <span className="empty">Sin nombre</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-large edit-client-modal">
            <div className="modal-header">
              <h3>Editar Cliente: {cliente.nombre}</h3>
              <button className="modal-close" onClick={handleCloseEdit} type="button">
                <X size={24} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSaveEdit}>
              {/* Alertas de error y éxito */}
              {editError && (
                <div className="alert alert-error" style={{ margin: '0 0 1rem 0' }}>
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="alert alert-success" style={{ margin: '0 0 1rem 0' }}>
                  {editSuccess}
                </div>
              )}

              {/* Información General */}
              <div className="form-section">
                <h4 className="form-section-title">Información General</h4>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Nombre del Contribuyente *</label>
                    <input
                      value={editForm.nombre || ''}
                      onChange={e => updateEditForm('nombre', e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>NIT/CI</label>
                    <input
                      type="number"
                      value={editForm.nit_ci || ''}
                      onChange={e => updateEditForm('nit_ci', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Sub Canal *</label>
                    <input
                      value={editForm.sub_canal || ''}
                      onChange={e => updateEditForm('sub_canal', e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Visita</label>
                    <select
                      value={editForm.visita || ''}
                      onChange={e => updateEditForm('visita', e.target.value as any)}
                    >
                      <option value="">Sin especificar</option>
                      <option value={Visita.DIA}>{Visita.DIA}</option>
                      <option value={Visita.NOCHE}>{Visita.NOCHE}</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Día de Visita</label>
                    <select
                      value={editForm.dia_visita || ''}
                      onChange={e => updateEditForm('dia_visita', e.target.value || undefined)}
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

              {/* Ubicación y Contacto */}
              <div className="form-section">
                <h4 className="form-section-title">Ubicación y Contacto</h4>
                <div className="form-grid">
                  <div className="form-row full-width">
                    <label>Dirección *</label>
                    <input
                      value={editForm.direccion || ''}
                      onChange={e => updateEditForm('direccion', e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Ciudad</label>
                    <input
                      value={editForm.ciudad || ''}
                      onChange={e => updateEditForm('ciudad', e.target.value || undefined)}
                      maxLength={100}
                    />
                  </div>
                  <div className="form-row">
                    <label>Teléfono Principal</label>
                    <input
                      value={editForm.telefono || ''}
                      onChange={e => updateEditForm('telefono', e.target.value || undefined)}
                      maxLength={50}
                    />
                  </div>
                  <div className="form-row full-width">
                    <label>Coordenadas</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={editForm.coordenadas || ''}
                        onChange={e => updateEditForm('coordenadas', e.target.value || undefined)}
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

              {/* Categorías */}
              <div className="form-section">
                <h4 className="form-section-title">Categorías</h4>
                <div className="chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {categorias.map(cat => (
                    <button
                      type="button"
                      key={cat.cliente_categoria_id}
                      className={`chip ${editForm.cliente_categoria_ids?.includes(cat.cliente_categoria_id) ? 'active' : ''}`}
                      onClick={() => toggleCategoria(cat.cliente_categoria_id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        background: editForm.cliente_categoria_ids?.includes(cat.cliente_categoria_id) ? 'var(--primary)' : 'var(--card)',
                        color: editForm.cliente_categoria_ids?.includes(cat.cliente_categoria_id) ? 'white' : 'var(--text)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teléfonos de Referencia */}
              <div className="form-section">
                <h4 className="form-section-title">Teléfonos de Referencia</h4>
                {telefonos.map((tel, idx) => (
                  <div key={idx} className="form-grid" style={{ marginBottom: '1rem', alignItems: 'end' }}>
                    <div className="form-row">
                      <label>Número</label>
                      <input
                        value={tel.numero}
                        onChange={e => {
                          const newTels = [...telefonos];
                          newTels[idx].numero = e.target.value;
                          setTelefonos(newTels);
                        }}
                        placeholder="Número de referencia"
                      />
                    </div>
                    <div className="form-row">
                      <label>Nombre Contacto</label>
                      <input
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

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseEdit} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selector de Mapa */}
      <MapSelector
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelect={(coordinates) => updateEditForm('coordenadas', coordinates)}
        initialCoordinates={editForm.coordenadas}
      />
    </div>
  );
}

