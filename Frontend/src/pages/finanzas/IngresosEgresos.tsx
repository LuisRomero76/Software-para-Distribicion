import { useEffect, useMemo, useState } from 'react'
import { Plus, Filter, TrendingDown, Calendar, Car } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createGastoOperativo, getAllGastosOperativos, type CategoriaGasto, type GastoOperativo } from '../../services/gastoOperativoService'
import { request } from '../../lib/http'
import '../../styles/page.css'

interface Vehicle {
  vehicle_id: number
  placa?: string
  modelo?: string
}

type CategoriaFiltro = 'TODOS' | CategoriaGasto

export default function IngresosEgresos() {
  const { auth } = useAuth()
  // Datos
  const [gastos, setGastos] = useState<GastoOperativo[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFiltro>('TODOS')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [vehicleFiltro, setVehicleFiltro] = useState<number>(0)

  // Formulario egresos
  const [formEgreso, setFormEgreso] = useState({
    categoria: 'COMBUSTIBLE' as CategoriaGasto,
    descripcion: '',
    monto: '',
    fecha: '',
    vehiculo_id: 0
  })

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Ingresos / Egresos'
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [gastosData, vehiclesData] = await Promise.all([
        getAllGastosOperativos(auth?.token),
        request<Vehicle[]>('/vehicle', {}, auth?.token)
      ])
      setGastos(Array.isArray(gastosData) ? gastosData : [])
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const gastosFiltrados = useMemo(() => {
    let data = [...gastos]

    if (categoriaFiltro !== 'TODOS') {
      data = data.filter(g => g.categoria === categoriaFiltro)
    }

    if (vehicleFiltro) {
      data = data.filter(g => g.vehiculo_id === vehicleFiltro)
    }

    if (fechaInicio) {
      data = data.filter(g => g.createdAt.split('T')[0] >= fechaInicio)
    }

    if (fechaFin) {
      data = data.filter(g => g.createdAt.split('T')[0] <= fechaFin)
    }

    return data
  }, [gastos, categoriaFiltro, vehicleFiltro, fechaInicio, fechaFin])

  const totalGastos = useMemo(() => gastosFiltrados.reduce((acc, g) => acc + Number(g.monto), 0), [gastosFiltrados])

  const handleSubmitEgreso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formEgreso.descripcion || !formEgreso.monto || !formEgreso.fecha) return

    setSaving(true)
    try {
      const payload = {
        categoria: formEgreso.categoria,
        descripcion: formEgreso.descripcion,
        monto: Number(formEgreso.monto),
        fecha: formEgreso.fecha,
        vehiculo_id: formEgreso.categoria === 'GENERAL' ? null : formEgreso.vehiculo_id || null
      }
      const created = await createGastoOperativo(payload, auth?.token)
      setGastos([created, ...gastos])
      setFormEgreso({ categoria: 'COMBUSTIBLE', descripcion: '', monto: '', fecha: '', vehiculo_id: 0 })
    } catch (err: any) {
      alert(err?.message ?? 'No se pudo registrar el gasto operativo')
    } finally {
      setSaving(false)
    }
  }

  const formatFecha = (dateString: string) => {
    if (!dateString) return '—'
    const date = dateString.includes('T') ? dateString.split('T')[0] : dateString
    return date
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Ingresos / Egresos</h2>
          <p className="page-subtitle">Gestiona ingresos y egresos operativos</p>
        </div>
      </div>

      {/* Sub-Sección: Reporte de Ingresos/Egresos */}
      <div className="filters-card" style={{ marginBottom: '1.5rem' }}>
        <div className="filters-header">
          <Filter size={20} />
          <h3>Reporte de Ingresos/Egresos</h3>
        </div>
        <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="filter-group">
            <label className="filter-label">Categoría</label>
            <select
              className="filter-select"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value as CategoriaFiltro)}
            >
              <option value="TODOS">Todos</option>
              <option value="COMBUSTIBLE">Combustible</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="GENERAL">General</option>
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
            <input
              type="date"
              className="filter-input"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label"><Calendar size={16} /> Hasta</label>
            <input
              type="date"
              className="filter-input"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
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
                  <td>{g.categoria}</td>
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

      {/* Sub-Sección: Registrar Ingreso/Egreso */}
      <div className="filters-card">
        <div className="filters-header">
          <Plus size={20} />
          <h3>Registrar Ingreso/Egreso</h3>
        </div>
        <form className="filters-grid" style={{ gridTemplateColumns: '1fr' }} onSubmit={handleSubmitEgreso}>
          <div className="filter-group">
            <label className="filter-label">Categoría</label>
            <select
              className="filter-select"
              value={formEgreso.categoria}
              onChange={(e) => setFormEgreso({ ...formEgreso, categoria: e.target.value as CategoriaGasto })}
              required
            >
              <option value="COMBUSTIBLE">Combustible</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Descripción</label>
            <input
              className="filter-input"
              value={formEgreso.descripcion}
              onChange={(e) => setFormEgreso({ ...formEgreso, descripcion: e.target.value })}
              placeholder="Detalle del gasto"
              required
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Monto (Bs)</label>
            <input
              className="filter-input"
              type="number"
              min="0"
              step="0.01"
              value={formEgreso.monto}
              onChange={(e) => setFormEgreso({ ...formEgreso, monto: e.target.value })}
              required
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Fecha</label>
            <input
              className="filter-input"
              type="date"
              value={formEgreso.fecha}
              onChange={(e) => setFormEgreso({ ...formEgreso, fecha: e.target.value })}
              required
            />
          </div>

          {formEgreso.categoria !== 'GENERAL' && (
            <div className="filter-group">
              <label className="filter-label"><Car size={16} /> Vehículo</label>
              <select
                className="filter-select"
                value={formEgreso.vehiculo_id}
                onChange={(e) => setFormEgreso({ ...formEgreso, vehiculo_id: Number(e.target.value) })}
                required
              >
                <option value={0}>-- Seleccione --</option>
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.placa ? `${v.placa} - ${v.modelo ?? ''}` : `Vehículo #${v.vehicle_id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filters-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar egreso'}
            </button>
          </div>
        </form>

        <div className="stat-card" style={{ marginTop: '1rem' }}>
          <div className="stat-icon" style={{ background: '#fee2e2' }}>
            <TrendingDown size={22} color="#b91c1c" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total egresos filtrados</p>
            <p className="stat-value" style={{ fontSize: '1.5rem' }}>Bs {totalGastos.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
