import { useEffect, useState } from 'react'
import { Plus, Car, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createGastoOperativo, type TipoEgreso } from '../../services/gastoOperativoService'
import { createIngreso, listIngresoCategoriaActivas, type IngresoCategoria } from '../../services/ingresoService'
import { listCategoriasActivas, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'
import { request } from '../../lib/http'
import '../../styles/page.css'

interface Vehicle {
  vehicle_id: number
  placa?: string
  modelo?: string
}

type TipoTransaccion = 'INGRESO' | 'EGRESO'

export default function RegistroIngresosEgresos() {
  const { auth } = useAuth()
  const [tipoActivo, setTipoActivo] = useState<TipoTransaccion>('EGRESO')
  const [categoriasEgreso, setCategoriasEgreso] = useState<GastoOperativoCategoria[]>([])
  const [categoriasIngreso, setCategoriasIngreso] = useState<IngresoCategoria[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formEgreso, setFormEgreso] = useState({
    tipo: 'OTRO' as TipoEgreso,
    categoria_id: 0,
    descripcion: '',
    monto: '',
    vehiculo_id: 0
  })

  const [formIngreso, setFormIngreso] = useState({
    categoria_id: 0,
    descripcion: '',
    monto: ''
  })

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Registrar Ingreso / Egreso'
    loadCategoriasEgreso()
    loadCategoriasIngreso()
    loadVehicles()
  }, [])

  const loadCategoriasEgreso = async () => {
    try {
      const categoriasData = await listCategoriasActivas(auth?.token)
      setCategoriasEgreso(Array.isArray(categoriasData) ? categoriasData : [])
      if (categoriasData.length > 0) {
        setFormEgreso(f => ({ ...f, categoria_id: categoriasData[0].categoria_id }))
      }
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar las categorías de egresos')
    }
  }

  const loadCategoriasIngreso = async () => {
    try {
      const categoriasData = await listIngresoCategoriaActivas(auth?.token)
      setCategoriasIngreso(Array.isArray(categoriasData) ? categoriasData : [])
      if (categoriasData.length > 0) {
        setFormIngreso(f => ({ ...f, categoria_id: categoriasData[0].categoria_id }))
      }
    } catch (e: any) {
      console.error('Error al cargar categorías de ingresos:', e)
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
    if (!formEgreso.monto || !formEgreso.tipo) {
      alert('Por favor complete el monto y tipo')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        tipo: formEgreso.tipo,
        monto: Number(formEgreso.monto),
      }
      if (formEgreso.categoria_id) payload.categoria_id = formEgreso.categoria_id
      if (formEgreso.descripcion) payload.descripcion = formEgreso.descripcion
      if (formEgreso.vehiculo_id) payload.vehiculo_id = formEgreso.vehiculo_id
      
      await createGastoOperativo(payload, auth?.token)
      setFormEgreso({ tipo: 'OTRO', categoria_id: 0, descripcion: '', monto: '', vehiculo_id: 0 })
      alert('Egreso registrado correctamente')
    } catch (err: any) {
      alert(err?.message ?? 'No se pudo registrar el egreso')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitIngreso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formIngreso.descripcion || !formIngreso.monto || !formIngreso.categoria_id) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      const payload = {
        tipo: 'OTRO' as const,
        categoria_id: formIngreso.categoria_id,
        descripcion: formIngreso.descripcion,
        monto: Number(formIngreso.monto)
      }
      await createIngreso(payload, auth?.token)
      setFormIngreso({ categoria_id: categoriasIngreso[0]?.categoria_id || 0, descripcion: '', monto: '' })
      alert('Ingreso registrado correctamente')
    } catch (err: any) {
      alert(err?.message ?? 'No se pudo registrar el ingreso')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Registrar Ingreso/Egreso</h2>
          <p className="page-subtitle">Registra ingresos y egresos operativos</p>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Tabs para seleccionar Ingreso o Egreso */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setTipoActivo('EGRESO')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: tipoActivo === 'EGRESO' ? '#ef4444' : '#f3f4f6',
            color: tipoActivo === 'EGRESO' ? '#fff' : '#374151',
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
          Egreso
        </button>
        <button
          onClick={() => setTipoActivo('INGRESO')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: tipoActivo === 'INGRESO' ? '#22c55e' : '#f3f4f6',
            color: tipoActivo === 'INGRESO' ? '#fff' : '#374151',
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
          Ingreso
        </button>
      </div>

      {/* Formulario de Egreso */}
      {tipoActivo === 'EGRESO' && (
        <div className="filters-card">
          <div className="filters-header">
            <Plus size={20} />
            <h3>Registrar Egreso</h3>
          </div>
          <form className="filters-grid" style={{ gridTemplateColumns: '1fr' }} onSubmit={handleSubmitEgreso}>
            <div className="filter-group">
              <label className="filter-label">Tipo de Egreso *</label>
              <select
                className="filter-select"
                value={formEgreso.tipo}
                onChange={(e) => setFormEgreso({ ...formEgreso, tipo: e.target.value as TipoEgreso })}
                required
              >
                <option value="COMPRA">Compra</option>
                <option value="COMBUSTIBLE">Combustible</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="OPERATIVO">Operativo</option>
                <option value="NOMINA">Nómina</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Categoría</label>
              <select
                className="filter-select"
                value={formEgreso.categoria_id}
                onChange={(e) => setFormEgreso({ ...formEgreso, categoria_id: Number(e.target.value) })}
              >
                <option value={0}>-- Sin categoría --</option>
                {categoriasEgreso.map(cat => (
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
                placeholder="Detalle del gasto (opcional)"
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
              <button className="btn-primary" type="submit" disabled={saving} style={{ backgroundColor: '#ef4444' }}>
                {saving ? 'Guardando...' : 'Registrar egreso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario de Ingreso */}
      {tipoActivo === 'INGRESO' && (
        <div className="filters-card">
          <div className="filters-header">
            <Plus size={20} />
            <h3>Registrar Ingreso</h3>
          </div>
          <form className="filters-grid" style={{ gridTemplateColumns: '1fr' }} onSubmit={handleSubmitIngreso}>
            <div className="filter-group">
              <label className="filter-label">Categoría *</label>
              <select
                className="filter-select"
                value={formIngreso.categoria_id}
                onChange={(e) => setFormIngreso({ ...formIngreso, categoria_id: Number(e.target.value) })}
                required
              >
                <option value={0}>-- Seleccione categoría --</option>
                {categoriasIngreso.map(cat => (
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
                value={formIngreso.descripcion}
                onChange={(e) => setFormIngreso({ ...formIngreso, descripcion: e.target.value })}
                placeholder="Detalle del ingreso"
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
                value={formIngreso.monto}
                onChange={(e) => setFormIngreso({ ...formIngreso, monto: e.target.value })}
                required
              />
            </div>

            <div className="filters-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="btn-primary" type="submit" disabled={saving} style={{ backgroundColor: '#22c55e' }}>
                {saving ? 'Guardando...' : 'Registrar ingreso'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
