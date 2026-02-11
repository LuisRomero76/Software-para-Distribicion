import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, Users, Filter, Eye } from 'lucide-react';
import { request } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import './CollaboratorDetails.css';

interface Cliente {
  cliente_id: number;
  sub_canal: string;
  visita?: string;
  nit_ci?: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  telefono?: string;
  dia_visita?: string;
}

interface Collaborator {
  collaborator_id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: string;
  createdAt: string;
  clientes?: Cliente[];
}

type DiaVisita = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo' | 'TODOS';

export default function CollaboratorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DiaVisita>('TODOS');

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Detalle del Colaborador';
  }, []);

  useEffect(() => {
    const fetchCollaborator = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await request<Collaborator>(`/collaborator/${id}`, {}, auth?.token);
        setCollaborator(data);
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar el colaborador');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCollaborator();
    }
  }, [id, auth?.token]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="state-info">Cargando información del colaborador...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!collaborator) {
    return (
      <div className="page-container">
        <div className="alert alert-error">Colaborador no encontrado</div>
      </div>
    );
  }

  // Filtrar clientes según el día seleccionado
  const filteredClientes = selectedDay === 'TODOS' 
    ? collaborator.clientes || []
    : (collaborator.clientes || []).filter(c => c.dia_visita === selectedDay);

  const diasVisita: DiaVisita[] = ['TODOS', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Agrupar clientes por día para mostrar estadísticas
  const clientesPorDia = (collaborator.clientes || []).reduce((acc, cliente) => {
    const dia = cliente.dia_visita || 'Sin día asignado';
    if (!acc[dia]) acc[dia] = 0;
    acc[dia]++;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="page-container">
      <div className="details-header">
        <button className="btn-back" onClick={() => navigate('/colaboradores')}>
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="details-header-content">
          <div className="details-header-left">
            <div className="collaborator-avatar">
              <User size={40} />
            </div>
            <div>
              <h1 className="details-title">
                {collaborator.nombre} {collaborator.apellido}
              </h1>
              <div className="collaborator-role">
                <span className={`role-badge ${collaborator.rol.toLowerCase()}`}>
                  {collaborator.rol === 'preventista' ? 'Preventista' : 'Distribuidor'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="details-grid">
        {/* Información del Colaborador */}
        <div className="info-card">
          <h2 className="info-card-title">Información Personal</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <User size={16} />
                <span>Nombre Completo</span>
              </div>
              <div className="info-value">{collaborator.nombre} {collaborator.apellido}</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Mail size={16} />
                <span>Email</span>
              </div>
              <div className="info-value">
                <a href={`mailto:${collaborator.email}`} className="contact-link">
                  {collaborator.email}
                </a>
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Phone size={16} />
                <span>Teléfono</span>
              </div>
              <div className="info-value">
                <a href={`tel:${collaborator.telefono}`} className="contact-link">
                  {collaborator.telefono}
                </a>
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Calendar size={16} />
                <span>Fecha de Creación</span>
              </div>
              <div className="info-value">
                {new Date(collaborator.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de Clientes */}
        <div className="info-card">
          <h2 className="info-card-title">Estadísticas de Clientes</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{collaborator.clientes?.length || 0}</div>
                <div className="stat-label">Clientes Totales</div>
              </div>
            </div>
            
            {Object.entries(clientesPorDia).map(([dia, cantidad]) => (
              <div key={dia} className="stat-item">
                <span className="stat-day">{dia}</span>
                <span className="stat-count">{cantidad} cliente{cantidad !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección de Clientes */}
      <div className="clients-section">
        <div className="clients-header">
          <h2 className="section-title">
            <Users size={24} />
            Clientes Asignados
          </h2>
          <div className="clients-filter">
            <Filter size={18} />
            <select 
              value={selectedDay} 
              onChange={(e) => setSelectedDay(e.target.value as DiaVisita)}
              className="filter-select"
            >
              {diasVisita.map(dia => (
                <option key={dia} value={dia}>
                  {dia === 'TODOS' ? 'Todos los días' : dia}
                </option>
              ))}
            </select>
            <span className="filter-count">
              {filteredClientes.length} de {collaborator.clientes?.length || 0}
            </span>
          </div>
        </div>

        {filteredClientes.length === 0 ? (
          <div className="empty-state">
            {selectedDay === 'TODOS' 
              ? 'No hay clientes asignados a este colaborador'
              : `No hay clientes asignados para ${selectedDay}`
            }
          </div>
        ) : (
          <div className="clients-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Sub Canal</th>
                  <th>Dirección</th>
                  <th>Ciudad</th>
                  <th>Teléfono</th>
                  <th>Día de Visita</th>
                  <th>Visita</th>
                  <th className="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.cliente_id}>
                    <td className="id-col">{cliente.cliente_id}</td>
                    <td className="name-col">{cliente.nombre}</td>
                    <td>{cliente.sub_canal}</td>
                    <td>{cliente.direccion}</td>
                    <td>{cliente.ciudad || 'N/A'}</td>
                    <td>
                      {cliente.telefono ? (
                        <a href={`tel:${cliente.telefono}`} className="contact-link">
                          {cliente.telefono}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <span className="day-badge">{cliente.dia_visita || 'Sin día'}</span>
                    </td>
                    <td>
                      <span className={`visita-badge ${cliente.visita?.toLowerCase()}`}>
                        {cliente.visita || 'N/A'}
                      </span>
                    </td>
                    <td className="actions-col">
                      <button 
                        className="action-btn view"
                        onClick={() => navigate(`/clientes/${cliente.cliente_id}`)}
                        title="Ver detalles del cliente"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
