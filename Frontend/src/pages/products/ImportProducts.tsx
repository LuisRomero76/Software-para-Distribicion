import { useEffect, useState } from 'react';
import { request } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProductParsed {
  cod_barra: string;
  nombre: string;
  descripcion: string;
  tamaño: string;
  precio_unitario: number;
  fecha_vencimiento: string;
  category_id: number;
  sub_category_id: number;
  unidades_caja?: number;
  precio_unidad_envio?: number;
  precio_caja_envio?: number;
  flete?: number;
}

export default function ImportProducts() {
  const { auth } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ProductParsed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Importar Productos';
  }, []);

  const downloadTemplate = () => {
    const template = [
      {
        'Código de Barras': '7772107000308',
        'Nombre': 'Vino Tinto',
        'Descripción': 'Vino tinto premium',
        'Tamaño': '750ml',
        'Precio Unitario': 12.99,
        'Fecha Vencimiento': '2025-12-31',
        'ID Categoría': 1,
        'ID Subcategoría': 5,
        'Unidades Caja': 6,
        'Precio Unidad Envío': 432,
        'Precio Caja Envío': 2052,
        'Flete': 5
      },
      {
        'Código de Barras': '7772107000309',
        'Nombre': 'Vino Blanco',
        'Descripción': 'Vino blanco seco',
        'Tamaño': '750ml',
        'Precio Unitario': 10.50,
        'Fecha Vencimiento': '2025-12-31',
        'ID Categoría': 1,
        'ID Subcategoría': 5,
        'Unidades Caja': 6,
        'Precio Unidad Envío': 432,
        'Precio Caja Envío': 2052,
        'Flete': 5
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    const columnWidths = [
      { wch: 18 }, { wch: 20 }, { wch: 30 }, { wch: 12 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 18 },
      { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 10 }
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, 'plantilla_productos.xlsx');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    setImportErrors([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[];

      if (jsonData.length < 2) {
        setError('El archivo debe contener al menos una fila de datos.');
        setProducts([]);
        return;
      }

      const headers = jsonData[0];
      const expectedHeaders = [
        'Código de Barras', 'Nombre', 'Descripción', 'Tamaño',
        'Precio Unitario', 'Fecha Vencimiento', 'ID Categoría', 'ID Subcategoría',
        'Unidades Caja', 'Precio Unidad Envío', 'Precio Caja Envío', 'Flete'
      ];

      const headersMatch = expectedHeaders.every((h, i) => headers[i] === h);
      if (!headersMatch) {
        setError('El formato del archivo no es correcto. Descarga la plantilla para ver el formato esperado.');
        setProducts([]);
        return;
      }

      const parsedProducts: ProductParsed[] = [];
      const errors: string[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        if (!row[0] || !row[1] || !row[2] || !row[3] || !row[4] || !row[5] || !row[6] || !row[7]) {
          errors.push(`Fila ${i + 1}: Campos obligatorios vacíos`);
          continue;
        }

        const product: ProductParsed = {
          cod_barra: String(row[0]),
          nombre: String(row[1]),
          descripcion: String(row[2]),
          tamaño: String(row[3]),
          precio_unitario: parseFloat(row[4]),
          fecha_vencimiento: row[5],
          category_id: parseInt(row[6]),
          sub_category_id: parseInt(row[7])
        };

        if (row[8] && row[9] && row[10] && row[11]) {
          product.unidades_caja = parseInt(row[8]);
          product.precio_unidad_envio = parseFloat(row[9]);
          product.precio_caja_envio = parseFloat(row[10]);
          product.flete = parseFloat(row[11]);
        }

        parsedProducts.push(product);
      }

      if (errors.length > 0) {
        setImportErrors(errors);
      }

      setProducts(parsedProducts);
    } catch (err) {
      setError('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
      setProducts([]);
    }
  };

  const handleImport = async () => {
    if (products.length === 0) {
      setError('No hay productos para importar.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportErrors([]);

    try {
      const payload = {
        products: products.map(p => {
          const item: any = {
            cod_barra: p.cod_barra,
            nombre: p.nombre,
            descripcion: p.descripcion,
            tamaño: p.tamaño,
            precio_unitario: p.precio_unitario,
            fecha_vencimiento: p.fecha_vencimiento,
            category_id: p.category_id,
            sub_category_id: p.sub_category_id
          };

          if (p.unidades_caja) {
            item.shipping = {
              unidades_caja: p.unidades_caja,
              precio_unidad_envio: p.precio_unidad_envio,
              precio_caja_envio: p.precio_caja_envio,
              flete: p.flete
            };
          }

          return item;
        })
      };

      const result = await request<any>('/product/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, auth?.token);

      if (result.failed > 0) {
        setImportErrors(result.errors || []);
        setSuccess(`Se importaron ${result.success} productos. ${result.failed} fallaron.`);
      } else {
        setSuccess(`Se importaron ${result.success} productos correctamente.`);
      }

      setFile(null);
      setProducts([]);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err?.message ?? 'Error al importar productos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Upload size={28} /> Importar Productos</h2>
          <p className="page-subtitle">Carga masiva de productos desde archivo Excel</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-export" onClick={downloadTemplate} title="Descargar plantilla">
            <Download size={18} /> Descargar Plantilla
          </button>
        </div>
      </div>

      <div className="form-container">
        <div className="admin-form">
          <div className="info-box" style={{ marginBottom: '20px' }}>
            <FileSpreadsheet size={20} />
            <div>
              <strong>Formato del archivo Excel:</strong>
              <p style={{ marginTop: '5px', fontSize: '0.9em' }}>
                El archivo debe contener las siguientes columnas en este orden:
                Código de Barras, Nombre, Descripción, Tamaño, Precio Unitario, Fecha Vencimiento,
                ID Categoría, ID Subcategoría, Unidades Caja, Precio Unidad Envío, Precio Caja Envío, Flete.
              </p>
              <p style={{ marginTop: '5px', fontSize: '0.9em' }}>
                Las últimas 4 columnas (información de envío) son opcionales.
              </p>
            </div>
          </div>

          <label className="form-field">
            <span className="label-text">Seleccionar archivo Excel *</span>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="form-input"
              onChange={handleFileSelect}
            />
          </label>

          {products.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Vista previa ({products.length} productos)</h4>
              <div className="table-wrapper" style={{ maxHeight: '400px', overflow: 'auto', marginTop: '10px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Tamaño</th>
                      <th>Precio</th>
                      <th>Categoría ID</th>
                      <th>Subcategoría ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 10).map((product, index) => (
                      <tr key={index}>
                        <td>{product.cod_barra}</td>
                        <td>{product.nombre}</td>
                        <td>{product.tamaño}</td>
                        <td>S/ {product.precio_unitario.toFixed(2)}</td>
                        <td>{product.category_id}</td>
                        <td>{product.sub_category_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length > 10 && (
                  <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
                    ... y {products.length - 10} productos más
                  </p>
                )}
              </div>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="alert alert-error" style={{ marginTop: '20px' }}>
              <AlertCircle size={18} />
              <div>
                <strong>Errores encontrados:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  {importErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {importErrors.length > 5 && (
                    <li>... y {importErrors.length - 5} errores más</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginTop: '20px' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginTop: '20px' }}>
              <CheckCircle size={18} /> {success}
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn"
              onClick={handleImport}
              disabled={loading || products.length === 0}
            >
              {loading ? 'Importando...' : `Importar ${products.length} productos`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
