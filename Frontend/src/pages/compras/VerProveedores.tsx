import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getAllProveedores, 
    createProveedor, 
    updateProveedor, 
    deleteProveedor as deleteProveedorService,
    type Proveedor,
    type CreateProveedorDto 
} from '../../services/proveedorService';
import { Search, Trash2, Edit2, Plus, RefreshCw, Download, Eye } from 'lucide-react';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import '../../styles/page.css';
import '../../styles/table.css';

export default function VerProveedores() {
    const navigate = useNavigate();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteProveedor, setDeleteProveedor] = useState<Proveedor | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editProveedor, setEditProveedor] = useState<Proveedor | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<CreateProveedorDto>({
        nombre: '',
        nit_ci: '',
        email: '',
        telefono: '',
        ciudad: ''
    });

    useEffect(() => {
        document.title = 'Grupo Vicorsa | Mis Proveedores';
        loadProveedores();
    }, []);

    const loadProveedores = async () => {
        try {
            setLoading(true);
            const data = await getAllProveedores();
            setProveedores(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar los proveedores');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteProveedor) return;
        setDeleting(true);
        try {
            await deleteProveedorService(deleteProveedor.proveedor_id);
            setProveedores(proveedores.filter(p => p.proveedor_id !== deleteProveedor.proveedor_id));
            setDeleteProveedor(null);
        } catch (err) {
            setError('Error al eliminar el proveedor');
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editProveedor) {
                const updated = await updateProveedor(editProveedor.proveedor_id, formData);
                setProveedores(proveedores.map(p => 
                    p.proveedor_id === editProveedor.proveedor_id ? updated : p
                ));
                setEditProveedor(null);
            } else {
                const created = await createProveedor(formData);
                setProveedores([...proveedores, created]);
                setShowAddModal(false);
            }
            resetForm();
        } catch (err) {
            setError('Error al guardar el proveedor');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            nit_ci: '',
            email: '',
            telefono: '',
            ciudad: ''
        });
    };

    const handleEdit = (proveedor: Proveedor) => {
        setEditProveedor(proveedor);
        setFormData({
            nombre: proveedor.nombre,
            nit_ci: proveedor.nit_ci || '',
            email: proveedor.email || '',
            telefono: proveedor.telefono || '',
            ciudad: proveedor.ciudad || ''
        });
    };

    const handleCancelEdit = () => {
        setEditProveedor(null);
        resetForm();
    };

    const handleAddNew = () => {
        resetForm();
        setShowAddModal(true);
    };

    const exportToExcel = () => {
        const dataToExport = proveedores.map(proveedor => ({
            'ID': proveedor.proveedor_id,
            'Nombre del proveedor/empresa': proveedor.nombre,
            'NIT/CI': proveedor.nit_ci || '-',
            'Email': proveedor.email || '-',
            'Teléfono': proveedor.telefono || '-',
            'Ciudad': proveedor.ciudad || '-',
            'Fecha de registro': proveedor.createdAt ? new Date(proveedor.createdAt).toLocaleDateString('es-ES') : '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');

        worksheet['!cols'] = [
            { wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 18 }
        ];

        const today = new Date();
        const fileName = `proveedores_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const filteredProveedores = proveedores.filter(proveedor => 
        proveedor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.nit_ci?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.telefono?.includes(searchTerm) ||
        proveedor.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProveedores = filteredProveedores.slice(startIndex, startIndex + itemsPerPage);
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Mis Proveedores</h2>
                    <p className="page-subtitle">Gestiona tus proveedores</p>
                </div>
                <div className="page-header-actions">
                    <button onClick={exportToExcel}  disabled={proveedores.length === 0} className="btn-export">
                        <Download size={18} />
                        Exportar
                    </button>
                    <button onClick={loadProveedores} className="btn-refresh">
                        <RefreshCw size={18} />
                        Actualizar
                    </button>
                    <button onClick={handleAddNew} className="btn-primary">
                        <Plus size={18} />
                        Agregar Proveedor
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="table-container">
                <div className="table-controls">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, NIT/CI, email, teléfono o ciudad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <p>Cargando proveedores...</p>
                    </div>
                ) : filteredProveedores.length === 0 ? (
                    <div className="empty-state">
                        No se encontraron proveedores
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre del proveedor/empresa</th>
                                    <th>NIT/CI</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Ciudad</th>
                                    <th className='actions-col'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProveedores.map(proveedor => (
                                    <tr key={proveedor.proveedor_id}>
                                        <td className="id-col">{proveedor.proveedor_id}</td>
                                        <td className="font-medium">{proveedor.nombre}</td>
                                        <td>{proveedor.nit_ci || '-'}</td>
                                        <td>{proveedor.email || '-'}</td>
                                        <td>{proveedor.telefono || '-'}</td>
                                        <td>{proveedor.ciudad || '-'}</td>
                                        <td className='actions-col'>
                                            <button 
                                                className="action-btn view"
                                                onClick={() => navigate(`/compras/proveedores/${proveedor.proveedor_id}`)}
                                                title="Ver detalles"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                className="action-btn edit"
                                                onClick={() => handleEdit(proveedor)}
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                className="action-btn delete"
                                                onClick={() => setDeleteProveedor(proveedor)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredProveedores.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>

            {/* Modal de agregar proveedor */}
            {showAddModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !saving && setShowAddModal(false)}>
                    <div className="modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Agregar nuevo proveedor</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label>
                                    <span className="label-text">Nombre del proveedor/empresa *</span>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="form-input"
                                        placeholder="Ej: Distribuidora XYZ"
                                        required
                                    />
                                </label>
                                <label>
                                    <span className="label-text">NIT/CI</span>
                                    <input
                                        type="text"
                                        value={formData.nit_ci}
                                        onChange={(e) => setFormData({...formData, nit_ci: e.target.value})}
                                        className="form-input"
                                        placeholder="123456789"
                                    />
                                </label>
                                <label>
                                    <span className="label-text">Email</span>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="form-input"
                                        placeholder="contacto@ejemplo.com"
                                    />
                                </label>
                                <label>
                                    <span className="label-text">Teléfono</span>
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                        className="form-input"
                                        placeholder="71234567"
                                    />
                                </label>
                                <label>
                                    <span className="label-text">Ciudad</span>
                                    <input
                                        type="text"
                                        value={formData.ciudad}
                                        onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                                        className="form-input"
                                        placeholder="Santa Cruz"
                                    />
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar proveedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de editar proveedor */}
            {editProveedor && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !saving && handleCancelEdit()}>
                    <div className="modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Editar proveedor</h3>
                            <button className="modal-close" onClick={handleCancelEdit}>×</button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label>
                                    <span className="label-text">Nombre del proveedor/empresa *</span>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="form-input"
                                        required
                                    />
                                </label>
                                <label>
                                    <span className="label-text">NIT/CI</span>
                                    <input
                                        type="text"
                                        value={formData.nit_ci}
                                        onChange={(e) => setFormData({...formData, nit_ci: e.target.value})}
                                        className="form-input"
                                    />
                                </label>
                                <label>
                                    <span className="label-text">Email</span>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="form-input"
                                    />
                                </label>
                                <label>
                                    <span className="label-text">Teléfono</span>
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                        className="form-input"
                                    />
                                </label>
                                <label>
                                    <span className="label-text">Ciudad</span>
                                    <input
                                        type="text"
                                        value={formData.ciudad}
                                        onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                                        className="form-input"
                                    />
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={handleCancelEdit} className="btn-secondary" disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {deleteProveedor && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !deleting && setDeleteProveedor(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>¿Eliminar proveedor?</h3>
                        <p>Estás a punto de eliminar el proveedor <strong>{deleteProveedor.nombre}</strong>.</p>
                        <p className="warning-text">Esta acción no se puede deshacer.</p>
                        <div className="modal-actions">
                            <button className="btn outline" onClick={() => setDeleteProveedor(null)} disabled={deleting}>
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
    );
}
