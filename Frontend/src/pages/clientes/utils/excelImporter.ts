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
  dia_visita?: string;
  [key: string]: any;
}

export interface SheetData {
  nombre: string;
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
  
  // Plantilla de ejemplo con todos los campos
  const clientesData = [
    {
      sub_canal: 'Canal Ejemplo',
      visita: 'Día',
      dia_visita: 'Lunes',
      nit_ci: 12345678,
      nombre: 'Cliente Ejemplo 1',
      direccion: 'Calle Principal 123',
      ciudad: 'La Paz',
      coordenadas: '-16.5000,-68.1500',
      telefono: '70123456',
    },
    {
      sub_canal: 'Canal Demo',
      visita: 'Noche',
      dia_visita: 'Martes',
      nit_ci: 87654321,
      nombre: 'Cliente Ejemplo 2',
      direccion: 'Avenida Secundaria 456',
      ciudad: 'Santa Cruz',
      coordenadas: '-17.8145,-63.1560',
      telefono: '75987654',
    },
  ];
  
  const ws1 = XLSX.utils.json_to_sheet(clientesData);
  ws1['!cols'] = [
    { wch: 15 }, // sub_canal
    { wch: 10 }, // visita
    { wch: 15 }, // dia_visita
    { wch: 12 }, // nit_ci
    { wch: 25 }, // nombre
    { wch: 30 }, // direccion
    { wch: 15 }, // ciudad
    { wch: 20 }, // coordenadas
    { wch: 15 }, // telefono
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Clientes');
  
  XLSX.writeFile(wb, 'Plantilla_Importar_Clientes.xlsx');
}
