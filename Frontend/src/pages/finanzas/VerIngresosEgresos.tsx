import { useEffect, useState } from 'react'
import { request } from '../../lib/http'
import { useAuth } from '../../context/AuthContext'
import { Eye, Edit2, Search, RefreshCw, Trash2, Download, TrendingDown, TrendingUp } from 'lucide-react'
import Pagination from '../../components/Pagination'
import * as XLSX from 'xlsx'
import { getAllGastosOperativos, updateGastoOperativo, type GastoOperativo, type TipoEgreso } from '../../services/gastoOperativoService'
import { getAllIngresos, updateIngreso, deleteIngreso, listIngresoCategoriaActivas, type Ingreso, type IngresoCategoria } from '../../services/ingresoService'
import { listCategoriasActivas, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'

interface Vehicle {
  vehicle_id: number
  placa?: string
  modelo?: string
}

type TipoRegistro = 'INGRESO' | 'EGRESO'

interface RegistroUnificado {
  id: number
  tipo: TipoRegistro
  tipoEgreso?: TipoEgreso
  tipoIngreso?: string
  categoria_id?: number | null
  descripcion: string | null
  monto: number
  vehiculo_id?: number | null
  createdAt: string
  categoriaRelacion?: any
  vehiculo?: Vehicle | null
  original: GastoOperativo | Ingreso
}

export default function VerIngresosEgresos() {
  const { auth } = useAuth()
  const [registros, setRegistros] = useState<RegistroUnificado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroUnificado | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteRegistro, setDeleteRegistro] = useState<RegistroUnificado | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [categoriasEgreso, setCategoriasEgreso] = useState<GastoOperativoCategoria[]>([])
  const [categoriasIngreso, setCategoriasIngreso] = useState<IngresoCategoria[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [editForm, setEditForm] = useState({
    categoria_id: 0,
    descripcion: '',
    monto: '',
    vehiculo_id: 0
  })
  const [saving, setSaving] = useState(false)

  const loadDatos = async () => {
    setLoading(true)
    try {
      const [gastosData, ingresosData] = await Promise.all([
        getAllGastosOperativos(auth?.token),
        getAllIngresos(auth?.token)
      ])
      
      const gastosUnificados: RegistroUnificado[] = (Array.isArray(gastosData) ? gastosData : []).map(g => ({
        id: g.gasto_id,
        tipo: 'EGRESO' as const,
        tipoEgreso: g.tipo,
        categoria_id: g.categoria_id,
        descripcion: g.descripcion,
        monto: Number(g.monto),
        vehiculo_id: g.vehiculo_id,
        createdAt: g.createdAt,
        categoriaRelacion: g.categoriaRelacion,
        vehiculo: g.vehiculo,
        original: g
      }))
      
      const ingresosUnificados: RegistroUnificado[] = (Array.isArray(ingresosData) ? ingresosData : []).map(i => ({
        id: i.ingreso_id,
        tipo: 'INGRESO' as const,
        tipoIngreso: (i as any).tipo,
        categoria_id: i.categoria_id,
        descripcion: i.descripcion,
        monto: Number(i.monto),
        vehiculo_id: undefined,
        createdAt: i.createdAt,
        categoriaRelacion: i.categoriaRelacion,
        vehiculo: undefined,
        original: i
      }))
      
      const combinados = [...gastosUnificados, ...ingresosUnificados].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      setRegistros(combinados)
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const [egresoData, ingresoData] = await Promise.all([
        listCategoriasActivas(auth?.token),
        listIngresoCategoriaActivas(auth?.token)
      ])
      setCategoriasEgreso(Array.isArray(egresoData) ? egresoData : [])
      setCategoriasIngreso(Array.isArray(ingresoData) ? ingresoData : [])
    } catch (e: any) {
      console.error('Error al cargar categorías:', e)
    }
  }

  const loadVehicles = async () => {
    try {
      const data = await request<Vehicle[]>('/vehicle', {}, auth?.token)
      setVehicles(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error('Error al cargar vehículos:', e)
    }
  }

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Ver Ingresos/Egresos'
  }, [])

  useEffect(() => {
    loadDatos()
    loadCategorias()
    loadVehicles()
  }, [auth?.token])

  const filteredRegistros = registros.filter(registro =>
    (registro.descripcion && registro.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (registro.categoriaRelacion?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRegistros = filteredRegistros.slice(startIndex, startIndex + itemsPerPage)
  useEffect(() => { setCurrentPage(1) }, [searchTerm])

  const handleDelete = async () => {
    if (!deleteRegistro) return
    setDeleting(true)
    try {
      if (deleteRegistro.tipo === 'EGRESO') {
        const gasto = deleteRegistro.original as GastoOperativo
        await request(`/gasto-operativo/${gasto.gasto_id}`, { method: 'DELETE' }, auth?.token)
      } else {
        const ingreso = deleteRegistro.original as Ingreso
        await deleteIngreso(ingreso.ingreso_id, auth?.token)
      }
      setRegistros(registros.filter(r => !(r.tipo === deleteRegistro.tipo && r.id === deleteRegistro.id)))
      setDeleteRegistro(null)
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo eliminar el registro')
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (registro: RegistroUnificado) => {
    setSelectedRegistro(registro)
    setEditMode(true)
    setEditForm({
      categoria_id: registro.categoria_id ?? 0,
      descripcion: registro.descripcion || '',
      monto: registro.monto.toString(),
      vehiculo_id: registro.vehiculo_id ?? 0
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRegistro) return

    if (!editForm.monto || editForm.monto.trim() === '') {
      alert('El monto es requerido')
      return
    }

    const categoriaIdNum = Number(editForm.categoria_id)
    if (!categoriaIdNum || Number.isNaN(categoriaIdNum) || categoriaIdNum === 0) {
      alert('La categoría es requerida')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        categoria_id: categoriaIdNum,
        descripcion: editForm.descripcion,
        monto: parseFloat(editForm.monto)
      }

      if (selectedRegistro.tipo === 'EGRESO') {
        const gasto = selectedRegistro.original as GastoOperativo
        const vehiculoIdNum = Number(editForm.vehiculo_id)
        payload.vehiculo_id = !Number.isNaN(vehiculoIdNum) && vehiculoIdNum > 0 ? vehiculoIdNum : null
        await updateGastoOperativo(gasto.gasto_id, payload, auth?.token)
      } else {
        await updateIngreso(selectedRegistro.id, payload, auth?.token)
      }

      await loadDatos()
      setSelectedRegistro(null)
      setEditMode(false)
    } catch (e: any) {
      console.error('Error al actualizar:', e)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const exportToExcel = () => {
    const dataToExport = registros.map(registro => {
      const baseData: any = {
        'Tipo': registro.tipo,
        'ID': registro.id,
        'Categoría': registro.categoriaRelacion?.nombre || '—',
        'Descripción': registro.descripcion,
        'Monto (Bs)': Number(registro.monto).toFixed(2),
        'Fecha': new Date(registro.createdAt).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      if (registro.tipo === 'EGRESO') {
        baseData['Vehículo'] = registro.vehiculo ? (registro.vehiculo.placa || `Vehículo #${registro.vehiculo.vehicle_id}`) : '—'
      }
      return baseData
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ingresos y Egresos')

    const columnWidths = [
      { wch: 12 }, // Tipo
      { wch: 8 },  // ID
      { wch: 20 }, // Categoría
      { wch: 40 }, // Descripción
      { wch: 15 }, // Monto
      { wch: 20 }, // Fecha
      { wch: 25 }  // Vehículo (solo para egresos)
    ]
    worksheet['!cols'] = columnWidths

    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const fileName = `ingresos_egresos_${year}-${month}-${day}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Ver Ingresos/Egresos</h2>
          <p className="page-subtitle">Gestiona el registro de ingresos y egresos operativos</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-export" onClick={exportToExcel} disabled={registros.length === 0} title="Exportar a Excel">
            <Download size={18} /> Exportar
          </button>
          <button className="btn-refresh" onClick={loadDatos} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-info">
            {filteredRegistros.length} de {registros.length} registro(s)
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando registros...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : filteredRegistros.length === 0 ? (
          <div className="empty-state">No hay ingresos o egresos registrados.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>ID</th>
                <th>Subtipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto <br /> (Bs.)</th>
                <th>Fecha de Creación</th>
                <th>Vehículo</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRegistros.map((registro, idx) => (
                <tr key={`${registro.tipo}-${registro.id}-${idx}`}>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: registro.tipo === 'INGRESO' ? '#dcfce7' : '#fee2e2',
                      color: registro.tipo === 'INGRESO' ? '#22c55e' : '#ef4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {registro.tipo === 'INGRESO' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {registro.tipo}
                    </span>
                  </td>
                  <td className="id-col">{registro.id}</td>
                  <td>{registro.tipo === 'EGRESO' ? (registro.tipoEgreso || '—') : (registro.tipoIngreso || '—')}</td>
                  <td>{registro.categoriaRelacion?.nombre || '—'}</td>
                  <td className="name-col">{registro.descripcion || '—'}</td>
                  <td>{Number(registro.monto).toFixed(2)}</td>
                  <td>{new Date(registro.createdAt).toLocaleDateString('es-ES')}</td>
                  <td>{registro.vehiculo ? (registro.vehiculo.placa || `Vehículo #${registro.vehiculo.vehicle_id}`) : '—'}</td>
                  <td className="actions-col">
                    <button className="action-btn view" onClick={() => { setSelectedRegistro(registro); setEditMode(false) }} title="Ver detalles">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn edit" onClick={() => handleEdit(registro)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => setDeleteRegistro(registro)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredRegistros.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedRegistro && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => { setSelectedRegistro(null); setEditMode(false) }}>
          <div className="modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? `Editar ${selectedRegistro.tipo}` : `Detalles del ${selectedRegistro.tipo}`}</h3>
              <button className="modal-close" onClick={() => { setSelectedRegistro(null); setEditMode(false) }}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="form-field">
                    <span className="label-text">Tipo de {selectedRegistro.tipo}</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={selectedRegistro.tipo === 'EGRESO' ? (selectedRegistro.tipoEgreso || '—') : (selectedRegistro.tipoIngreso || '—')} 
                      disabled 
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Categoría</span>
                    {editMode ? (
                      <select
                        className="form-input"
                        value={editForm.categoria_id}
                        onChange={e => setEditForm({ ...editForm, categoria_id: parseInt(e.target.value, 10) })}
                        required
                      >
                        <option value="0">Seleccionar...</option>
                        {(selectedRegistro.tipo === 'EGRESO' ? categoriasEgreso : categoriasIngreso).map(cat => (
                          <option key={cat.categoria_id} value={cat.categoria_id}>{cat.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-input" value={selectedRegistro.categoriaRelacion?.nombre || '—'} disabled />
                    )}
                  </label>
                  <label className="form-field">
                    <span className="label-text">Descripción</span>
                    <input
                      type="text"
                      className="form-input"
                      value={editMode ? editForm.descripcion : (selectedRegistro.descripcion || '')}
                      onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
                      disabled={!editMode}
                      required={editMode}
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Monto (Bs.)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={editMode ? editForm.monto : selectedRegistro.monto}
                      onChange={e => setEditForm({ ...editForm, monto: e.target.value })}
                      disabled={!editMode}
                      required={editMode}
                    />
                  </label>
                  {selectedRegistro.tipo === 'EGRESO' && (
                    <label className="form-field">
                      <span className="label-text">Vehículo</span>
                      {editMode ? (
                        <select
                          className="form-input"
                          value={editForm.vehiculo_id}
                          onChange={e => setEditForm({ ...editForm, vehiculo_id: parseInt(e.target.value, 10) })}
                        >
                          <option value="0">Sin vehículo</option>
                          {vehicles.map(v => (
                            <option key={v.vehicle_id} value={v.vehicle_id}>
                              {v.placa ? `${v.placa} - ${v.modelo ?? ''}` : `Vehículo #${v.vehicle_id}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          className="form-input" 
                          value={selectedRegistro.vehiculo ? (selectedRegistro.vehiculo.placa || `Vehículo #${selectedRegistro.vehiculo.vehicle_id}`) : '—'} 
                          disabled 
                        />
                      )}
                    </label>
                  )}
                  <label className="form-field">
                    <span className="label-text">ID</span>
                    <input type="text" className="form-input" value={`#${selectedRegistro.id}`} disabled />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Tipo</span>
                    <input type="text" className="form-input" value={selectedRegistro.tipo} disabled />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Fecha de Creación</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={new Date(selectedRegistro.createdAt).toLocaleString('es-ES')} 
                      disabled 
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setSelectedRegistro(null); setEditMode(false) }} disabled={saving}>
                  Cerrar
                </button>
                {editMode && (
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteRegistro && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar {deleteRegistro.tipo.toLowerCase()}?</h3>
            <p>Se eliminará el {deleteRegistro.tipo.toLowerCase()} con descripción <strong>"{deleteRegistro.descripcion}"</strong> del sistema.</p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setDeleteRegistro(null)} disabled={deleting}>
                Cancelar
              </button>
              <button className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
