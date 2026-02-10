import * as XLSX from 'xlsx';

export interface ProductImportRow {
  cod_barra?: string;
  nombre?: string;
  descripcion?: string;
  tamaño?: string;
  precio_venta_sin_factura?: string | number;
  precio_venta_con_factura?: string | number;
  precio_compra?: string | number;
  precio_compra_paquete?: string | number;
  precio_venta_paquete_sin_factura?: string | number;
  precio_venta_paquete_con_factura?: string | number;
  cant_por_paquete?: string | number;
  // Subcategoría se maneja por fila en la UI, no viene del Excel
  _subcategory_id?: number; // Campo interno para la UI
}

export interface SheetData {
  nombre: string;
  datos: ProductImportRow[];
}

/**
 * Redondea un número a 2 decimales.
 * Maneja tanto strings como números, y valores vacíos.
 */
function roundToTwoDecimals(value: any): string | number {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '';
  }
  
  // Redondear a 2 decimales
  return Math.round(num * 100) / 100;
}

export async function readProductExcelFile(file: File): Promise<SheetData[]> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  const sheets: SheetData[] = wb.SheetNames.map((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];

    // Normalizar encabezados esperados si existen
    // Acepta tanto nombres exactos de plantilla como claves ya normalizadas
    const normalizeRow = (r: any): ProductImportRow => ({
      cod_barra: r['Código de Barras'] ?? r['cod_barra'] ?? r['codigo_barras'] ?? '',
      nombre: r['Nombre'] ?? r['nombre'] ?? '',
      descripcion: r['Descripción'] ?? r['descripcion'] ?? r['descripción'] ?? '',
      tamaño: r['Tamaño'] ?? r['tamaño'] ?? r['tamano'] ?? '',
      // Redondear todos los campos numéricos a 2 decimales
      precio_venta_sin_factura: roundToTwoDecimals(r['Precio Venta Sin Factura'] ?? r['precio_venta_sin_factura'] ?? r['Precio Venta'] ?? r['precio'] ?? ''),
      precio_venta_con_factura: roundToTwoDecimals(r['Precio Venta Con Factura'] ?? r['precio_venta_con_factura'] ?? ''),
      precio_compra: roundToTwoDecimals(r['Precio Compra'] ?? r['precio_compra'] ?? ''),
      precio_compra_paquete: roundToTwoDecimals(r['Precio Compra Paquete'] ?? r['precio_compra_paquete'] ?? ''),
      precio_venta_paquete_sin_factura: roundToTwoDecimals(r['Precio Venta Paquete Sin Factura'] ?? r['precio_venta_paquete_sin_factura'] ?? r['Precio Venta Paquete'] ?? r['precio_venta_paquete'] ?? ''),
      precio_venta_paquete_con_factura: roundToTwoDecimals(r['Precio Venta Paquete Con Factura'] ?? r['precio_venta_paquete_con_factura'] ?? ''),
      cant_por_paquete: roundToTwoDecimals(r['Cant. por Paquete'] ?? r['cant_por_paquete'] ?? ''),
    });

    return {
      nombre: sheetName,
      datos: rows.map(normalizeRow),
    };
  });

  return sheets;
}

export function generateProductTemplate(): void {
  const wb = XLSX.utils.book_new();

  const productos = [
    {
      'Código de Barras': '7772107000308',
      'Nombre': 'Vino Tinto Varietales Premium',
      'Descripción': 'Vino tinto premium de la línea varietales',
      'Tamaño': '750ml',
      'Precio Venta Sin Factura': '150.50',
      'Precio Venta Con Factura': '165.00',
      'Precio Compra': '100.00',
      'Precio Compra Paquete': '570.00',
      'Precio Venta Paquete Sin Factura': '870.00',
      'Precio Venta Paquete Con Factura': '955.00',
      'Cant. por Paquete': '6',
    },
    {
      'Código de Barras': '7772107000315',
      'Nombre': 'Vino Tinto Reserva',
      'Descripción': 'Vino tinto reserva de excelente calidad',
      'Tamaño': '750ml',
      'Precio Venta Sin Factura': '220.00',
      'Precio Venta Con Factura': '240.00',
      'Precio Compra': '150.00',
      'Precio Compra Paquete': '850.00',
      'Precio Venta Paquete Sin Factura': '1250.00',
      'Precio Venta Paquete Con Factura': '1370.00',
      'Cant. por Paquete': '6',
    },
    {
      'Código de Barras': '7772107000322',
      'Nombre': 'Vino Tinto Clásico',
      'Descripción': 'Vino tinto clásico de la casa',
      'Tamaño': '750ml',
      'Precio Venta Sin Factura': '120.00',
      'Precio Venta Con Factura': '130.00',
      'Precio Compra': '80.00',
      'Precio Compra Paquete': '450.00',
      'Precio Venta Paquete Sin Factura': '650.00',
      'Precio Venta Paquete Con Factura': '715.00',
      'Cant. por Paquete': '6',
    }
  ];

  const ws = XLSX.utils.json_to_sheet(productos);
  ws['!cols'] = [
    { wch: 20 },    // Código de Barras
    { wch: 35 },    // Nombre
    { wch: 45 },    // Descripción
    { wch: 15 },    // Tamaño
    { wch: 25 },    // Precio Venta Sin Factura
    { wch: 25 },    // Precio Venta Con Factura
    { wch: 18 },    // Precio Compra
    { wch: 22 },    // Precio Compra Paquete
    { wch: 30 },    // Precio Venta Paquete Sin Factura
    { wch: 30 },    // Precio Venta Paquete Con Factura
    { wch: 18 },    // Cant. por Paquete
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla_productos.xlsx');
}
