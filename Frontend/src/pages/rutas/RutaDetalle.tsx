import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Users, Map } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRutaById } from '../../services/rutaService';
import { useAuth } from '../../context/AuthContext';
import type { Ruta } from './types';
import './RutaDetalle.css';

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

export default function RutaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Detalle de Ruta';
  }, []);

  useEffect(() => {
    const fetchRuta = async () => {
      try {
        setLoading(true);
        if (id) {
          const data = await getRutaById(Number(id), auth?.token);
          setRuta(data);
        }
      } catch (e: any) {
        setError(e.message || 'Error al cargar la ruta');
      } finally {
        setLoading(false);
      }
    };

    fetchRuta();
  }, [id, auth?.token]);

  // Helper para formatear fechas
  const formatDateLocal = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const [year, month, day] = date.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Parsear coordenadas del cliente
  const parseCoordinates = (coords?: string): [number, number] | null => {
    if (!coords) return null;
    const parts = coords.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return null;
  };

  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'badge-warning';
      case 'en_progreso':
        return 'badge-info';
      case 'completada':
        return 'badge-success';
      case 'cancelada':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Cargando información de la ruta...</div>
      </div>
    );
  }

  if (error || !ruta) {
    return (
      <div className="page-container">
        <div className="error-state">{error || 'Ruta no encontrada'}</div>
        <button className="btn-secondary" onClick={() => navigate('/distribution/rutas')}>
          <ArrowLeft size={18} /> Volver a Rutas
        </button>
      </div>
    );
  }

  const coordinates = ruta.cliente ? parseCoordinates(ruta.cliente.coordenadas) : null;

  return (
    <div className="page-container ruta-details-page">
      {/* Header */}
      <div className="ruta-details-header">
        <button className="btn-back" onClick={() => navigate('/distribution/rutas')}>
          <ArrowLeft size={20} />
          Volver a Rutas
        </button>
        <div className="ruta-details-title-section">
          <h1>Ruta #{ruta.ruta_id}</h1>
          <span className={`badge ${getStatusBadgeClass(ruta.estado)}`}>
            {ruta.estado.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="ruta-details-grid">
        {/* Cliente Info */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-icon" style={{ background: '#dbeafe' }}>
              <User size={20} color="#1e40af" />
            </div>
            <h3>Información del Cliente</h3>
          </div>
          <div className="info-grid">
            <div className="info-field">
              <span className="info-field-label">Nombre</span>
              <p className="info-field-value">{ruta.cliente?.nombre || 'N/A'}</p>
            </div>
            <div className="info-field">
              <span className="info-field-label">Dirección</span>
              <p className="info-field-value">{ruta.cliente?.direccion || 'N/A'}</p>
            </div>
            {ruta.cliente?.ciudad && (
              <div className="info-field">
                <span className="info-field-label">Ciudad</span>
                <p className="info-field-value">{ruta.cliente.ciudad}</p>
              </div>
            )}
            {ruta.cliente?.telefono && (
              <div className="info-field">
                <span className="info-field-label">Teléfono</span>
                <p className="info-field-value phone-value">
                  <a href={`tel:${ruta.cliente.telefono}`} className="phone-link">
                    {ruta.cliente.telefono}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Colaborador Info */}
        <div className="detail-section">
          <div className="detail-section-header">
            <div className="detail-section-icon" style={{ background: '#d1fae5' }}>
              <Users size={20} color="#059669" />
            </div>
            <h3>Colaborador Asignado</h3>
          </div>
          <div className="info-grid">
            <div className="info-field">
              <span className="info-field-label">Nombre Completo</span>
              <p className="info-field-value">
                {ruta.colaborador 
                  ? `${ruta.colaborador.nombre} ${ruta.colaborador.apellido}`
                  : 'N/A'}
              </p>
            </div>
            {ruta.colaborador?.email && (
              <div className="info-field">
                <span className="info-field-label">Email</span>
                <p className="info-field-value">
                  <a href={`mailto:${ruta.colaborador.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {ruta.colaborador.email}
                  </a>
                </p>
              </div>
            )}
            {ruta.colaborador?.telefono && (
              <div className="info-field">
                <span className="info-field-label">Teléfono</span>
                <p className="info-field-value phone-value">
                  <a href={`tel:${ruta.colaborador.telefono}`} className="phone-link">
                    {ruta.colaborador.telefono}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detalles de la Visita */}
        <div className="detail-section full-width-section">
          <div className="detail-section-header">
            <div className="detail-section-icon" style={{ background: '#fef3c7' }}>
              <Calendar size={20} color="#d97706" />
            </div>
            <h3>Detalles de la Visita</h3>
          </div>
          <div className="info-grid">
            <div className="info-field">
              <span className="info-field-label">Día de Visita</span>
              <p className="info-field-value" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: '600'
              }}>
                {formatDateLocal(ruta.dia_visita)}
              </p>
            </div>
            <div className="info-field">
              <span className="info-field-label">Estado</span>
              <p className="info-field-value">
                <span className={`badge ${getStatusBadgeClass(ruta.estado)}`}>
                  {ruta.estado.replace('_', ' ')}
                </span>
              </p>
            </div>
            <div className="info-field">
              <span className="info-field-label">Fecha de Creación</span>
              <p className="info-field-value">
                {new Date(ruta.createdAt).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="info-field">
              <span className="info-field-label">Última Actualización</span>
              <p className="info-field-value">
                {new Date(ruta.updatedAt).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {ruta.observaciones && (
              <div className="info-field full-width">
                <span className="info-field-label">Observaciones</span>
                <p className="info-field-value" style={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  minHeight: '3rem'
                }}>
                  {ruta.observaciones}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mapa de Ubicación */}
        <div className="detail-section full-width-section embedded-map-section">
          <div className="embedded-map-header">
            <div className="detail-section-icon" style={{ background: '#e0e7ff' }}>
              <Map size={20} color="#4f46e5" />
            </div>
            <h3>Ubicación del Cliente</h3>
          </div>
          {coordinates ? (
            <div className="embedded-map-container">
              <MapContainer
                center={coordinates}
                zoom={15}
                style={{ height: '400px', width: '100%', borderRadius: '8px' }}
              >
                <MapResizer />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coordinates}>
                  <Popup>
                    <div>
                      <strong>{ruta.cliente?.nombre}</strong>
                      <br />
                      {ruta.cliente?.direccion}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--info-bg, #eff6ff)',
                border: '1px solid var(--info-border, #dbeafe)',
                borderRadius: '6px',
                color: 'var(--info-text, #1e40af)',
                fontSize: '0.9rem',
                marginTop: '1rem'
              }}>
                <MapPin size={16} />
                <span>Coordenadas: {ruta.cliente?.coordenadas}</span>
              </div>
            </div>
          ) : (
            <div className="map-not-available">
              <MapPin size={48} />
              <p>No hay coordenadas registradas para este cliente</p>
              <span>Las coordenadas se pueden agregar al editar el cliente</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
