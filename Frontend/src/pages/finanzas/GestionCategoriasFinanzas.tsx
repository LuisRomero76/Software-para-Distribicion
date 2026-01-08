import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, TrendingDown, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listCategorias, createCategoria, updateCategoria, deleteCategoria, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'
import { listIngresoCategorias, createIngresoCategoria, updateIngresoCategoria, deleteIngresoCategoria, type IngresoCategoria } from '../../services/ingresoService'
import '../../styles/page.css'

type TipoCategoria = 'EGRESO' | 'INGRESO'

export default function GestionCategoriasFinanzas() {
  const { auth } = useAuth()
  const [tipoActivo, setTipoActivo] = useState<TipoCategoria>('EGRESO')
  const [categoriasEgreso, setCategoriasEgreso] = useState<GastoOperativoCategoria[]>([])
  const [categoriasIngreso, setCategoriasIngreso] = useState<IngresoCategoria[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState<GastoOperativoCategoria | IngresoCategoria | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  })

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Gestionar Categorías de Finanzas'
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    setLoading(true)
    try {
      const [egresosData, ingresosData] = await Promise.all([
        listCategorias(auth?.token),
        listIngresoCategorias(auth?.token)
      ])
      setCategoriasEgreso(egresosData)
      setCategoriasIngreso(ingresosData)
      setError(null)
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) return

    setLoading(true)
    try {
      if (tipoActivo === 'EGRESO') {
        if (editingId) {
          const updated = await updateCategoria(editingId, formData, auth?.token)
          setCategoriasEgreso(c => c.map(cat => cat.categoria_id === editingId ? updated : cat))
        } else {
          const created = await createCategoria(formData, auth?.token)
          setCategoriasEgreso(c => [created, ...c])
        }
      } else {
        if (editingId) {
          const updated = await updateIngresoCategoria(editingId, formData, auth?.token)
          setCategoriasIngreso(c => c.map(cat => cat.categoria_id === editingId ? updated : cat))
        } else {
          const created = await createIngresoCategoria(formData, auth?.token)
          setCategoriasIngreso(c => [created, ...c])
        }
      }
      setFormData({ nombre: '', descripcion: '' })
      setEditingId(null)
      setShowForm(false)
      setError(null)
    } catch (err: any) {
      setError(err?.message ?? 'Error al procesar la categoría')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cat: GastoOperativoCategoria | IngresoCategoria) => {
    setFormData({ nombre: cat.nombre, descripcion: cat.descripcion || '' })
    setEditingId(cat.categoria_id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setFormData({ nombre: '', descripcion: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleDelete = async () => {
    if (!deleteCategory) return

    setDeleting(true)
    try {
      if (tipoActivo === 'EGRESO') {
        await deleteCategoria((deleteCategory as GastoOperativoCategoria).categoria_id, auth?.token)
        setCategoriasEgreso(c => c.filter(cat => cat.categoria_id !== deleteCategory.categoria_id))
      } else {
        await deleteIngresoCategoria((deleteCategory as IngresoCategoria).categoria_id, auth?.token)
        setCategoriasIngreso(c => c.filter(cat => cat.categoria_id !== deleteCategory.categoria_id))
      }
      setDeleteCategory(null)
      setError(null)
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar la categoría')
    } finally {
      setDeleting(false)
    }
  }

  const categorias = tipoActivo === 'EGRESO' ? categoriasEgreso : categoriasIngreso

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestionar Categorías de Finanzas</h2>
          <p className="page-subtitle">Administra las categorías de ingresos y egresos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nueva categoría
        </button>
      </div>

      {/* Tabs para seleccionar tipo de categoría */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => {
            setTipoActivo('EGRESO')
            setEditingId(null)
            setShowForm(false)
            setFormData({ nombre: '', descripcion: '' })
          }}
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
          Categorías Egresos
        </button>
        <button
          onClick={() => {
            setTipoActivo('INGRESO')
            setEditingId(null)
            setShowForm(false)
            setFormData({ nombre: '', descripcion: '' })
          }}
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
          Categorías Ingresos
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading && !showForm ? (
        <div className="loading-state">Cargando categorías...</div>
      ) : categorias.length === 0 ? (
        <div className="empty-state">No hay categorías registradas</div>
      ) : (
        <div className="report-table-card">
          <div className="report-table-header">
            <h3>Categorías {tipoActivo === 'EGRESO' ? 'de Egresos' : 'de Ingresos'}</h3>
            <span>{categorias.length} categoría(s)</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.categoria_id}>
                  <td className="id-col">#{cat.categoria_id}</td>
                  <td style={{ fontWeight: 500 }}>{cat.nombre}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{cat.descripcion || '—'}</td>
                  <td className="actions-col">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(cat)}
                        title="Editar"
                        disabled={loading}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteCategory(cat)}
                        title="Eliminar"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleCancel}>
          <div className="modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar categoría' : `Nueva categoría ${tipoActivo === 'EGRESO' ? 'de Egreso' : 'de Ingreso'}`}</h3>
              <button className="modal-close" onClick={handleCancel}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="form-field">
                    <span className="label-text">Nombre *</span>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder={tipoActivo === 'EGRESO' ? 'Ej: Combustible, Mantenimiento, etc.' : 'Ej: Prestamo, Devolucion, etc.'}
                      required
                      autoFocus
                    />
                  </label>
                  <label className="form-field">
                    <span className="label-text">Descripción</span>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción opcional"
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCategory && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar categoría?</h3>
            <p>Se eliminará la categoría <strong>"{deleteCategory.nombre}"</strong> del sistema.</p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setDeleteCategory(null)} disabled={deleting}>
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

