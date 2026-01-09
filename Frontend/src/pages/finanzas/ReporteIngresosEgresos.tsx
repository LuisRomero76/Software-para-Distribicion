import { useEffect, useMemo, useState } from 'react'
import { Filter, Calendar, TrendingDown, TrendingUp, Download } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAllGastosOperativos, type GastoOperativo } from '../../services/gastoOperativoService'
import { getAllIngresos, listIngresoCategoriaActivas, type Ingreso, type IngresoCategoria } from '../../services/ingresoService'
import { listCategoriasActivas, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'
import { request } from '../../lib/http'
import * as XLSX from 'xlsx'
import '../../styles/page.css'

interface Vehicle {
  vehicle_id: number
  placa?: string
  modelo?: string
}

type TipoReporte = 'EGRESO' | 'INGRESO'

export default function ReporteIngresosEgresos() {
  const { auth } = useAuth()
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('EGRESO')
  const [gastos, setGastos] = useState<GastoOperativo[]>([])
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [categoriasEgreso, setCategoriasEgreso] = useState<GastoOperativoCategoria[]>([])
  const [categoriasIngreso, setCategoriasIngreso] = useState<IngresoCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categoriaFiltro, setCategoriaFiltro] = useState<number>(0)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [vehicleFiltro, setVehicleFiltro] = useState<number>(0)

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Reporte Ingresos / Egresos'
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [gastosData, ingresosData, vehiclesData, categoriasEgresoData, categoriasIngresoData] = await Promise.all([
        getAllGastosOperativos(auth?.token),
        getAllIngresos(auth?.token),
        request<Vehicle[]>('/vehicle', {}, auth?.token),
        listCategoriasActivas(auth?.token),
        listIngresoCategoriaActivas(auth?.token)
      ])
      setGastos(Array.isArray(gastosData) ? gastosData : [])
      setIngresos(Array.isArray(ingresosData) ? ingresosData : [])
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
      setCategoriasEgreso(Array.isArray(categoriasEgresoData) ? categoriasEgresoData : [])
      setCategoriasIngreso(Array.isArray(categoriasIngresoData) ? categoriasIngresoData : [])
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const datosFiltrados = useMemo(() => {
    let data: any[] = []
    
    if (tipoReporte === 'EGRESO') {
      data = [...gastos]
      if (categoriaFiltro !== 0) data = data.filter(g => g.categoria_id === categoriaFiltro)
      if (vehicleFiltro) data = data.filter(g => g.vehiculo_id === vehicleFiltro)
    } else {
      data = [...ingresos]
      if (categoriaFiltro !== 0) data = data.filter(i => i.categoria_id === categoriaFiltro)
    }
    
    if (fechaInicio) data = data.filter(d => d.createdAt.split('T')[0] >= fechaInicio)
    if (fechaFin) data = data.filter(d => d.createdAt.split('T')[0] <= fechaFin)
    return data
  }, [gastos, ingresos, tipoReporte, categoriaFiltro, vehicleFiltro, fechaInicio, fechaFin])

  const total = useMemo(() => datosFiltrados.reduce((acc, d) => acc + Number(d.monto), 0), [datosFiltrados])

  const formatFecha = (dateString: string) => {
    if (!dateString) return '—'
    const date = dateString.includes('T') ? dateString.split('T')[0] : dateString
    return date
  }

  const exportToExcel = () => {
    const dataToExport = datosFiltrados.map((item: any) => {
      if (tipoReporte === 'EGRESO') {
        return {
          'ID': item.gasto_id,
          'Tipo': item.tipo || 'OTRO',
          'Categoría': item.categoriaRelacion?.nombre || item.categoria || '—',
          'Descripción': item.descripcion || '—',
          'Monto (Bs)': Number(item.monto).toFixed(2),
          'Fecha': formatFecha(item.createdAt),
          'Vehículo': item.vehiculo ? (item.vehiculo.placa || `Vehículo #${item.vehiculo.vehicle_id}`) : '—'
        }
      } else {
        return {
          'ID': item.ingreso_id,
          'Tipo': item.tipo,
          'Categoría': item.categoriaRelacion?.nombre || '—',
          'Descripción': item.descripcion,
          'Monto (Bs)': Number(item.monto).toFixed(2),
          'Fecha': formatFecha(item.createdAt)
        }
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    const sheetName = tipoReporte === 'EGRESO' ? 'Egresos' : 'Ingresos'
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const columnWidths = tipoReporte === 'EGRESO' 
      ? [
          { wch: 8 },  // ID
          { wch: 15 }, // Tipo
          { wch: 20 }, // Categoría
          { wch: 40 }, // Descripción
          { wch: 15 }, // Monto
          { wch: 20 }, // Fecha
          { wch: 25 }  // Vehículo
        ]
      : [
          { wch: 8 },  // ID
          { wch: 15 }, // Tipo
          { wch: 20 }, // Categoría
          { wch: 40 }, // Descripción
          { wch: 15 }, // Monto
          { wch: 20 }  // Fecha
        ]
    worksheet['!cols'] = columnWidths

    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const fileName = `reporte_${tipoReporte.toLowerCase()}_${year}-${month}-${day}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reporte de Ingresos/Egresos</h2>
          <p className="page-subtitle">Visualiza y filtra ingresos y egresos</p>
        </div>
        <button className="btn-export" onClick={exportToExcel} disabled={datosFiltrados.length === 0} title="Exportar a Excel">
          <Download size={18} /> Exportar
        </button>
      </div>

      {/* Tabs para seleccionar tipo de reporte */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => {
            setTipoReporte('EGRESO')
            setCategoriaFiltro(0)
            setVehicleFiltro(0)
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: tipoReporte === 'EGRESO' ? '#ef4444' : '#e2e4e5ff',
            color: tipoReporte === 'EGRESO' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}
        >
          <TrendingDown size={20} />
          Egresos
        </button>
        <button
          onClick={() => {
            setTipoReporte('INGRESO')
            setCategoriaFiltro(0)
            setVehicleFiltro(0)
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: tipoReporte === 'INGRESO' ? '#22c55e' : '#e2e4e5ff',
            color: tipoReporte === 'INGRESO' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}
        >
          <TrendingUp size={20} />
          Ingresos
        </button>
      </div>

      <div className="filters-card" style={{ marginBottom: '1.5rem' }}>
        <div className="filters-header">
          <Filter size={20} />
          <h3>Filtros</h3>
        </div>
        <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="filter-group">
            <label className="filter-label">Categoría</label>
            <select
              className="filter-select"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(Number(e.target.value))}
            >
              <option value={0}>Todas</option>
              {(tipoReporte === 'EGRESO' ? categoriasEgreso : categoriasIngreso).map(cat => (
                <option key={cat.categoria_id} value={cat.categoria_id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {tipoReporte === 'EGRESO' && (
            <div className="filter-group">
              <label className="filter-label">Vehículo</label>
              <select
                className="filter-select"
                value={vehicleFiltro}
                onChange={(e) => setVehicleFiltro(Number(e.target.value))}
              >
                <option value={0}>Todos</option>
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.placa ? `${v.placa} - ${v.modelo ?? ''}` : `Vehículo #${v.vehicle_id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label className="filter-label"><Calendar size={16} /> Desde</label>
            <input type="date" className="filter-input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>

          <div className="filter-group">
            <label className="filter-label"><Calendar size={16} /> Hasta</label>
            <input type="date" className="filter-input" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando datos...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : datosFiltrados.length === 0 ? (
        <div className="empty-state">No hay {tipoReporte === 'EGRESO' ? 'egresos' : 'ingresos'} registrados con estos filtros</div>
      ) : (
        <div className="report-table-card" style={{ marginBottom: '2rem' }}>
          <div className="report-table-header">
            <h3>Registro de {tipoReporte === 'EGRESO' ? 'Egresos' : 'Ingresos'}</h3>
            <span>{datosFiltrados.length} registro(s)</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Fecha</th>
                {tipoReporte === 'EGRESO' && <th>Vehículo</th>}
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((item: any) => 
                tipoReporte === 'EGRESO' ? (
                  <tr key={item.gasto_id}>
                    <td className="id-col">#{item.gasto_id}</td>
                    <td><span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: '600', color: '#3b22c5ff' }}>{item.tipo || 'OTRO'}</span></td>
                    <td>{item.categoriaRelacion?.nombre || item.categoria || '—'}</td>
                    <td>{item.descripcion || '—'}</td>
                    <td>Bs {Number(item.monto).toFixed(2)}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString('es-ES')}</td>
                    <td>{item.vehiculo ? (item.vehiculo.placa || `Vehículo #${item.vehiculo.vehicle_id}`) : '—'}</td>
                  </tr>
                ) : (
                  <tr key={item.ingreso_id}>
                    <td className="id-col">#{item.ingreso_id}</td>
                    <td><span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: '600', color: '#22c55e' }}>{item.tipo}</span></td>
                    <td>{item.categoriaRelacion?.nombre || '—'}</td>
                    <td>{item.descripcion}</td>
                    <td>Bs {Number(item.monto).toFixed(2)}</td>
                    <td>{formatFecha(item.createdAt)}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="stat-card" style={{ marginTop: '0.5rem' }}>
        <div className="stat-icon" style={{ background: tipoReporte === 'EGRESO' ? '#fee2e2' : '#dcfce7' }}>
          {tipoReporte === 'EGRESO' ? (
            <TrendingDown size={22} color="#b91c1c" />
          ) : (
            <TrendingUp size={22} color="#16a34a" />
          )}
        </div>
        <div className="stat-content">
          <p className="stat-label">Total {tipoReporte === 'EGRESO' ? 'egresos' : 'ingresos'} filtrados</p>
          <p className="stat-value" style={{ fontSize: '1.5rem' }}>Bs {total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
