import { useEffect, useMemo, useState } from 'react'
import { Filter, Calendar, TrendingDown, Download } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAllGastosOperativos, type GastoOperativo } from '../../services/gastoOperativoService'
import { listCategoriasActivas, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'
import { request } from '../../lib/http'
import * as XLSX from 'xlsx'
import '../../styles/page.css'

interface Vehicle {
  vehicle_id: number
  placa?: string
  modelo?: string
}

export default function ReporteIngresosEgresos() {
  const { auth } = useAuth()
  const [gastos, setGastos] = useState<GastoOperativo[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [categorias, setCategorias] = useState<GastoOperativoCategoria[]>([])
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
      const [gastosData, vehiclesData, categoriasData] = await Promise.all([
        getAllGastosOperativos(auth?.token),
        request<Vehicle[]>('/vehicle', {}, auth?.token),
        listCategoriasActivas(auth?.token)
      ])
      setGastos(Array.isArray(gastosData) ? gastosData : [])
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
      setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const gastosFiltrados = useMemo(() => {
    let data = [...gastos]
    if (categoriaFiltro !== 0) data = data.filter(g => g.categoria_id === categoriaFiltro)
    if (vehicleFiltro) data = data.filter(g => g.vehiculo_id === vehicleFiltro)
    if (fechaInicio) data = data.filter(g => g.createdAt.split('T')[0] >= fechaInicio)
    if (fechaFin) data = data.filter(g => g.createdAt.split('T')[0] <= fechaFin)
    return data
  }, [gastos, categoriaFiltro, vehicleFiltro, fechaInicio, fechaFin])

  const totalGastos = useMemo(() => gastosFiltrados.reduce((acc, g) => acc + Number(g.monto), 0), [gastosFiltrados])

  const formatFecha = (dateString: string) => {
    if (!dateString) return '—'
    const date = dateString.includes('T') ? dateString.split('T')[0] : dateString
    return date
  }

  const exportToExcel = () => {
    const dataToExport = gastosFiltrados.map(gasto => ({
      'ID': gasto.gasto_id,
      'Categoría': gasto.categoriaRelacion?.nombre || gasto.categoria || '—',
      'Descripción': gasto.descripcion,
      'Monto (Bs)': Number(gasto.monto).toFixed(2),
      'Fecha de Creación': formatFecha(gasto.createdAt),
      'Vehículo': gasto.vehiculo ? (gasto.vehiculo.placa || `Vehículo #${gasto.vehiculo.vehicle_id}`) : '—'
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Egresos')

    const columnWidths = [
      { wch: 8 },  // ID
      { wch: 20 }, // Categoría
      { wch: 40 }, // Descripción
      { wch: 15 }, // Monto
      { wch: 20 }, // Fecha de Creación
      { wch: 25 }  // Vehículo
    ]
    worksheet['!cols'] = columnWidths

    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const fileName = `reporte_egresos_${year}-${month}-${day}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reporte de Ingresos/Egresos</h2>
          <p className="page-subtitle">Visualiza y filtra los egresos operativos</p>
        </div>
        <button className="btn-export" onClick={exportToExcel} disabled={gastosFiltrados.length === 0} title="Exportar a Excel">
          <Download size={18} /> Exportar
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
              {categorias.map(cat => (
                <option key={cat.categoria_id} value={cat.categoria_id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

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
        <div className="loading-state">Cargando egresos...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : gastosFiltrados.length === 0 ? (
        <div className="empty-state">No hay egresos registrados con estos filtros</div>
      ) : (
        <div className="report-table-card" style={{ marginBottom: '2rem' }}>
          <div className="report-table-header">
            <h3>Registro de Egresos</h3>
            <span>{gastosFiltrados.length} registro(s)</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Fecha de Creación</th>
                <th>Vehículo</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.map(g => (
                <tr key={g.gasto_id}>
                  <td className="id-col">#{g.gasto_id}</td>
                  <td>{g.categoriaRelacion?.nombre || g.categoria || '—'}</td>
                  <td>{g.descripcion}</td>
                  <td>Bs {Number(g.monto).toFixed(2)}</td>
                  <td>{formatFecha(g.createdAt)}</td>
                  <td>{g.vehiculo ? (g.vehiculo.placa || `Vehículo #${g.vehiculo.vehicle_id}`) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="stat-card" style={{ marginTop: '0.5rem' }}>
        <div className="stat-icon" style={{ background: '#fee2e2' }}>
          <TrendingDown size={22} color="#b91c1c" />
        </div>
        <div className="stat-content">
          <p className="stat-label">Total egresos filtrados</p>
          <p className="stat-value" style={{ fontSize: '1.5rem' }}>Bs {totalGastos.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
