import type { ProductImportRow } from '../utils/excelImporter';

export interface ProductCreatePayload {
  cod_barra?: string;
  nombre: string;
  descripcion?: string;
  tamaño?: string;
  category_id: number;
  sub_category_id?: number;
}

export function useProductImport() {
  const mapRowToPayload = (
    row: ProductImportRow,
    categoryId: number,
    subCategoryId?: number
  ): ProductCreatePayload => {
    const payload: ProductCreatePayload = {
      nombre: String(row.nombre || '').trim(),
      category_id: categoryId,
    };

    // Solo incluir sub_category_id si se proporciona
    if (subCategoryId) {
      payload.sub_category_id = subCategoryId;
    }

    // Solo incluir campos opcionales si tienen valor
    if (row.cod_barra && String(row.cod_barra).trim() !== '') {
      payload.cod_barra = String(row.cod_barra).trim();
    }
    if (row.descripcion && String(row.descripcion).trim() !== '') {
      payload.descripcion = String(row.descripcion).trim();
    }
    if (row.tamaño && String(row.tamaño).trim() !== '') {
      payload.tamaño = String(row.tamaño).trim();
    }

    return payload;
  };

  const validateRow = (row: ProductImportRow) => {
    const errors: string[] = [];

    // Solo el nombre es obligatorio
    if (!row.nombre || String(row.nombre).trim() === '') {
      errors.push('Nombre requerido');
    }

    return { valid: errors.length === 0, errors };
  };

  return { mapRowToPayload, validateRow };
}
