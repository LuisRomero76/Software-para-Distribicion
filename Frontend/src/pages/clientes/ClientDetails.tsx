import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, Hash, Tag, Edit2 } from 'lucide-react';
import { apiGet } from './services/api';
import type { Cliente } from './hooks/useClientes';
import './ClientDetails.css';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="client-details-page">
      {/* Header */}
      <div className="client-details-header">
        <div className="client-details-title-section">
          <h1>{cliente.nombre}</h1>
          <span className="client-badge">{cliente.sub_canal}</span>
          <span className="client-id-badge">
            <Hash size={16} /> ID: {cliente.cliente_id}
          </span>
        </div>
        <div className="client-actions">
          <button onClick={() => navigate('/clientes')} className="btn-back">
            <ArrowLeft size={18} /> Volver
          </button>
          <button className="btn-edit-client">
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

        {/* Categorías */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-icon">
              <Tag size={20} />
            </div>
            <h3>Categorías</h3>
          </div>
          {cliente.categorias.length > 0 ? (
            <div className="categories-list">
              {cliente.categorias.map(cat => (
                <span key={cat.cliente_categoria_id} className="category-tag">
                  {cat.nombre}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-state">Sin categorías asignadas</p>
          )}
        </div>
      </div>

      {/* Segunda Fila */}
      <div className="client-details-grid">
        {/* Ubicación */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-icon">
              <MapPin size={20} />
            </div>
            <h3>Ubicación</h3>
          </div>
          <div className="info-grid">
            <div className="info-field">
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
        </div>

        {/* Contacto y Programación */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-icon">
              <Phone size={20} />
            </div>
            <h3>Contacto y Programación</h3>
          </div>
          <div className="info-grid">
            <div className="info-field">
              <span className="info-field-label">Teléfono Principal</span>
              <span className="info-field-value">{cliente.telefono || <span className="empty">No registrado</span>}</span>
            </div>
            <div className="info-field">
              <span className="info-field-label">Día de Visita</span>
              <span className="info-field-value">
                {cliente.dia_visita ? new Date(cliente.dia_visita + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : <span className="empty">No asignado</span>}
              </span>
            </div>
          </div>
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
  );
}
