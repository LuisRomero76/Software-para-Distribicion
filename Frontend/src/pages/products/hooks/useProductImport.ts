import type { ProductImportRow } from '../utils/excelImporter';

export interface ProductCreatePayload {
  cod_barra?: string;
  nombre: string;
  descripcion?: string;
  tamaño?: string;
  precio_venta_sin_factura: string;
  precio_venta_con_factura?: string;
  precio_compra?: string;
  precio_compra_paquete?: string;
  precio_venta_paquete_sin_factura?: string;
  precio_venta_paquete_con_factura?: string;
  cant_por_paquete?: string;
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
      precio_venta_sin_factura: String(row.precio_venta_sin_factura || '0').trim(),
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
    if (row.precio_venta_con_factura && String(row.precio_venta_con_factura).trim() !== '') {
      payload.precio_venta_con_factura = String(row.precio_venta_con_factura).trim();
    }
    if (row.precio_compra && String(row.precio_compra).trim() !== '') {
      payload.precio_compra = String(row.precio_compra).trim();
    }
    if (row.precio_compra_paquete && String(row.precio_compra_paquete).trim() !== '') {
      payload.precio_compra_paquete = String(row.precio_compra_paquete).trim();
    }
    if (row.precio_venta_paquete_sin_factura && String(row.precio_venta_paquete_sin_factura).trim() !== '') {
      payload.precio_venta_paquete_sin_factura = String(row.precio_venta_paquete_sin_factura).trim();
    }
    if (row.precio_venta_paquete_con_factura && String(row.precio_venta_paquete_con_factura).trim() !== '') {
      payload.precio_venta_paquete_con_factura = String(row.precio_venta_paquete_con_factura).trim();
    }
    if (row.cant_por_paquete && String(row.cant_por_paquete).trim() !== '') {
      payload.cant_por_paquete = String(row.cant_por_paquete).trim();
    }

    return payload;
  };

  const validateRow = (row: ProductImportRow) => {
    const errors: string[] = [];

    // Validar nombre (obligatorio)
    if (!row.nombre || String(row.nombre).trim() === '') {
      errors.push('Nombre requerido');
    }

    // Validar precio_venta_sin_factura (obligatorio)
    if (!row.precio_venta_sin_factura || String(row.precio_venta_sin_factura).trim() === '') {
      errors.push('Precio Venta Sin Factura requerido');
    } else {
      const precio = parseFloat(String(row.precio_venta_sin_factura).replace(',', '.'));
      if (isNaN(precio) || precio < 0) {
        errors.push('Precio Venta Sin Factura inválido');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  return { mapRowToPayload, validateRow };
}
