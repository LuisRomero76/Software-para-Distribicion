import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVehicles, useExcelExport } from './hooks';
import type { VehicleFormData } from './types';
import { useSorting } from '../../hooks/useSorting';
import {
  VehiclesHeader,
  VehiclesTableControls,
  VehiclesTable,
  VehicleDetailModal,
  VehicleAddModal,
  VehicleDeleteModal
} from './components';
import Pagination from '../../components/Pagination';

export default function Vehicles() {
  const { auth } = useAuth();
  const { vehicles, loading, error, loadVehicles, addVehicle, updateVehicle, deleteVehicle } = useVehicles(auth?.token);
  const { exportVehicles } = useExcelExport();

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ placa: '', marca: '', modelo: '', año: 0, capacidad_carga: 0, disponible: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ placa: '', marca: '', modelo: '', año: new Date().getFullYear(), capacidad_carga: 0, disponible: true });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Bulk select
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
    const pageIds = paginatedVehicles.map(v => v.vehicle_id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteVehicle(id);
      }
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } catch (e: any) {
      alert(e?.message ?? 'Error al eliminar vehículos');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Initialize
  useEffect(() => {
    document.title = 'Grupo Vicorsa | Vehículos';
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [auth?.token]);


  // Filtered Data
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const { sorted: sortedVehicles, sort: sortField, handleSort } = useSorting(filteredVehicles);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = sortedVehicles.slice(startIndex, startIndex + itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // Handlers
  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setEditMode(true);
    setEditForm({
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      año: vehicle.año,
      capacidad_carga: vehicle.capacidad_carga,
      disponible: vehicle.disponible
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setSaving(true);
    try {
      await updateVehicle(selectedVehicle.vehicle_id, editForm);
      setSelectedVehicle(null);
      setEditMode(false);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo actualizar el vehículo');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.placa || !newVehicle.marca || !newVehicle.modelo || !newVehicle.año) {
      alert('Completa todos los campos requeridos');
      return;
    }

    setAddingVehicle(true);
    try {
      await addVehicle(newVehicle as VehicleFormData);
      setNewVehicle({ placa: '', marca: '', modelo: '', año: new Date().getFullYear(), capacidad_carga: 0, disponible: true });
      setShowAddModal(false);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo agregar el vehículo');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVehicle(deleteTarget.vehicle_id);
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo eliminar el vehículo');
    } finally {
      setDeleting(false);
    }
  };


  // Render
  return (
    <div className="page-container">
      <VehiclesHeader
        onExport={() => exportVehicles(vehicles)}
        onRefresh={loadVehicles}
        onAddNew={() => setShowAddModal(true)}
        vehiclesCount={vehicles.length}
        isLoading={loading}
      />

      <div className="table-container">
        <VehiclesTableControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredCount={filteredVehicles.length}
          totalCount={vehicles.length}
        />

        {selectedIds.size > 0 && (
          <div style={{ padding: '8px 0 4px' }}>
            <button
              className="btn-bulk-delete"
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={bulkDeleting}
            >
              Eliminar seleccionados ({selectedIds.size})
            </button>
          </div>
        )}
        <VehiclesTable
          vehicles={paginatedVehicles}
          isLoading={loading}
          hasError={!!error}
          onView={vehicle => { setSelectedVehicle(vehicle); setEditMode(false); }}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          selectedIds={selectedIds}
          onToggle={toggleSelect}
          onToggleAll={toggleSelectAll}
          allSelected={paginatedVehicles.length > 0 && paginatedVehicles.every(v => selectedIds.has(v.vehicle_id))}
          sort={sortField}
          onSort={handleSort}
        />
        <Pagination
          currentPage={currentPage}
          totalItems={filteredVehicles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Eliminar vehículos</h2>
            <p>¿Estás seguro de que deseas eliminar <strong>{selectedIds.size}</strong> vehículo(s)? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowBulkDeleteModal(false)} disabled={bulkDeleting}>Cancelar</button>
              <button className="btn-danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        editMode={editMode}
        editForm={editForm}
        onEditFormChange={setEditForm}
        onClose={() => setSelectedVehicle(null)}
        onSave={handleSave}
        isSaving={saving}
      />

      <VehicleAddModal
        isOpen={showAddModal}
        newVehicle={newVehicle}
        onVehicleChange={setNewVehicle}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVehicle}
        isLoading={addingVehicle}
      />

      <VehicleDeleteModal
        vehicle={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={deleting}
      />
    </div>
  );
}
