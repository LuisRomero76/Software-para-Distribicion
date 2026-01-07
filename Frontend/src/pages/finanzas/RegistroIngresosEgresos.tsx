import { useEffect, useState } from 'react'
import { Plus, TrendingDown, Car } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createGastoOperativo } from '../../services/gastoOperativoService'
import { listCategoriasActivas, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'
import { request } from '../../lib/http'
import '../../styles/page.css'

interface Vehicle {
  vehicle_id: number
  placa?: string
  modelo?: string
}

export default function RegistroIngresosEgresos() {
  const { auth } = useAuth()
  const [categorias, setCategorias] = useState<GastoOperativoCategoria[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formEgreso, setFormEgreso] = useState({
    categoria_id: 0,
    descripcion: '',
    monto: '',
    vehiculo_id: 0
  })

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Registrar Ingreso / Egreso'
    loadCategorias()
    loadVehicles()
  }, [])

  const loadCategorias = async () => {
    try {
      const categoriasData = await listCategoriasActivas(auth?.token)
      setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      if (categoriasData.length > 0) {
        setFormEgreso(f => ({ ...f, categoria_id: categoriasData[0].categoria_id }))
      }
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar las categorías')
    }
  }

  const loadVehicles = async () => {
    try {
      const vehiclesData = await request<Vehicle[]>('/vehicle', {}, auth?.token)
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
    } catch (e: any) {
      console.error('Error al cargar vehículos:', e)
    }
  }

  const handleSubmitEgreso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formEgreso.descripcion || !formEgreso.monto || !formEgreso.categoria_id) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      const payload = {
        categoria_id: formEgreso.categoria_id,
        descripcion: formEgreso.descripcion,
        monto: Number(formEgreso.monto),
        vehiculo_id: formEgreso.vehiculo_id || null
      }
      await createGastoOperativo(payload, auth?.token)
      setFormEgreso({ categoria_id: categorias[0]?.categoria_id || 0, descripcion: '', monto: '', vehiculo_id: 0 })
      alert('Egreso registrado correctamente')
    } catch (err: any) {
      alert(err?.message ?? 'No se pudo registrar el egreso')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Registrar Ingreso/Egreso</h2>
          <p className="page-subtitle">Registra egresos operativos</p>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="filters-card">
        <div className="filters-header">
          <Plus size={20} />
          <h3>Registro</h3>
        </div>
        <form className="filters-grid" style={{ gridTemplateColumns: '1fr' }} onSubmit={handleSubmitEgreso}>
          <div className="filter-group">
            <label className="filter-label">Categoría *</label>
            <select
              className="filter-select"
              value={formEgreso.categoria_id}
              onChange={(e) => setFormEgreso({ ...formEgreso, categoria_id: Number(e.target.value) })}
              required
            >
              <option value={0}>-- Seleccione categoría --</option>
              {categorias.map(cat => (
                <option key={cat.categoria_id} value={cat.categoria_id}>
                  {cat.nombre}
                </option>
              ))}
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
            <label className="filter-label">Monto (Bs) *</label>
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
            <label className="filter-label"><Car size={16} /> Vehículo (Opcional)</label>
            <select
              className="filter-select"
              value={formEgreso.vehiculo_id}
              onChange={(e) => setFormEgreso({ ...formEgreso, vehiculo_id: Number(e.target.value) })}
            >
              <option value={0}>-- Sin vehículo --</option>
              {vehicles.map(v => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.placa ? `${v.placa} - ${v.modelo ?? ''}` : `Vehículo #${v.vehicle_id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filters-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar egreso'}
            </button>
          </div>
        </form>
      </div>

      <div className="stat-card" style={{ marginTop: '1rem' }}>
        <div className="stat-icon" style={{ background: '#fee2e2' }}>
          <TrendingDown size={22} color="#b91c1c" />
        </div>
        <div className="stat-content">
          <p className="stat-label">Recuerda</p>
          <p className="stat-value" style={{ fontSize: '1rem' }}>La fecha se registra automáticamente. Las categorías son configurables en "Gestionar Categorías".</p>
        </div>
      </div>
    </div>
  )
}
