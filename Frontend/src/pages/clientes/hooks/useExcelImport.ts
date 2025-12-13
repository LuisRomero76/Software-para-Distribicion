import { useCategoriasClientes } from './useCategoriasClientes';
import type { ClienteImportRow } from '../utils/excelImporter';
import type { CreateClientePayload } from './useClientes';

export function useExcelImport() {
  const { categorias } = useCategoriasClientes();

  const mapRowToPayload = (row: ClienteImportRow, categoriaName?: string, categoriaIds?: number[]): CreateClientePayload => {
    // Encontrar categoría por nombre (si viene del nombre de la hoja)
    let cliente_categoria_ids: number[] = [];
    
    if (categoriaIds && categoriaIds.length > 0) {
      // Si se proporciona un array de IDs (desde selector), usar esos
      cliente_categoria_ids = categoriaIds;
    } else if (categoriaName) {
      // Si viene de nombre de hoja, buscar por nombre
      const cat = categorias.find(c => 
        c.nombre.toLowerCase().replace(/\s+/g, '_') === categoriaName.toLowerCase().replace(/\s+/g, '_')
      );
      if (cat) {
        cliente_categoria_ids = [cat.cliente_categoria_id];
      }
    }

    // Construir payload limpio - solo incluir campos con valores
    const payload: any = {
      sub_canal: row.sub_canal || '',
      nombre: row.nombre || '',
      direccion: row.direccion || '',
      cliente_categoria_ids,
    };

    // Solo agregar campos opcionales si tienen valor
    if (row.visita && typeof row.visita === 'string' && row.visita.trim() !== '') {
      const visitaValue = row.visita.trim();
      // Solo agregar si es un valor válido
      if (visitaValue === 'Día' || visitaValue === 'Noche') {
        payload.visita = visitaValue;
      }
    }
    if (row.nit_ci !== undefined && row.nit_ci !== null && !isNaN(Number(row.nit_ci))) {
      payload.nit_ci = Number(row.nit_ci);
    }
    if (row.ciudad && typeof row.ciudad === 'string' && row.ciudad.trim() !== '') {
      payload.ciudad = row.ciudad.trim();
    }
    if (row.coordenadas && typeof row.coordenadas === 'string' && row.coordenadas.trim() !== '') {
      payload.coordenadas = row.coordenadas.trim();
    }
    if (row.telefono && row.telefono.toString().trim() !== '') {
      payload.telefono = row.telefono.toString().trim();
    }
    if (row.ruta && typeof row.ruta === 'string' && row.ruta.trim() !== '') {
      payload.ruta = row.ruta.trim();
    }
    if (row.dia_visita && row.dia_visita.toString().trim() !== '') {
      payload.dia_visita = row.dia_visita.toString().trim();
    }

    return payload as CreateClientePayload;
  };

  const validateRow = (row: ClienteImportRow): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!row.sub_canal?.toString().trim()) errors.push('Sub Canal requerido');
    if (!row.nombre?.toString().trim()) errors.push('Nombre requerido');
    if (!row.direccion?.toString().trim()) errors.push('Dirección requerida');

    if (row.nit_ci && isNaN(Number(row.nit_ci))) errors.push('NIT/CI debe ser un número');
    if (row.dia_visita) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.dia_visita)) errors.push('Fecha debe estar en formato YYYY-MM-DD');
    }

    return { valid: errors.length === 0, errors };
  };

  return { mapRowToPayload, validateRow };
}
