import * as XLSX from 'xlsx';

export interface ProductImportRow {
  cod_barra?: string;
  nombre?: string;
  descripcion?: string;
  tamaño?: string;
}

export interface SheetData {
  nombre: string;
  datos: ProductImportRow[];
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
      'Nombre': 'Vino Tinto',
      'Descripción': 'Vino tinto premium',
      'Tamaño': '750ml',
    }
  ];

  const ws = XLSX.utils.json_to_sheet(productos);
  ws['!cols'] = [
    { wch: 20 }, // Código de Barras
    { wch: 30 }, // Nombre
    { wch: 40 }, // Descripción
    { wch: 15 }, // Tamaño
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla_productos.xlsx');
}
