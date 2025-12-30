import { useState, useEffect } from 'react';
import { useClientes, type Cliente, type CreateClientePayload } from './hooks/useClientes';
import { useCategoriasClientes } from './hooks/useCategoriasClientes';
import { Search, Trash2, Users, Eye, Edit2, Download, RefreshCw, Upload, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Pagination from '../../components/Pagination';
import MapSelector from './components/MapSelector';
import './VerClientes.css';

export default function VerClientes() {
  const { clientes, loading, error, deleteCliente, updateCliente, fetchClientes } = useClientes();
  const { categorias } = useCategoriasClientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CreateClientePayload>>({});
  const [telefonos, setTelefonos] = useState<{ numero: string; nombre_contacto?: string }[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Ver Clientes';
  }, []);

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.ciudad && c.ciudad.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.telefono && c.telefono.includes(searchTerm))
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClientes = filteredClientes.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAskDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCliente(deleteId);
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setEditForm({
      sub_canal: cliente.sub_canal,
      visita: cliente.visita,
      nit_ci: cliente.nit_ci,
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      coordenadas: cliente.coordenadas,
      telefono: cliente.telefono,
      ruta: cliente.ruta,
      dia_visita: cliente.dia_visita,
      cliente_categoria_ids: cliente.categorias.map(c => c.cliente_categoria_id),
    });
    setTelefonos(cliente.telefonos_referencia || []);
    setEditError(null);
    setEditSuccess(null);
    setErrorField(null);
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingCliente(null);
    setEditForm({});
    setTelefonos([]);
    setEditError(null);
    setEditSuccess(null);
    setErrorField(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCliente) return;

    setEditError(null);
    setEditSuccess(null);

    const payload: Partial<CreateClientePayload> = { 
      sub_canal: editForm.sub_canal,
      visita: editForm.visita,
      nombre: editForm.nombre,
      direccion: editForm.direccion,
      ciudad: editForm.ciudad,
      coordenadas: editForm.coordenadas,
      telefono: editForm.telefono,
      ruta: editForm.ruta,
      dia_visita: editForm.dia_visita,
      cliente_categoria_ids: editForm.cliente_categoria_ids,
      telefonos_referencia: telefonos,
    };

    // Solo incluir nit_ci si tiene un valor válido (número)
    if (editForm.nit_ci !== undefined && editForm.nit_ci !== null) {
      payload.nit_ci = editForm.nit_ci;
    }

    try {
      await updateCliente(editingCliente.cliente_id, payload);
      setEditSuccess('Cliente actualizado correctamente');
      
      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        setShowEditModal(false);
        setEditingCliente(null);
        setEditError(null);
        setEditSuccess(null);
      }, 1500);
    } catch (e: any) {
      console.error('Error al actualizar cliente:', e);
      
      // Detectar errores específicos
      let errorMessage = 'Error al actualizar cliente';
      let fieldWithError: string | null = null;
      
      if (e?.message) {
        const msg = e.message.toLowerCase();
        
        // Detectar error de NIT/CI duplicado
        if (msg.includes('duplicate') || msg.includes('duplicado') || msg.includes('unique') || msg.includes('nit_ci') || msg.includes('ya está registrado')) {
          errorMessage = '❌ El campo NIT/CI ya está registrado en otro cliente';
          fieldWithError = 'nit_ci';
        } 
        // Detectar otros errores de duplicados
        else if (msg.includes('already exists') || msg.includes('ya existe')) {
          errorMessage = 'Ya existe un cliente con estos datos. Por favor, verifique la información ingresada.';
        }
        // Error de validación
        else if (msg.includes('validation') || msg.includes('validación')) {
          errorMessage = 'Error de validación: ' + e.message;
        }
        // Si es "Internal server error" y tenemos un NIT/CI, probablemente sea duplicado
        else if (msg.includes('internal server error') && editForm.nit_ci) {
          errorMessage = '❌ El campo NIT/CI ya está registrado en otro cliente';
          fieldWithError = 'nit_ci';
        }
        // Otros errores
        else if (!msg.includes('internal server error')) {
          errorMessage = e.message;
        }
      }
      
      setEditError(errorMessage);
      setErrorField(fieldWithError);
    }
  };

  const updateEditForm = (k: keyof CreateClientePayload, v: any) => {
    setEditForm(prev => ({ ...prev, [k]: v }));
    // Limpiar error si el usuario está editando el campo que tiene error
    if (k === errorField) {
      setEditError(null);
      setErrorField(null);
    }
  };

  const toggleCategoria = (id: number) => {
    setEditForm(prev => {
      const set = new Set(prev.cliente_categoria_ids);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...prev, cliente_categoria_ids: Array.from(set) };
    });
  };

  const exportToExcel = () => {
    const dataToExport = clientes.map(c => ({
      ID: c.cliente_id,
      Nombre: c.nombre,
      'NIT/CI': c.nit_ci,
      Dirección: c.direccion,
      Ciudad: c.ciudad,
      Teléfono: c.telefono,
      Ruta: c.ruta,
      'Día Visita': c.dia_visita,
      Categorías: c.categorias.map(k => k.nombre).join(', '),
      'Sub Canal': c.sub_canal,
      Visita: c.visita
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, 'Clientes_Vicorsa.xlsx');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Users size={28} /> Ver Clientes</h2>
          <p className="page-subtitle">Gestión y listado de clientes registrados</p>
        </div>
        <div className="page-header-actions">
          <Link to="/clientes/importar" className="btn-export" title="Importar clientes desde Excel">
            <Upload size={20} /> Importar
          </Link>
          <button className="btn-export" onClick={exportToExcel} title="Exportar a Excel">
            <Download size={20} /> Exportar
          </button>
          <button className="btn-refresh" disabled={loading} onClick={fetchClientes} title="Actualizar lista de clientes">
            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-info">Cargando clientes...</div>
      ) : error ? (
        <div className="state-error">{error}</div>
      ) : (
        <div className="table-container">
          <div className="table-controls">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sub_canal</th>
                <th>Nombre</th>
                <th>Nit/CI</th>
                <th>Teléfono</th>
                <th>Categorías</th>
                <th>Ciudad</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClientes.map(c => (
                <tr key={c.cliente_id}>
                  <td>{c.cliente_id}</td>
                  <td>{c.sub_canal}</td>
                  <td>{c.nombre}</td>
                  <td>{c.nit_ci}</td>
                  <td>{c.telefono}</td>
                  <td>
                    <div className="tags-cell">
                      {c.categorias.map(k => (
                        <span key={k.cliente_categoria_id} className="tag">{k.nombre}</span>
                      ))}
                    </div>
                  </td>
                  <td>{c.ciudad}</td>
                  <td className="actions-col">
                    <button className="action-btn view" onClick={() => navigate(`/clientes/${c.cliente_id}`)} title="Ver detalles">
                      <Eye size={16} />
                    </button>

                    <button className="action-btn edit" onClick={() => handleEdit(c)} title="Editar">
                      <Edit2 size={16} />
                    </button>

                    <button className="action-btn delete" onClick={() => handleAskDelete(c.cliente_id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedClientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredClientes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {showEditModal && editingCliente && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Editar Cliente</h3>
              <button className="modal-close" onClick={handleCancelEdit}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSaveEdit}>
              {/* Alertas de error y éxito */}
              {editError && (
                <div className="alert alert-error" style={{ margin: '0 0 1rem 0' }}>
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="alert alert-success" style={{ margin: '0 0 1rem 0' }}>
                  {editSuccess}
                </div>
              )}

              <div className="form-grid">
                <div className="form-row">
                  <label>Sub Canal</label>
                  <input value={editForm.sub_canal || ''} onChange={e => updateEditForm('sub_canal', e.target.value)} maxLength={100} required />
                </div>
                <div className="form-row">
                  <label>Nombre</label>
                  <input value={editForm.nombre || ''} onChange={e => updateEditForm('nombre', e.target.value)} maxLength={100} required />
                </div>
                <div className="form-row">
                  <label>NIT/CI {errorField === 'nit_ci' && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginLeft: '8px' }}>⚠ Este campo está duplicado</span>}</label>
                  <input 
                    type="number" 
                    value={editForm.nit_ci || ''} 
                    onChange={e => updateEditForm('nit_ci', e.target.value ? parseInt(e.target.value, 10) : undefined)} 
                    style={errorField === 'nit_ci' ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                  />
                </div>
                <div className="form-row">
                  <label>Dirección</label>
                  <input value={editForm.direccion || ''} onChange={e => updateEditForm('direccion', e.target.value)} maxLength={200} required />
                </div>
                <div className="form-row">
                  <label>Ciudad</label>
                  <input value={editForm.ciudad || ''} onChange={e => updateEditForm('ciudad', e.target.value)} maxLength={100} />
                </div>
                <div className="form-row">
                  <label>Teléfono</label>
                  <input value={editForm.telefono || ''} onChange={e => updateEditForm('telefono', e.target.value)} maxLength={20} />
                </div>
                <div className="form-row">
                  <label>Ruta</label>
                  <input value={editForm.ruta || ''} onChange={e => updateEditForm('ruta', e.target.value)} maxLength={100} />
                </div>
                <div className="form-row">
                  <label>Día de Visita</label>
                  <input type="date" value={editForm.dia_visita || ''} onChange={e => updateEditForm('dia_visita', e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Coordenadas</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      value={editForm.coordenadas || ''} 
                      onChange={e => updateEditForm('coordenadas', e.target.value)} 
                      maxLength={200}
                      placeholder="-16.5,-68.15"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowMapModal(true)}
                      title="Seleccionar en el mapa"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <MapPin size={18} /> Mapa
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <label>Categorías</label>
                <div className="checkbox-group">
                  {categorias.map(cat => (
                    <label key={cat.cliente_categoria_id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.cliente_categoria_ids?.includes(cat.cliente_categoria_id) || false}
                        onChange={() => toggleCategoria(cat.cliente_categoria_id)}
                      />
                      {cat.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar cliente?</h3>
            <p>Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar este cliente?</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={handleCancelDelete}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <MapSelector
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelect={(coordinates) => updateEditForm('coordenadas', coordinates)}
        initialCoordinates={editForm.coordenadas}
      />
    </div>
  );
}
