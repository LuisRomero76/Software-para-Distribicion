import * as XLSX from 'xlsx';

export interface ClienteImportRow {
  sub_canal: string;
  visita?: string;
  nit_ci?: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  coordenadas?: string;
  telefono?: string;
  ruta?: string;
  dia_visita?: string;
  categoria?: string;
  [key: string]: any;
}

export interface SheetData {
  nombre: string;
  categoria?: string;
  datos: ClienteImportRow[];
}

export async function readExcelFile(file: File): Promise<SheetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<ClienteImportRow>(worksheet);
          
          // Convertir nit_ci a número si es string
          const processedData = jsonData.map(row => ({
            ...row,
            nit_ci: row.nit_ci ? (typeof row.nit_ci === 'string' ? parseInt(row.nit_ci, 10) : row.nit_ci) : undefined,
          }));
          
          return {
            nombre: sheetName,
            categoria: sheetName !== 'Clientes' ? sheetName : undefined,
            datos: processedData,
          };
        });
        
        resolve(sheets);
      } catch (error) {
        reject(new Error(`Error al leer el archivo Excel: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function generateExcelTemplate(): void {
  const wb = XLSX.utils.book_new();
  
  // Hoja 1: Clientes generales
  const clientesData = [
    {
      sub_canal: 'Canal 1',
      visita: 'Día',
      nit_ci: 12345678,
      nombre: 'Cliente Ejemplo 1',
      direccion: 'Calle Principal 123',
      ciudad: 'Bogotá',
      coordenadas: '4.7110,-74.0075',
      telefono: '3001234567',
      ruta: 'Ruta A',
      dia_visita: '2025-01-15',
    },
  ];
  const ws1 = XLSX.utils.json_to_sheet(clientesData);
  ws1['!cols'] = [
    { wch: 12 }, // sub_canal
    { wch: 10 }, // visita
    { wch: 12 }, // nit_ci
    { wch: 20 }, // nombre
    { wch: 25 }, // direccion
    { wch: 15 }, // ciudad
    { wch: 20 }, // coordenadas
    { wch: 15 }, // telefono
    { wch: 15 }, // ruta
    { wch: 15 }, // dia_visita
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Clientes');
  
  // Hoja 2: Clientes categoría A
  const clientesCatA = [
    {
      sub_canal: 'Canal 2',
      visita: 'Noche',
      nit_ci: 87654321,
      nombre: 'Cliente Categoría A',
      direccion: 'Avenida Secundaria 456',
      ciudad: 'Medellín',
      coordenadas: '6.2442,-75.5812',
      telefono: '3109876543',
      ruta: 'Ruta B',
      dia_visita: '2025-01-20',
    },
  ];
  const ws2 = XLSX.utils.json_to_sheet(clientesCatA);
  ws2['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Categoría_A');
  
  // Hoja 3: Instrucciones
  const instrucciones = [
    [
      'INSTRUCCIONES PARA IMPORTAR CLIENTES',
    ],
    [],
    [
      'Columnas requeridas:',
    ],
    [
      'sub_canal: Nombre del canal de distribución (Requerido)',
    ],
    [
      'nombre: Nombre del cliente (Requerido)',
    ],
    [
      'direccion: Dirección del cliente (Requerido)',
    ],
    [
      'nit_ci: NIT o Cédula del cliente (Opcional, solo números)',
    ],
    [
      'visita: Tipo de visita - Día o Noche (Opcional)',
    ],
    [
      'ciudad: Ciudad del cliente (Opcional)',
    ],
    [
      'coordenadas: Coordenadas GPS (Opcional)',
    ],
    [
      'telefono: Teléfono del cliente (Opcional)',
    ],
    [
      'ruta: Ruta asignada (Opcional)',
    ],
    [
      'dia_visita: Fecha de visita en formato YYYY-MM-DD (Opcional)',
    ],
    [],
    [
      'NOTAS:',
    ],
    [
      '- El nombre de cada hoja será tratado como una categoría (Ej: "Categoría_A" = Categoría A)',
    ],
    [
      '- Si la hoja se llama "Clientes", se importarán sin categoría específica',
    ],
    [
      '- No dejes filas vacías en el medio de los datos',
    ],
    [
      '- Todos los campos de fecha deben estar en formato YYYY-MM-DD',
    ],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(instrucciones);
  ws3['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Instrucciones');
  
  XLSX.writeFile(wb, 'Plantilla_Importar_Clientes.xlsx');
}
