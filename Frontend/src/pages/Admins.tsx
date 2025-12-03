import { useEffect, useState } from 'react';
import { request } from '../lib/http';
import { useAuth } from '../context/AuthContext';
import { Eye, Edit2, Search, RefreshCw, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DashboardAdmins() {
  const { auth } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteAdmin, setDeleteAdmin] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', telefono: '', email: '' });
  const [saving, setSaving] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await request<any[]>('/admin', {}, auth?.token);
      setAdmins(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Administradores';
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [auth?.token]);

  const filteredAdmins = admins.filter(admin => 
    admin.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteAdmin) return;
    setDeleting(true);
    try {
      await request(`/admin/${deleteAdmin.admin_id}`, { method: 'DELETE' }, auth?.token);
      setAdmins(admins.filter(a => a.admin_id !== deleteAdmin.admin_id));
      setDeleteAdmin(null);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo eliminar el administrador');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (admin: any) => {
    setSelectedAdmin(admin);
    setEditMode(true);
    setEditForm({
      nombre: admin.nombre,
      apellido: admin.apellido,
      telefono: admin.telefono,
      email: admin.email
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    
    setSaving(true);
    try {
      const updated = await request(
        `/admin/${selectedAdmin.admin_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        },
        auth?.token
      );
      
      setAdmins(admins.map(a => a.admin_id === selectedAdmin.admin_id ? updated : a));
      setSelectedAdmin(null);
      setEditMode(false);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo actualizar el administrador');
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = admins.map(admin => ({
      'ID': admin.admin_id,
      'Nombre': admin.nombre,
      'Apellido': admin.apellido,
      'Email': admin.email,
      'Teléfono': admin.telefono,
      'Fecha de Creación': new Date(admin.createdAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Administradores');

    const columnWidths = [
      { wch: 8 },  
      { wch: 20 }, 
      { wch: 20 }, 
      { wch: 30 }, 
      { wch: 15 }, 
      { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    // Generar nombre con fecha local
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `administradores_${year}-${month}-${day}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Administradores</h2>
          <p className="page-subtitle">Gestiona los administradores del sistema</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-export" onClick={exportToExcel} disabled={admins.length === 0} title="Exportar a Excel">
            <Download size={18} /> Exportar
          </button>
          <button className="btn-refresh" onClick={loadAdmins} disabled={loading}>
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
              placeholder="Buscar por nombre, apellido o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-info">
            {filteredAdmins.length} de {admins.length} administrador(es)
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando administradores...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="empty-state">No se encontraron administradores</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Fecha de Creación</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map(admin => (
                <tr key={admin.admin_id}>
                  <td className="id-col">{admin.admin_id}</td>
                  <td className="name-col">{admin.nombre} {admin.apellido}</td>
                  <td>{admin.telefono}</td>
                  <td className="email-col">{admin.email}</td>
                  <td>{new Date(admin.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="actions-col">
                    <button className="action-btn view" onClick={() => { setSelectedAdmin(admin); setEditMode(false); }} title="Ver información">
                      <Eye size={16}/>
                    </button>
                    <button className="action-btn edit" onClick={() => handleEdit(admin)} title="Editar">
                      <Edit2 size={16}/>
                    </button>
                    {admin.email !== auth?.email && (
                      <button className="action-btn delete" onClick={() => setDeleteAdmin(admin)} title="Eliminar">
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedAdmin && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedAdmin(null)}>
          <div className="modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Editar administrador' : 'Información del administrador'}</h3>
              <button className="modal-close" onClick={() => setSelectedAdmin(null)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-grid">
                <label>
                  <span className="label-text">Nombre</span>
                  <input 
                    type="text" 
                    value={editMode ? editForm.nombre : selectedAdmin.nombre} 
                    onChange={e => setEditForm({...editForm, nombre: e.target.value})}
                    disabled={!editMode} 
                    readOnly={!editMode} 
                    className="form-input" 
                    required
                  />
                </label>
                <label>
                  <span className="label-text">Apellido</span>
                  <input 
                    type="text" 
                    value={editMode ? editForm.apellido : selectedAdmin.apellido} 
                    onChange={e => setEditForm({...editForm, apellido: e.target.value})}
                    disabled={!editMode} 
                    readOnly={!editMode} 
                    className="form-input" 
                    required
                  />
                </label>
                <label>
                  <span className="label-text">Teléfono</span>
                  <input 
                    type="text" 
                    value={editMode ? editForm.telefono : selectedAdmin.telefono} 
                    onChange={e => setEditForm({...editForm, telefono: e.target.value})}
                    disabled={!editMode} 
                    readOnly={!editMode} 
                    className="form-input" 
                    required
                  />
                </label>
                <label>
                  <span className="label-text">Email</span>
                  <input 
                    type="email" 
                    value={editMode ? editForm.email : selectedAdmin.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                    disabled={!editMode} 
                    readOnly={!editMode} 
                    className="form-input" 
                    required
                  />
                </label>
                <label>
                  <span className="label-text">ID</span>
                  <input type="text" value={`#${selectedAdmin.admin_id}`} disabled readOnly className="form-input" />
                </label>
                <label>
                  <span className="label-text">Fecha de Creación</span>
                  <input type="text" value={new Date(selectedAdmin.createdAt).toLocaleString('es-ES')} disabled readOnly className="form-input" />
                </label>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setSelectedAdmin(null)} disabled={saving}>Cerrar</button>
                {editMode && <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>}
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteAdmin && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !deleting && setDeleteAdmin(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>¿Eliminar administrador?</h3>
            <p>Estás a punto de eliminar a <strong>{deleteAdmin.nombre} {deleteAdmin.apellido}</strong> ({deleteAdmin.email}).</p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setDeleteAdmin(null)} disabled={deleting}>Cancelar</button>
              <button className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
