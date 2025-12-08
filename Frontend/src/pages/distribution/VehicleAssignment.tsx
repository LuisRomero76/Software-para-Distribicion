import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVehicleAssignments, useExcelExport } from './hooks';
import type { VehicleAssignmentFormData } from './types';
import {
  AssignmentsHeader,
  AssignmentsTableControls,
  AssignmentsTable,
  AssignmentDetailModal,
  AssignmentAddModal,
  AssignmentDeleteModal
} from './components';

export default function VehicleAssignmentPage() {
  const { auth } = useAuth();
  const { assignments, vehicles, collaborators, loading, error, loadData, addAssignment, updateAssignment, deleteAssignment } = useVehicleAssignments(auth?.token);
  const { exportAssignments } = useExcelExport();

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ vehicle_id: 0, collaborator_id: 0, fecha_inicio: '', fecha_fin: '', estado: 'activo' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ vehicle_id: 0, collaborator_id: 0, fecha_inicio: '', fecha_fin: '', estado: 'activo' });
  const [addingAssignment, setAddingAssignment] = useState(false);

  // Initialize
  useEffect(() => {
    document.title = 'Grupo Vicorsa | Asignaciones de Vehículos';
  }, []);

  useEffect(() => {
    loadData();
  }, [auth?.token]);

  // Filtered Data
  const filteredAssignments = assignments.filter(assignment => {
    const vehicleInfo = assignment.vehicle ? `${assignment.vehicle.placa} ${assignment.vehicle.marca}` : '';
    const collaboratorInfo = assignment.collaborator ? `${assignment.collaborator.nombre} ${assignment.collaborator.apellido}` : '';
    return vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaboratorInfo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Status Badge Class
  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'badge-success';
      case 'finalizado':
        return 'badge-secondary';
      case 'cancelado':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  // Handlers
  const handleEdit = (assignment: any) => {
    setSelectedAssignment(assignment);
    setEditForm({
      vehicle_id: assignment.vehicle_id,
      collaborator_id: assignment.collaborator_id,
      fecha_inicio: assignment.fecha_inicio,
      fecha_fin: assignment.fecha_fin,
      estado: assignment.estado
    });
    setEditMode(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!editForm.vehicle_id || editForm.vehicle_id === 0) {
      alert('Debes seleccionar un vehículo');
      return;
    }
    if (!editForm.collaborator_id || editForm.collaborator_id === 0) {
      alert('Debes seleccionar un colaborador');
      return;
    }
    if (new Date(editForm.fecha_fin) <= new Date(editForm.fecha_inicio)) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setSaving(true);
    try {
      await updateAssignment(selectedAssignment.assignment_id, editForm);
      // Recargar datos para sincronizar vehículo y colaborador
      await loadData();
      setSelectedAssignment(null);
      setEditMode(false);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo actualizar la asignación');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.vehicle_id || !newAssignment.collaborator_id || !newAssignment.fecha_inicio || !newAssignment.fecha_fin) {
      alert('Completa todos los campos requeridos');
      return;
    }

    if (new Date(newAssignment.fecha_fin) <= new Date(newAssignment.fecha_inicio)) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setAddingAssignment(true);
    try {
      await addAssignment(newAssignment as VehicleAssignmentFormData);
      // Recargar datos para sincronizar vehículo y colaborador
      await loadData();
      setNewAssignment({ vehicle_id: 0, collaborator_id: 0, fecha_inicio: '', fecha_fin: '', estado: 'activo' });
      setShowAddModal(false);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo agregar la asignación');
    } finally {
      setAddingAssignment(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAssignment(deleteTarget.assignment_id);
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo eliminar la asignación');
    } finally {
      setDeleting(false);
    }
  };


  // Render
  return (
    <div className="page-container">
      <AssignmentsHeader
        onExport={() => exportAssignments(assignments)}
        onRefresh={loadData}
        onAddNew={() => setShowAddModal(true)}
        assignmentsCount={assignments.length}
        isLoading={loading}
      />

      <div className="table-container">
        <AssignmentsTableControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredCount={filteredAssignments.length}
          totalCount={assignments.length}
        />

        <AssignmentsTable
          assignments={filteredAssignments}
          isLoading={loading}
          hasError={!!error}
          onView={assignment => { setSelectedAssignment(assignment); setEditMode(false); }}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      </div>

      {/* Modals */}
      <AssignmentDetailModal
        assignment={selectedAssignment}
        editMode={editMode}
        editForm={editForm}
        onEditFormChange={setEditForm}
        vehicles={vehicles}
        collaborators={collaborators}
        assignments={assignments}
        onClose={() => setSelectedAssignment(null)}
        onSave={handleSave}
        isSaving={saving}
      />

      <AssignmentAddModal
        isOpen={showAddModal}
        newAssignment={newAssignment}
        onAssignmentChange={setNewAssignment}
        vehicles={vehicles}
        collaborators={collaborators}
        assignments={assignments}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddAssignment}
        isLoading={addingAssignment}
      />

      <AssignmentDeleteModal
        assignment={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={deleting}
      />
    </div>
  );
}
