import * as XLSX from 'xlsx';
import type { Ruta } from '../types';

export const useExcelExport = () => {
  const exportRutas = (rutas: Ruta[]) => {
    const dataToExport = rutas.map(ruta => ({
      'ID': ruta.ruta_id,
      'Cliente': ruta.cliente ? ruta.cliente.nombre : '-',
      'Dirección': ruta.cliente ? ruta.cliente.direccion : '-',
      'Colaborador': ruta.colaborador ? `${ruta.colaborador.nombre} ${ruta.colaborador.apellido}` : '-',
      'Día de Visita': new Date(ruta.dia_visita).toLocaleDateString('es-ES'),
      'Estado': ruta.estado,
      'Observaciones': ruta.observaciones || '-',
      'Fecha de Creación': new Date(ruta.createdAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rutas');

    const columnWidths = [
      { wch: 8 },   // ID
      { wch: 25 },  // Cliente
      { wch: 30 },  // Dirección
      { wch: 25 },  // Colaborador
      { wch: 15 },  // Día de Visita
      { wch: 15 },  // Estado
      { wch: 30 },  // Observaciones
      { wch: 20 }   // Fecha de Creación
    ];
    worksheet['!cols'] = columnWidths;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `rutas_${year}-${month}-${day}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return { exportRutas };
};
