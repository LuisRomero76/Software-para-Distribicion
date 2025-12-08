import * as XLSX from 'xlsx';
import type { Vehicle } from '../types';

export const useExcelExport = () => {
  const exportVehicles = (vehicles: Vehicle[]) => {
    const dataToExport = vehicles.map(vehicle => ({
      'ID': vehicle.vehicle_id,
      'Placa': vehicle.placa,
      'Marca': vehicle.marca,
      'Modelo': vehicle.modelo,
      'Año': vehicle.año,
      'Capacidad de Carga': vehicle.capacidad_carga,
      'Disponible': vehicle.disponible ? 'Sí' : 'No',
      'Fecha de Creación': new Date(vehicle.createdAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehículos');

    const columnWidths = [
      { wch: 8 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 8 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `vehiculos_${year}-${month}-${day}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportAssignments = (assignments: any[]) => {
    const dataToExport = assignments.map(assignment => ({
      'ID': assignment.assignment_id,
      'Vehículo': assignment.vehicle ? `${assignment.vehicle.placa} - ${assignment.vehicle.marca} ${assignment.vehicle.modelo}` : '',
      'Colaborador': assignment.collaborator ? `${assignment.collaborator.nombre} ${assignment.collaborator.apellido}` : '',
      'Fecha Inicio': assignment.fecha_inicio,
      'Fecha Fin': assignment.fecha_fin,
      'Estado': assignment.estado,
      'Fecha de Creación': new Date(assignment.createdAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');

    const columnWidths = [
      { wch: 8 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `asignaciones_${year}-${month}-${day}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return { exportVehicles, exportAssignments };
};
