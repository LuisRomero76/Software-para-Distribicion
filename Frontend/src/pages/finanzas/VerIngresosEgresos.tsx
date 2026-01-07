import { useEffect, useState } from 'react'
import { request } from '../../lib/http'
import { useAuth } from '../../context/AuthContext'
import { Eye, Edit2, Search, RefreshCw, Trash2, Download } from 'lucide-react'
import Pagination from '../../components/Pagination'
import * as XLSX from 'xlsx'
import { getAllGastosOperativos, updateGastoOperativo, type GastoOperativo } from '../../services/gastoOperativoService'
import { listCategoriasActivas, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'

interface Vehicle {
  vehicle_id: number
  placa?: string
  modelo?: string
}

export default function VerIngresosEgresos() {
  const { auth } = useAuth()
  const [gastos, setGastos] = useState<GastoOperativo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGasto, setSelectedGasto] = useState<GastoOperativo | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteGasto, setDeleteGasto] = useState<GastoOperativo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [categorias, setCategorias] = useState<GastoOperativoCategoria[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [editForm, setEditForm] = useState({
    categoria_id: 0,
    descripcion: '',
    monto: '',
    vehiculo_id: 0
  })
  const [saving, setSaving] = useState(false)

  const loadGastos = async () => {
    setLoading(true)
    try {
      const data = await getAllGastosOperativos(auth?.token)
      setGastos(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar los egresos')
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const data = await listCategoriasActivas(auth?.token)
      setCategorias(Array.isArray(data) ? data : [])
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
    loadGastos()
    loadCategorias()
    loadVehicles()
  }, [auth?.token])

  const filteredGastos = gastos.filter(gasto =>
    gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gasto.categoriaRelacion?.nombre || gasto.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGastos = filteredGastos.slice(startIndex, startIndex + itemsPerPage)
  useEffect(() => { setCurrentPage(1) }, [searchTerm])

  const handleDelete = async () => {
    if (!deleteGasto) return
    setDeleting(true)
    try {
      await request(`/gasto-operativo/${deleteGasto.gasto_id}`, { method: 'DELETE' }, auth?.token)
      setGastos(gastos.filter(g => g.gasto_id !== deleteGasto.gasto_id))
      setDeleteGasto(null)
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo eliminar el egreso')
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (gasto: GastoOperativo) => {
    // Buscar el gasto actualizado en el estado global para asegurar que tiene todas las relaciones
    const gastoActualizado = gastos.find(g => g.gasto_id === gasto.gasto_id) || gasto

    setSelectedGasto(gastoActualizado)
    setEditMode(true)
    setEditForm({
      categoria_id: gastoActualizado.categoria_id ?? 0,
      descripcion: gastoActualizado.descripcion,
      monto: gastoActualizado.monto.toString(),
      vehiculo_id: gastoActualizado.vehiculo_id ?? 0
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGasto) return

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
      const vehiculoIdNum = Number(editForm.vehiculo_id)
      const payload: any = {
        categoria_id: categoriaIdNum,
        descripcion: editForm.descripcion,
        monto: parseFloat(editForm.monto),
        vehiculo_id: !Number.isNaN(vehiculoIdNum) && vehiculoIdNum > 0 ? vehiculoIdNum : null
      }

      const updated = await updateGastoOperativo(selectedGasto.gasto_id, payload, auth?.token)
      
      const updatedGastos = gastos.map(g => g.gasto_id === selectedGasto.gasto_id ? updated : g)
      setGastos(updatedGastos)
      setSelectedGasto(null)
      setEditMode(false)
    } catch (e: any) {
      console.error('Error al actualizar:', e)
    } finally {
      setSaving(false)
    }
  }

  const exportToExcel = () => {
    const dataToExport = gastos.map(gasto => ({
      'ID': gasto.gasto_id,
      'Categoría': gasto.categoriaRelacion?.nombre || gasto.categoria || '—',
      'Descripción': gasto.descripcion,
      'Monto (Bs)': Number(gasto.monto).toFixed(2),
      'Vehículo': gasto.vehiculo ? (gasto.vehiculo.placa || `Vehículo #${gasto.vehiculo.vehicle_id}`) : '—',
      'Fecha de Creación': new Date(gasto.createdAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Egresos')

    const columnWidths = [
      { wch: 8 },  // ID
      { wch: 20 }, // Categoría
      { wch: 40 }, // Descripción
      { wch: 15 }, // Monto
      { wch: 25 }, // Vehículo
      { wch: 20 }  // Fecha de Creación
    ]
    worksheet['!cols'] = columnWidths

    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const fileName = `ingresos_egresos_${year}-${month}-${day}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const formatFecha = (dateString: string) => {
    if (!dateString) return '—'
    return dateString.split('T')[0]
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Ver Ingresos/Egresos</h2>
          <p className="page-subtitle">Gestiona el registro de ingresos y egresos operativos</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-export" onClick={exportToExcel} disabled={gastos.length === 0} title="Exportar a Excel">
            <Download size={18} /> Exportar
          </button>
          <button className="btn-refresh" onClick={loadGastos} disabled={loading}>
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
            {filteredGastos.length} de {gastos.length} egreso(s)
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando egresos...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : filteredGastos.length === 0 ? (
          <div className="empty-state">No hay egresos registrados.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto <br /> (Bs.)</th>
                <th>Fecha de Creación</th>
                <th>Vehículo</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGastos.map(gasto => (
                <tr key={gasto.gasto_id}>
                  <td className="id-col">{gasto.gasto_id}</td>
                  <td>{gasto.categoriaRelacion?.nombre || gasto.categoria || '—'}</td>
                  <td className="name-col">{gasto.descripcion}</td>
                  <td>{Number(gasto.monto).toFixed(2)}</td>
                  <td>{new Date(gasto.createdAt).toLocaleDateString('es-ES')}</td>
                  <td>{gasto.vehiculo ? (gasto.vehiculo.placa || `Vehículo #${gasto.vehiculo.vehicle_id}`) : '—'}</td>
                  <td className="actions-col">
                    <button className="action-btn view" onClick={() => { setSelectedGasto(gasto); setEditMode(false) }} title="Ver detalles">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn edit" onClick={() => handleEdit(gasto)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => setDeleteGasto(gasto)} title="Eliminar">
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
          totalItems={filteredGastos.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedGasto && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => { setSelectedGasto(null); setEditMode(false) }}>
          <div className="modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar Egreso' : 'Detalles del Egreso'}</h3>
              <button className="modal-close" onClick={() => { setSelectedGasto(null); setEditMode(false) }}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
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
                        {categorias.map(cat => (
                          <option key={cat.categoria_id} value={cat.categoria_id}>{cat.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-input" value={selectedGasto.categoriaRelacion?.nombre || selectedGasto.categoria || '—'} disabled />
                    )}
                  </label>
                  <label className="form-field">
                    <span className="label-text">Descripción</span>
                    <input
                      type="text"
                      className="form-input"
                        value={editMode ? editForm.descripcion : selectedGasto.descripcion}
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
                        value={editMode ? editForm.monto : selectedGasto.monto}
                        onChange={e => setEditForm({ ...editForm, monto: e.target.value })}
                      disabled={!editMode}
                      required={editMode}
                    />
                  </label>
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
                        value={selectedGasto.vehiculo ? (selectedGasto.vehiculo.placa || `Vehículo #${selectedGasto.vehiculo.vehicle_id}`) : '—'} 
                        disabled 
                      />
                    )}
                  </label>
                  <label className="form-field">
                    <span className="label-text">ID</span>
                    <input type="text" className="form-input" value={`#${selectedGasto.gasto_id}`} disabled />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Fecha de Creación</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={new Date(selectedGasto.createdAt).toLocaleString('es-ES')} 
                      disabled 
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setSelectedGasto(null); setEditMode(false) }} disabled={saving}>
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

      {deleteGasto && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar egreso?</h3>
            <p>Se eliminará el egreso con descripción <strong>"{deleteGasto.descripcion}"</strong> del sistema.</p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setDeleteGasto(null)} disabled={deleting}>
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
