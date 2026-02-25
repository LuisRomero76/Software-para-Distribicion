import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import { Eye, Edit2, Search, RefreshCw, Trash2, Download } from 'lucide-react';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import { useSorting } from '../../hooks/useSorting';
import { SortableTh } from '../../components/SortableTh';

export default function CollaboratorsManagement() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollaborator, setSelectedCollaborator] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteCollaborator, setDeleteCollaborator] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', rol: 'preventista' as 'preventista' | 'distribuidor' });
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedCollaborators.map(c => c.collaborator_id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      allSelected ? pageIds.forEach(id => next.delete(id)) : pageIds.forEach(id => next.add(id));
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => request(`/collaborator/${id}`, { method: 'DELETE' }, auth?.token)));
      setCollaborators(prev => prev.filter(c => !selectedIds.has(c.collaborator_id)));
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } catch (e: any) {
      alert(e?.message ?? 'Error al eliminar los colaboradores seleccionados');
    } finally {
      setBulkDeleting(false);
    }
  };

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const data = await request<any[]>('/collaborator', {}, auth?.token);
      setCollaborators(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Colaboradores';
  }, []);

  useEffect(() => {
    loadCollaborators();
  }, [auth?.token]);

  const filteredCollaborators = collaborators.filter(collaborator => 
    collaborator.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collaborator.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collaborator.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenamiento
  const { sorted: sortedCollaborators, sort: sortField, handleSort } = useSorting(filteredCollaborators);

  // Paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCollaborators = sortedCollaborators.slice(startIndex, startIndex + itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteCollaborator) return;
    setDeleting(true);
    try {
      await request(`/collaborator/${deleteCollaborator.collaborator_id}`, { method: 'DELETE' }, auth?.token);
      setCollaborators(collaborators.filter(c => c.collaborator_id !== deleteCollaborator.collaborator_id));
      setDeleteCollaborator(null);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo eliminar el colaborador');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (collaborator: any) => {
    setSelectedCollaborator(collaborator);
    setEditMode(true);
    setEditForm({
      nombre: collaborator.nombre,
      apellido: collaborator.apellido,
      telefono: collaborator.telefono || '',
      email: collaborator.email,
      rol: collaborator.rol || 'preventista'
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollaborator) return;
    
    setSaving(true);
    try {
      const updated = await request(
        `/collaborator/${selectedCollaborator.collaborator_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        },
        auth?.token
      );
      
      setCollaborators(collaborators.map(c => c.collaborator_id === selectedCollaborator.collaborator_id ? updated : c));
      setSelectedCollaborator(null);
      setEditMode(false);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo actualizar el colaborador');
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = collaborators.map(collaborator => ({
      'ID': collaborator.collaborator_id,
      'Nombre': collaborator.nombre,
      'Apellido': collaborator.apellido,
      'Email': collaborator.email,
      'Teléfono': collaborator.telefono || 'N/A',
      'Fecha de Creación': new Date(collaborator.createdAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');
    XLSX.writeFile(workbook, `Colaboradores_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="page-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="page-header">
        <div>
          <h2 className="page-title">Colaboradores</h2>
          <p className="page-subtitle">Gestiona los colaboradores del sistema</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn-export"
            onClick={exportToExcel}
            disabled={collaborators.length === 0}
            title="Exportar a Excel"
          >
            <Download size={18} /> Exportar
          </button>
          <button className="btn-refresh" onClick={loadCollaborators} disabled={loading} title="Recargar">
            <RefreshCw size={18} /> Recargar
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, apellido o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-info">
            {filteredCollaborators.length} de {collaborators.length} colaborador(es)
          </div>
          {selectedIds.size > 0 && (
            <button className="btn-bulk-delete" onClick={() => setShowBulkDeleteModal(true)}>
              <Trash2 size={16} /> Eliminar seleccionados ({selectedIds.size})
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">Cargando colaboradores...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredCollaborators.length === 0 ? (
          <div className="empty-state">No se encontraron colaboradores</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="check-col">
                  <input
                    type="checkbox"
                    checked={paginatedCollaborators.length > 0 && paginatedCollaborators.every(c => selectedIds.has(c.collaborator_id))}
                    onChange={toggleSelectAll}
                    title="Seleccionar todos"
                  />
                </th>
                <SortableTh label="ID" sortKey="collaborator_id" sort={sortField} onSort={handleSort} />
                <SortableTh label="Nombre" sortKey="nombre" sort={sortField} onSort={handleSort} />
                <SortableTh label="Teléfono" sortKey="telefono" sort={sortField} onSort={handleSort} />
                <SortableTh label="Email" sortKey="email" sort={sortField} onSort={handleSort} />
                <SortableTh label="Fecha de Creación" sortKey="createdAt" sort={sortField} onSort={handleSort} />
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCollaborators.map(collaborator => (
                <tr key={collaborator.collaborator_id} className={selectedIds.has(collaborator.collaborator_id) ? 'row-selected' : ''}>
                  <td className="check-col">
                    <input type="checkbox" checked={selectedIds.has(collaborator.collaborator_id)} onChange={() => toggleSelect(collaborator.collaborator_id)} />
                  </td>
                  <td className="id-col">{collaborator.collaborator_id}</td>
                  <td className="name-col">{collaborator.nombre} {collaborator.apellido}</td>
                  <td>{collaborator.telefono || 'N/A'}</td>
                  <td className="email-col">{collaborator.email}</td>
                  <td>{new Date(collaborator.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="actions-col">
                    <button className="action-btn view" onClick={() => navigate(`/colaboradores/${collaborator.collaborator_id}`)} title="Ver información">
                      <Eye size={16}/>
                    </button>
                    <button className="action-btn edit" onClick={() => handleEdit(collaborator)} title="Editar">
                      <Edit2 size={16}/>
                    </button>
                    <button className="action-btn delete" onClick={() => setDeleteCollaborator(collaborator)} title="Eliminar">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCollaborators.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal de Edición */}
      {selectedCollaborator && editMode && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => { setSelectedCollaborator(null); setEditMode(false); }}>
          <div className="modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar colaborador</h3>
              <button className="modal-close" onClick={() => { setSelectedCollaborator(null); setEditMode(false); }}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-grid">
                <label>
                  <span className="label-text">Nombre</span>
                  <input 
                    type="text" 
                    value={editForm.nombre} 
                    onChange={e => setEditForm({...editForm, nombre: e.target.value})}
                    className="form-input" 
                    required
                  />
                </label>
                <label>
                  <span className="label-text">Apellido</span>
                  <input 
                    type="text" 
                    value={editForm.apellido} 
                    onChange={e => setEditForm({...editForm, apellido: e.target.value})}
                    className="form-input" 
                    required
                  />
                </label>
                <label>
                  <span className="label-text">Teléfono</span>
                  <input 
                    type="text" 
                    value={editForm.telefono} 
                    onChange={e => setEditForm({...editForm, telefono: e.target.value})}
                    className="form-input"
                  />
                </label>
                <label>
                  <span className="label-text">Email</span>
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                    className="form-input" 
                    required
                  />
                </label>
                <label>
                  <span className="label-text">Rol</span>
                  <select 
                    value={editForm.rol} 
                    onChange={e => setEditForm({...editForm, rol: e.target.value as 'preventista' | 'distribuidor'})}
                    className="form-input" 
                    required
                  >
                    <option value="preventista">Preventista</option>
                    <option value="distribuidor">Distribuidor</option>
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setEditMode(false); setSelectedCollaborator(null); }} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {deleteCollaborator && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteCollaborator(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>¿Eliminar Colaborador?</h3>
            <p>
              Estás a punto de eliminar a <strong>{deleteCollaborator.nombre} {deleteCollaborator.apellido}</strong>
              ({deleteCollaborator.email})
            </p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => !deleting && setDeleteCollaborator(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="btn danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar {selectedIds.size} colaborador(es)?</h3>
            <p>Esta acción no se puede deshacer. Se eliminarán permanentemente los colaboradores seleccionados.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowBulkDeleteModal(false)} disabled={bulkDeleting}>Cancelar</button>
              <button className="btn danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Eliminando...' : `Sí, eliminar ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
