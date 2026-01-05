import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRutas, useExcelExport } from './hooks';
import {
  RutasHeader,
  RutasTableControls,
  RutasTable,
  RutaAddModal,
  RutaDetailModal,
  RutaDeleteModal
} from './components';
import Pagination from '../../components/Pagination';
import type { EstadoRuta, Ruta, RutaFormData } from './types';
import '../../styles/page.css';

export default function Rutas() {
  const { auth } = useAuth();
  const { rutas, clientes, colaboradores, loading, error, loadData, addRuta, updateRuta, deleteRuta } = useRutas(auth?.token);
  const { exportRutas } = useExcelExport();

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ruta | null>(null);
  const [editForm, setEditForm] = useState<Partial<RutaFormData>>({
    cliente_id: 0,
    collaborator_id: 0,
    dia_visita: '',
    estado: 'pendiente',
    observaciones: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuta, setNewRuta] = useState<Partial<RutaFormData>>({
    cliente_id: 0,
    collaborator_id: 0,
    dia_visita: '',
    estado: 'pendiente',
    observaciones: ''
  });
  const [addingRuta, setAddingRuta] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Initialize
  useEffect(() => {
    document.title = 'Grupo Vicorsa | Asignación de Rutas';
  }, []);

  useEffect(() => {
    loadData();
  }, [auth?.token]);

  // Filtered Data
  const filteredRutas = rutas.filter(ruta => {
    const clienteInfo = ruta.cliente ? `${ruta.cliente.nombre} ${ruta.cliente.direccion}` : '';
    const colaboradorInfo = ruta.colaborador ? `${ruta.colaborador.nombre} ${ruta.colaborador.apellido}` : '';
    return (
      clienteInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaboradorInfo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRutas.length);
  const paginatedRutas = filteredRutas.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Status Badge Class
  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'badge-warning';
      case 'en_progreso':
        return 'badge-info';
      case 'completada':
        return 'badge-success';
      case 'cancelada':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  // Handlers
  const handleEdit = (ruta: Ruta) => {
    setSelectedRuta(ruta);
    setEditMode(true);
    setEditForm({
      cliente_id: ruta.cliente_id,
      collaborator_id: ruta.collaborator_id,
      dia_visita: ruta.dia_visita,
      estado: ruta.estado,
      observaciones: ruta.observaciones || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuta) return;

    setSaving(true);
    try {
      await updateRuta(selectedRuta.ruta_id, editForm);
      setSelectedRuta(null);
      setEditMode(false);
      setEditForm({
        cliente_id: 0,
        collaborator_id: 0,
        dia_visita: '',
        estado: 'pendiente' as EstadoRuta,
        observaciones: ''
      });
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la ruta');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRuta.cliente_id || !newRuta.collaborator_id || !newRuta.dia_visita) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    setAddingRuta(true);
    try {
      await addRuta(newRuta as RutaFormData);
      setShowAddModal(false);
      setNewRuta({
        cliente_id: 0,
        collaborator_id: 0,
        dia_visita: '',
        estado: 'pendiente' as EstadoRuta,
        observaciones: ''
      });
    } catch (err: any) {
      alert(err.message || 'Error al crear la ruta');
    } finally {
      setAddingRuta(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteRuta(deleteTarget.ruta_id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la ruta');
    } finally {
      setDeleting(false);
    }
  };

  // Render
  return (
    <div className="page-container">
      <RutasHeader
        onExport={() => exportRutas(rutas)}
        onRefresh={loadData}
        onAddNew={() => setShowAddModal(true)}
        rutasCount={rutas.length}
        isLoading={loading}
      />

      <div className="table-container">
        <RutasTableControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredCount={filteredRutas.length}
          totalCount={rutas.length}
        />

        <RutasTable
          rutas={paginatedRutas}
          isLoading={loading}
          hasError={!!error}
          onView={ruta => { setSelectedRuta(ruta); setEditMode(false); }}
          onEdit={handleEdit}
          onDelete={ruta => setDeleteTarget(ruta)}
          getStatusBadgeClass={getStatusBadgeClass}
        />

        {filteredRutas.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRutas.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <RutaAddModal
        isOpen={showAddModal}
        newRuta={newRuta}
        onRutaChange={setNewRuta}
        clientes={clientes}
        colaboradores={colaboradores}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddRuta}
        isLoading={addingRuta}
      />

      {selectedRuta && (
        <RutaDetailModal
          ruta={selectedRuta}
          editMode={editMode}
          editForm={editForm}
          onEditFormChange={setEditForm}
          clientes={clientes}
          colaboradores={colaboradores}
          onClose={() => { setSelectedRuta(null); setEditMode(false); }}
          onSave={handleSave}
          isSaving={saving}
        />
      )}

      <RutaDeleteModal
        ruta={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={deleting}
      />
    </div>
  );
}
