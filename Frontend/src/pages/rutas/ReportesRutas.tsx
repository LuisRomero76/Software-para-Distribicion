import { useState, useEffect, useMemo } from 'react';
import { Download, Filter, Calendar, User, Users, BarChart3, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { getAllRutas } from '../../services/rutaService';
import { getAllClientes } from '../clientes/services/api';
import { request } from '../../lib/http';
import type { Ruta, Cliente, Colaborador } from './types';
import '../../styles/page.css';
import './ReportesRutas.css';

type TipoReporte = 'colaborador' | 'cliente';

export default function ReportesRutas() {
  const { auth } = useAuth();
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('colaborador');
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColaborador, setSelectedColaborador] = useState<number>(0);
  const [selectedCliente, setSelectedCliente] = useState<number>(0);
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Reportes de Rutas';
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rutasData, clientesData, colaboradoresData] = await Promise.all([
        getAllRutas(auth?.token),
        getAllClientes(auth?.token),
        request<Colaborador[]>('/collaborator', {}, auth?.token)
      ]);

      setRutas(Array.isArray(rutasData) ? rutasData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setColaboradores(Array.isArray(colaboradoresData) ? colaboradoresData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar rutas según los criterios
  const rutasFiltradas = useMemo(() => {
    let filtered = [...rutas];

    // Filtrar por tipo de reporte
    if (tipoReporte === 'colaborador' && selectedColaborador > 0) {
      filtered = filtered.filter(r => r.collaborator_id === selectedColaborador);
    } else if (tipoReporte === 'cliente' && selectedCliente > 0) {
      filtered = filtered.filter(r => r.cliente_id === selectedCliente);
    }

    // Filtrar por estado
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(r => r.estado === selectedEstado);
    }

    // Filtrar por rango de fechas
    if (fechaInicio) {
      filtered = filtered.filter(r => {
        const fechaRuta = r.dia_visita.split('T')[0];
        return fechaRuta >= fechaInicio;
      });
    }

    if (fechaFin) {
      filtered = filtered.filter(r => {
        const fechaRuta = r.dia_visita.split('T')[0];
        return fechaRuta <= fechaFin;
      });
    }

    return filtered;
  }, [rutas, tipoReporte, selectedColaborador, selectedCliente, selectedEstado, fechaInicio, fechaFin]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const total = rutasFiltradas.length;
    const completadas = rutasFiltradas.filter(r => r.estado === 'completada').length;
    const pendientes = rutasFiltradas.filter(r => r.estado === 'pendiente').length;
    const enProgreso = rutasFiltradas.filter(r => r.estado === 'en_progreso').length;
    const canceladas = rutasFiltradas.filter(r => r.estado === 'cancelada').length;

    // Estadísticas específicas por tipo
    let detalleEspecifico: any = {};

    if (tipoReporte === 'colaborador' && selectedColaborador > 0) {
      // Clientes únicos visitados
      const clientesUnicos = new Set(rutasFiltradas.map(r => r.cliente_id));
      detalleEspecifico = {
        clientesAtendidos: clientesUnicos.size
      };
    } else if (tipoReporte === 'cliente' && selectedCliente > 0) {
      // Colaboradores únicos que atendieron
      const colaboradoresUnicos = new Set(rutasFiltradas.map(r => r.collaborator_id));
      detalleEspecifico = {
        colaboradoresAsignados: colaboradoresUnicos.size
      };
    }

    return {
      total,
      completadas,
      pendientes,
      enProgreso,
      canceladas,
      ...detalleEspecifico
    };
  }, [rutasFiltradas, tipoReporte, selectedColaborador, selectedCliente]);

  // Helper para formatear fechas
  const formatDateLocal = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const [year, month, day] = date.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'badge-warning';
      case 'en_progreso': return 'badge-info';
      case 'completada': return 'badge-success';
      case 'cancelada': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const handleExportar = () => {
    const dataToExport = rutasFiltradas.map(ruta => ({
      'ID Ruta': ruta.ruta_id,
      'Cliente': ruta.cliente?.nombre || '-',
      'Dirección': ruta.cliente?.direccion || '-',
      'Colaborador': ruta.colaborador ? `${ruta.colaborador.nombre} ${ruta.colaborador.apellido}` : '-',
      'Día de Visita': formatDateLocal(ruta.dia_visita),
      'Estado': ruta.estado,
      'Observaciones': ruta.observaciones || '-',
      'Fecha de Creación': new Date(ruta.createdAt).toLocaleString('es-ES')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Rutas');

    const columnWidths = [
      { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 25 },
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    const today = new Date();
    const fileName = `reporte_rutas_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const limpiarFiltros = () => {
    setSelectedColaborador(0);
    setSelectedCliente(0);
    setSelectedEstado('todos');
    setFechaInicio('');
    setFechaFin('');
  };

  const mostrarReporte = (tipoReporte === 'colaborador' && selectedColaborador > 0) ||
                         (tipoReporte === 'cliente' && selectedCliente > 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <BarChart3 size={24} /> Reportes de Rutas
          </h2>
          <p className="page-subtitle">Genera reportes detallados por colaborador o cliente</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <div className="filters-header">
          <Filter size={20} />
          <h3>Filtros de Reporte</h3>
        </div>

        <div className="filters-grid">
          {/* Tipo de Reporte */}
          <div className="filter-group">
            <label className="filter-label">Tipo de Reporte</label>
            <div className="report-type-tabs">
              <button
                className={`report-tab ${tipoReporte === 'colaborador' ? 'active' : ''}`}
                onClick={() => {
                  setTipoReporte('colaborador');
                  setSelectedCliente(0);
                }}
              >
                <User size={18} />
                Por Colaborador
              </button>
              <button
                className={`report-tab ${tipoReporte === 'cliente' ? 'active' : ''}`}
                onClick={() => {
                  setTipoReporte('cliente');
                  setSelectedColaborador(0);
                }}
              >
                <Users size={18} />
                Por Cliente
              </button>
            </div>
          </div>

          {/* Selector según tipo */}
          {tipoReporte === 'colaborador' ? (
            <div className="filter-group">
              <label className="filter-label">Seleccionar Colaborador *</label>
              <select
                className="filter-select"
                value={selectedColaborador}
                onChange={(e) => setSelectedColaborador(Number(e.target.value))}
              >
                <option value={0}>-- Seleccione un colaborador --</option>
                {colaboradores.map(col => (
                  <option key={col.collaborator_id} value={col.collaborator_id}>
                    {col.nombre} {col.apellido}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="filter-group">
              <label className="filter-label">Seleccionar Cliente *</label>
              <select
                className="filter-select"
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(Number(e.target.value))}
              >
                <option value={0}>-- Seleccione un cliente --</option>
                {clientes.map(cli => (
                  <option key={cli.cliente_id} value={cli.cliente_id}>
                    {cli.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Estado */}
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={16} /> Estado
            </label>
            <select
              className="filter-select"
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="filter-group">
            <label className="filter-label">
              <Calendar size={16} /> Fecha Inicio
            </label>
            <input
              type="date"
              className="filter-input"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Calendar size={16} /> Fecha Fin
            </label>
            <input
              type="date"
              className="filter-input"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-actions">
          <button className="btn-secondary" onClick={limpiarFiltros}>
            Limpiar Filtros
          </button>
          <button
            className="btn-export"
            onClick={handleExportar}
            disabled={!mostrarReporte || rutasFiltradas.length === 0}
          >
            <Download size={18} /> Exportar a Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando datos...</div>
      ) : !mostrarReporte ? (
        <div className="empty-report-state">
          <BarChart3 size={64} />
          <h3>Selecciona los filtros para generar un reporte</h3>
          <p>Elige un colaborador o cliente para ver sus rutas asignadas</p>
        </div>
      ) : (
        <>
          {/* Estadísticas */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <TrendingUp size={24} color="#1e40af" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total de Rutas</p>
                <p className="stat-value">{estadisticas.total}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#d1fae5' }}>
                <BarChart3 size={24} color="#059669" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Completadas</p>
                <p className="stat-value">{estadisticas.completadas}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <Calendar size={24} color="#d97706" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Pendientes</p>
                <p className="stat-value">{estadisticas.pendientes}</p>
              </div>
            </div>

            {tipoReporte === 'colaborador' && estadisticas.clientesAtendidos !== undefined && (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e0e7ff' }}>
                  <Users size={24} color="#4f46e5" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Clientes Atendidos</p>
                  <p className="stat-value">{estadisticas.clientesAtendidos}</p>
                </div>
              </div>
            )}

            {tipoReporte === 'cliente' && estadisticas.colaboradoresAsignados !== undefined && (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fce7f3' }}>
                  <User size={24} color="#be123c" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Colaboradores Asignados</p>
                  <p className="stat-value">{estadisticas.colaboradoresAsignados}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Resultados */}
          <div className="report-table-card">
            <div className="report-table-header">
              <h3>Detalle de Rutas ({rutasFiltradas.length})</h3>
            </div>
            <div className="table-container">
              {rutasFiltradas.length === 0 ? (
                <div className="empty-state">No se encontraron rutas con los filtros aplicados</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{tipoReporte === 'colaborador' ? 'Cliente' : 'Colaborador'}</th>
                      <th>Dirección</th>
                      <th>Día de Visita</th>
                      <th>Estado</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rutasFiltradas.map(ruta => (
                      <tr key={ruta.ruta_id}>
                        <td className="id-col">{ruta.ruta_id}</td>
                        <td className="name-col">
                          {tipoReporte === 'colaborador' 
                            ? (ruta.cliente?.nombre || 'N/A')
                            : (ruta.colaborador ? `${ruta.colaborador.nombre} ${ruta.colaborador.apellido}` : 'N/A')
                          }
                        </td>
                        <td>{ruta.cliente?.direccion || '-'}</td>
                        <td>{formatDateLocal(ruta.dia_visita)}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(ruta.estado)}`}>
                            {ruta.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="observations-col">{ruta.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
