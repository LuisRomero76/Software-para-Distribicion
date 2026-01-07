import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listCategorias, createCategoria, updateCategoria, deleteCategoria, type GastoOperativoCategoria } from '../../services/gastoOperativoCategoriaService'
import '../../styles/page.css'

export default function GestionCategoriasFinanzas() {
  const { auth } = useAuth()
  const [categorias, setCategorias] = useState<GastoOperativoCategoria[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState<GastoOperativoCategoria | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  })

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Gestionar Categorías de Gastos'
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    setLoading(true)
    try {
      const data = await listCategorias(auth?.token)
      setCategorias(data)
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
      if (editingId) {
        const updated = await updateCategoria(editingId, formData, auth?.token)
        setCategorias(c => c.map(cat => cat.categoria_id === editingId ? updated : cat))
        setEditingId(null)
      } else {
        const created = await createCategoria(formData, auth?.token)
        setCategorias(c => [created, ...c])
      }
      setFormData({ nombre: '', descripcion: '' })
      setShowForm(false)
      setError(null)
    } catch (err: any) {
      setError(err?.message ?? 'Error al procesar la categoría')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cat: GastoOperativoCategoria) => {
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
      await deleteCategoria(deleteCategory.categoria_id, auth?.token)
      setCategorias(c => c.filter(cat => cat.categoria_id !== deleteCategory.categoria_id))
      setDeleteCategory(null)
      setError(null)
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar la categoría')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestionar Categorías de Gastos</h2>
          <p className="page-subtitle">Crea y administra las categorías de ingresos y egresos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nueva categoría
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
            <h3>Categorías Registradas</h3>
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
              <h3>{editingId ? 'Editar categoría' : 'Nueva categoría'}</h3>
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
                      placeholder="Ej: Combustible, Mantenimiento, etc."
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

