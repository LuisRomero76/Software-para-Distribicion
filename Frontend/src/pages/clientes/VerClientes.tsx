import { useState, useEffect } from 'react';
import { useClientes, type Cliente, type CreateClientePayload } from './hooks/useClientes';
import { useCollaborators } from './hooks/useCollaborators';
import { Visita } from './types/visita';
import { DiaVisita } from './types/dia-visita';
import { Search, Trash2, Users, Eye, Edit2, Download, RefreshCw, Upload, MapPin, X, Plus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Pagination from '../../components/Pagination';
import MapSelector from './components/MapSelector';
import './VerClientes.css';
import { useSorting } from '../../hooks/useSorting';
import { SortableTh } from '../../components/SortableTh';

export default function VerClientes() {
  const { clientes, loading, error, deleteCliente, updateCliente, fetchClientes } = useClientes();
  const { preventistas } = useCollaborators();
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const navigate = useNavigate();

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedClientes.map(c => c.cliente_id);
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
      for (const id of selectedIds) {
        await deleteCliente(id);
      }
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Ver Clientes';
  }, []);

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.ciudad && c.ciudad.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.telefono && c.telefono.includes(searchTerm))
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const { sorted: sortedClientes, sort: sortField, handleSort } = useSorting(filteredClientes, (item, key) => {
    if (key === 'preventista') return (item as any).preventista?.nombre ?? '';
    return (item as any)[key];
  });
  const paginatedClientes = sortedClientes.slice(startIndex, startIndex + itemsPerPage);

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
      dia_visita: cliente.dia_visita,
      preventista_id: cliente.preventista_id || undefined,
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

    // Validar que el preventista esté seleccionado
    if (!editForm.preventista_id || editForm.preventista_id === 0) {
      setEditError('Por favor selecciona un preventista');
      setErrorField('preventista_id');
      return;
    }

    // Asegurar que preventista_id sea un número válido
    const preventistaId = typeof editForm.preventista_id === 'number' 
      ? editForm.preventista_id 
      : Number(editForm.preventista_id);

    if (isNaN(preventistaId) || preventistaId <= 0) {
      setEditError('El preventista seleccionado no es válido');
      setErrorField('preventista_id');
      return;
    }

    const payload: Partial<CreateClientePayload> = { 
      sub_canal: editForm.sub_canal,
      visita: editForm.visita,
      nombre: editForm.nombre,
      direccion: editForm.direccion,
      ciudad: editForm.ciudad,
      coordenadas: editForm.coordenadas,
      telefono: editForm.telefono,
      dia_visita: editForm.dia_visita,
      preventista_id: preventistaId,
      telefonos_referencia: telefonos,
    };

    // Solo incluir nit_ci si tiene un valor válido (número)
    if (editForm.nit_ci !== undefined && editForm.nit_ci !== null) {
      payload.nit_ci = editForm.nit_ci;
    }

    try {
      await updateCliente(editingCliente.cliente_id, payload);
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchClientes();
      setEditSuccess('Cliente actualizado correctamente');
      
      setTimeout(() => {
        setShowEditModal(false);
        setEditingCliente(null);
        setEditError(null);
        setEditSuccess(null);
      }, 1500);
    } catch (e: any) {
      console.error('❌ Error al actualizar cliente:', e);
      
      let errorMessage = 'Error al actualizar cliente';
      let fieldWithError: string | null = null;
      
      if (e?.message) {
        const msg = e.message.toLowerCase();
        
        if (msg.includes('duplicate') || msg.includes('duplicado') || msg.includes('unique') || msg.includes('nit_ci') || msg.includes('ya está registrado')) {
          errorMessage = '❌ El campo NIT/CI ya está registrado en otro cliente';
          fieldWithError = 'nit_ci';
        }
        else if (msg.includes('preventista') || msg.includes('colaborador')) {
          errorMessage = '❌ Error con el preventista seleccionado. Por favor, verifique que el preventista existe y tenga el rol correcto.';
          fieldWithError = 'preventista_id';
        }
        else if (msg.includes('already exists') || msg.includes('ya existe')) {
          errorMessage = 'Ya existe un cliente con estos datos. Por favor, verifique la información ingresada.';
        }
        else if (msg.includes('validation') || msg.includes('validación')) {
          errorMessage = 'Error de validación: ' + e.message;
        }
        else if (msg.includes('internal server error') && editForm.nit_ci) {
          errorMessage = '❌ El campo NIT/CI ya está registrado en otro cliente';
          fieldWithError = 'nit_ci';
        }
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
    if (k === errorField) {
      setEditError(null);
      setErrorField(null);
    }
  };

  const exportToExcel = () => {
    const dataToExport = clientes.map(c => ({
      ID: c.cliente_id,
      Nombre: c.nombre,
      'NIT/CI': c.nit_ci,
      Dirección: c.direccion,
      Ciudad: c.ciudad,
      Teléfono: c.telefono,
      'Día Visita': c.dia_visita,
      Preventista: c.preventista ? `${c.preventista.nombre} ${c.preventista.apellido}` : 'Sin asignar',
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
            {selectedIds.size > 0 && (
              <button className="btn-bulk-delete" onClick={() => setShowBulkDeleteModal(true)}>
                <Trash2 size={16} /> Eliminar seleccionados ({selectedIds.size})
              </button>
            )}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th className="check-col">
                  <input
                    type="checkbox"
                    checked={paginatedClientes.length > 0 && paginatedClientes.every(c => selectedIds.has(c.cliente_id))}
                    onChange={toggleSelectAll}
                    title="Seleccionar todos"
                  />
                </th>
                <SortableTh label="ID" sortKey="cliente_id" sort={sortField} onSort={handleSort} />
                <SortableTh label="Sub_canal" sortKey="sub_canal" sort={sortField} onSort={handleSort} />
                <SortableTh label="Nombre" sortKey="nombre" sort={sortField} onSort={handleSort} />
                <SortableTh label="Nit/CI" sortKey="nit_ci" sort={sortField} onSort={handleSort} />
                <SortableTh label="Teléfono" sortKey="telefono" sort={sortField} onSort={handleSort} />
                <SortableTh label="Día de Visita" sortKey="dia_visita" sort={sortField} onSort={handleSort} />
                <th>Preventista</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClientes.map(c => (
                <tr key={c.cliente_id} className={selectedIds.has(c.cliente_id) ? 'row-selected' : ''}>
                  <td className="check-col">
                    <input type="checkbox" checked={selectedIds.has(c.cliente_id)} onChange={() => toggleSelect(c.cliente_id)} />
                  </td>
                  <td>{c.cliente_id}</td>
                  <td>{c.sub_canal}</td>
                  <td>{c.nombre}</td>
                  <td>{c.nit_ci}</td>
                  <td>{c.telefono}</td>
                  <td>{c.dia_visita}</td>
                  <td>{c.preventista ? `${c.preventista.nombre} ${c.preventista.apellido}` : 'Sin asignar'}</td>
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
          <div className="modal modal-large edit-client-modal">
            <div className="modal-header">
              <h3>Editar Cliente: {editingCliente.nombre}</h3>
              <button className="modal-close" onClick={handleCancelEdit} type="button">
                <X size={24} />
              </button>
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

              {/* Información General */}
              <div className="form-section">
                <h4 className="form-section-title">Información General</h4>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Nombre del Contribuyente *</label>
                    <input
                      value={editForm.nombre || ''}
                      onChange={e => updateEditForm('nombre', e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>NIT/CI {errorField === 'nit_ci' && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginLeft: '8px' }}>⚠ Este campo está duplicado</span>}</label>
                    <input
                      type="number"
                      value={editForm.nit_ci || ''}
                      onChange={e => updateEditForm('nit_ci', e.target.value ? Number(e.target.value) : undefined)}
                      style={errorField === 'nit_ci' ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                    />
                  </div>
                  <div className="form-row">
                    <label>Sub Canal *</label>
                    <input
                      value={editForm.sub_canal || ''}
                      onChange={e => updateEditForm('sub_canal', e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Visita</label>
                    <select
                      value={editForm.visita || ''}
                      onChange={e => updateEditForm('visita', e.target.value as any)}
                    >
                      <option value="">Sin especificar</option>
                      <option value={Visita.DIA}>{Visita.DIA}</option>
                      <option value={Visita.NOCHE}>{Visita.NOCHE}</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Día de Visita</label>
                    <select
                      value={editForm.dia_visita || ''}
                      onChange={e => updateEditForm('dia_visita', e.target.value || undefined)}
                    >
                      <option value="">Sin especificar</option>
                      <option value={DiaVisita.LUNES}>{DiaVisita.LUNES}</option>
                      <option value={DiaVisita.MARTES}>{DiaVisita.MARTES}</option>
                      <option value={DiaVisita.MIERCOLES}>{DiaVisita.MIERCOLES}</option>
                      <option value={DiaVisita.JUEVES}>{DiaVisita.JUEVES}</option>
                      <option value={DiaVisita.VIERNES}>{DiaVisita.VIERNES}</option>
                      <option value={DiaVisita.SABADO}>{DiaVisita.SABADO}</option>
                      <option value={DiaVisita.DOMINGO}>{DiaVisita.DOMINGO}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ubicación y Contacto */}
              <div className="form-section">
                <h4 className="form-section-title">Ubicación y Contacto</h4>
                <div className="form-grid">
                  <div className="form-row full-width">
                    <label>Dirección *</label>
                    <input
                      value={editForm.direccion || ''}
                      onChange={e => updateEditForm('direccion', e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Ciudad</label>
                    <input
                      value={editForm.ciudad || ''}
                      onChange={e => updateEditForm('ciudad', e.target.value || undefined)}
                      maxLength={100}
                    />
                  </div>
                  <div className="form-row">
                    <label>Teléfono Principal</label>
                    <input
                      value={editForm.telefono || ''}
                      onChange={e => updateEditForm('telefono', e.target.value || undefined)}
                      maxLength={50}
                    />
                  </div>
                  <div className="form-row full-width">
                    <label>Coordenadas</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={editForm.coordenadas || ''}
                        onChange={e => updateEditForm('coordenadas', e.target.value || undefined)}
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
              </div>

              {/* Asignación */}
              <div className="form-section">
                <h4 className="form-section-title">Asignación</h4>
                <div className="form-row">
                  <label>Preventista * {errorField === 'preventista_id' && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginLeft: '8px' }}>⚠ Campo requerido</span>}</label>
                  <select
                    value={editForm.preventista_id || ''}
                    onChange={e => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      updateEditForm('preventista_id', value);
                    }}
                    required
                    style={errorField === 'preventista_id' ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                  >
                    <option value="">Seleccionar preventista</option>
                    {preventistas.map(prev => (
                      <option key={prev.collaborator_id} value={prev.collaborator_id}>
                        {prev.nombre} {prev.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teléfonos de Referencia */}
              <div className="form-section">
                <h4 className="form-section-title">Teléfonos de Referencia</h4>
                {telefonos.map((tel, idx) => (
                  <div key={idx} className="form-grid" style={{ marginBottom: '1rem', alignItems: 'end' }}>
                    <div className="form-row">
                      <label>Número</label>
                      <input
                        value={tel.numero}
                        onChange={e => {
                          const newTels = [...telefonos];
                          newTels[idx].numero = e.target.value;
                          setTelefonos(newTels);
                        }}
                        placeholder="Número de referencia"
                      />
                    </div>
                    <div className="form-row">
                      <label>Nombre Contacto</label>
                      <input
                        value={tel.nombre_contacto || ''}
                        onChange={e => {
                          const newTels = [...telefonos];
                          newTels[idx].nombre_contacto = e.target.value;
                          setTelefonos(newTels);
                        }}
                        placeholder="Nombre del contacto"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      onClick={() => setTelefonos(telefonos.filter((_, i) => i !== idx))}
                      style={{ marginBottom: '2px', height: '42px', width: '42px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setTelefonos([...telefonos, { numero: '' }])}
                >
                  <Plus size={16} /> Añadir teléfono
                </button>
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

      {showBulkDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¿Eliminar {selectedIds.size} cliente(s)?</h3>
            <p>Esta acción no se puede deshacer. Se eliminarán permanentemente los clientes seleccionados.</p>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setShowBulkDeleteModal(false)} disabled={bulkDeleting}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Eliminando...' : `Sí, eliminar ${selectedIds.size}`}
              </button>
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
