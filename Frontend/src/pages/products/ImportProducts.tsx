import { useEffect, useRef, useState } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../lib/http';
import { readProductExcelFile, generateProductTemplate, type SheetData, type ProductImportRow } from './utils/excelImporter';
import { useProductImport } from './hooks/useProductImport';
import '../clientes/ImportarClientes.css';

export default function ImportProducts() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { auth } = useAuth();

  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [editedData, setEditedData] = useState<ProductImportRow[]>([]);
  const [rowValidation, setRowValidation] = useState<{ [key: number]: { valid: boolean; errors: string[] } }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | ''>('');

  const { mapRowToPayload, validateRow } = useProductImport();

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Importar Productos';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, subs] = await Promise.all([
          request<any[]>('/category', {}, auth?.token),
          request<any[]>('/sub-category', {}, auth?.token),
        ]);
        setCategories(cats);
        setSubCategories(subs);
      } catch (e) {
        console.error('No se pudo cargar categorías/subcategorías', e);
      }
    };
    load();
  }, [auth?.token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      const data = await readProductExcelFile(file);
      setSheets(data);
      setSelectedSheetIndex(0);

      const firstSheet = data[0];
      const validation: { [key: number]: { valid: boolean; errors: string[] } } = {};
      firstSheet.datos.forEach((row, idx) => {
        validation[idx] = validateRow(row);
      });
      setRowValidation(validation);
      setEditedData([...firstSheet.datos]);
    } catch (err: any) {
      setError(err.message || 'Error al leer el archivo');
    } finally {
      setLoading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSheetChange = (index: number) => {
    setSelectedSheetIndex(index);
    const sheet = sheets[index];
    const validation: { [key: number]: { valid: boolean; errors: string[] } } = {};
    sheet.datos.forEach((row, idx) => {
      validation[idx] = validateRow(row);
    });
    setRowValidation(validation);
    setEditedData([...sheet.datos]);
    setSuccess(null);
    setError(null);
  };

  const handleCellChange = (rowIdx: number, field: keyof ProductImportRow, value: any) => {
    const updated = [...editedData];
    updated[rowIdx] = { ...updated[rowIdx], [field]: value === '' ? undefined : value };
    setEditedData(updated);
    const validation = validateRow(updated[rowIdx]);
    setRowValidation(prev => ({ ...prev, [rowIdx]: validation }));
  };

  const handleImport = async () => {
    if (!selectedCategoryId) {
      setError('Selecciona una categoría para los productos');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let ok = 0;
      let fail = 0;
      const errors: string[] = [];

      for (let i = 0; i < editedData.length; i++) {
        const validation = rowValidation[i];
        if (!validation?.valid) {
          fail++;
          continue;
        }

        const payload = mapRowToPayload(
          editedData[i],
          Number(selectedCategoryId),
          selectedSubCategoryId ? Number(selectedSubCategoryId) : undefined
        );

        try {
          await request('/product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }, auth?.token);
          ok++;
        } catch (err: any) {
          console.error('Error importando producto fila', i + 1, err);
          errors.push(`Fila ${i + 1}: ${err.message || 'Error desconocido'}`);
          fail++;
        }
      }

      if (ok > 0) {
        let msg = `✓ ${ok} producto${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''} correctamente`;
        if (fail > 0) {
          msg += ` (${fail} con error${fail !== 1 ? 's' : ''})`;
        }
        msg += '.';
        setSuccess(msg);
        // Limpiar tabla después de importación exitosa
        setTimeout(() => setSheets([]), 2000);
      }
      if (ok === 0 && fail > 0) {
        setError(`✗ No se pudo importar ningún producto. ${fail} fila${fail !== 1 ? 's' : ''} con error${fail !== 1 ? 's' : ''}.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al importar productos');
    } finally {
      setLoading(false);
    }
  };

  const validRowsCount = Object.values(rowValidation).filter(v => v.valid).length;
  const totalRows = editedData.length;

  return (
    <div className="import-page">
      <div className="import-header">
        <h1>Importar Productos</h1>
        <p>Carga productos desde un archivo Excel con vista previa y validación</p>
      </div>

      {sheets.length === 0 ? (
        <>
          <div className="upload-section">
            <div className="upload-zone">
              <div className="upload-zone-icon">
                <Upload size={36} />
              </div>
              <div>
                <div className="upload-zone-title">Selecciona un archivo Excel</div>
                <div className="upload-zone-subtitle">Arrastra o haz clic para cargar</div>
              </div>
              <div className="upload-buttons">
                <button
                  className="btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload size={18} /> Cargar Archivo
                </button>
                <button className="btn-template" onClick={generateProductTemplate}>
                  <Download size={18} /> Descargar Plantilla
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="excel-file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="instructions-section">
            <h3 className="instructions-title">📋 Cómo funciona</h3>
            <div className="instructions-content">
              <div className="instruction-item">
                <div className="instruction-icon">1</div>
                <div className="instruction-text">
                  <p>Descarga la plantilla Excel</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Usa el botón "Descargar Plantilla"</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">2</div>
                <div className="instruction-text">
                  <p>Completa los datos en Excel</p>
                  <ul>
                    <li><b>Obligatorio:</b> Nombre</li>
                    <li><b>Opcionales:</b> Código de barras, Descripción, Tamaño</li>
                  </ul>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">3</div>
                <div className="instruction-text">
                  <p>Carga el archivo aquí</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Detectamos automáticamente las hojas</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">4</div>
                <div className="instruction-text">
                  <p>Selecciona categoría (subcategoría opcional)</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Se aplican a todos los productos</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">5</div>
                <div className="instruction-text">
                  <p>Revisa, edita e importa</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Solo se importan filas válidas</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Mensajes de éxito y error */}
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-state">{error}</div>}

          {/* Selector de hojas si hay varias */}
          {sheets.length > 1 && (
            <div className="sheets-selector">
              <div className="sheets-tabs">
                {sheets.map((s, idx) => (
                  <button key={idx} className={`sheet-tab ${idx === selectedSheetIndex ? 'active' : ''}`} onClick={() => handleSheetChange(idx)}>
                    <FileText size={16} style={{ display: 'inline' }} /> {s.nombre}
                    <span className="sheet-badge">{s.datos.length} filas</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="preview-section">
            <h3 className="preview-title">
              Vista previa de datos
              {validRowsCount < totalRows && (
                <span style={{ fontSize: '.9rem', opacity: .7, marginLeft: '1rem' }}>({validRowsCount}/{totalRows} filas válidas)</span>
              )}
            </h3>

            {/* Selectores globales */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Categoría *</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      const catId = e.target.value ? Number(e.target.value) : '';
                      setSelectedCategoryId(catId);
                      setSelectedSubCategoryId(''); // Limpiar subcategoría al cambiar categoría
                    }}
                    style={{ width: '100%', padding: '.6rem .75rem', background: 'var(--card)', color: 'var(--text)', border: `1px solid ${selectedCategoryId ? '#10b981' : 'var(--border)'}`, borderRadius: 8 }}
                  >
                    <option value="">-- Selecciona --</option>
                    {categories.map((c: any) => (
                      <option key={c.category_id} value={c.category_id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>
                    Subcategoría
                    {subCategories.filter((s: any) => s.category_id === selectedCategoryId).length === 0 && selectedCategoryId ? '' : ' (Opcional)'}
                  </label>
                  {subCategories.filter((s: any) => s.category_id === selectedCategoryId).length > 0 && selectedCategoryId ? (
                    <select
                      value={selectedSubCategoryId}
                      onChange={(e) => setSelectedSubCategoryId(e.target.value ? Number(e.target.value) : '')}
                      style={{ width: '100%', padding: '.6rem .75rem', background: 'var(--card)', color: 'var(--text)', border: `1px solid ${selectedSubCategoryId ? '#10b981' : 'var(--border)'}`, borderRadius: 8 }}
                    >
                      <option value="">-- Selecciona (opcional) --</option>
                      {subCategories
                        .filter((s: any) => s.category_id === selectedCategoryId)
                        .map((s: any) => (
                          <option key={s.sub_category_id} value={s.sub_category_id}>{s.nombre}</option>
                        ))
                      }
                    </select>
                  ) : (
                    <div style={{ padding: '.6rem .75rem', background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      Esta categoría no tiene subcategorías
                    </div>
                  )}
                </div>
              </div>
              {!selectedCategoryId && (
                <p style={{ marginTop: '.5rem', fontSize: '.85rem', color: '#ef4444' }}>⚠ Debes seleccionar una categoría.</p>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Código de Barras</th>
                    <th>Nombre *</th>
                    <th>Descripción</th>
                    <th>Tamaño</th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.map((row, idx) => {
                    const v = rowValidation[idx];
                    const has = (s: string) => v?.errors.some(e => e.includes(s));
                    return (
                      <tr key={idx}>
                        <td>
                          <div className="row-status">
                            <div className={`status-icon ${v?.valid ? 'status-valid' : 'status-invalid'}`}>
                              {v?.valid ? '✓' : '!'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <input className="cell-input" value={row.cod_barra || ''} onChange={(e) => handleCellChange(idx, 'cod_barra', e.target.value)} />
                        </td>
                        <td>
                          <input className={`cell-input ${has('Nombre') ? 'cell-error' : ''}`} value={row.nombre || ''} onChange={(e) => handleCellChange(idx, 'nombre', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.descripcion || ''} onChange={(e) => handleCellChange(idx, 'descripcion', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.tamaño || ''} onChange={(e) => handleCellChange(idx, 'tamaño', e.target.value)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="import-actions">
              <button className="btn-secondary" onClick={() => setSheets([])}>Cancelar</button>
              <button className="btn-primary" onClick={handleImport} disabled={loading || validRowsCount === 0 || !selectedCategoryId}>
                Importar {validRowsCount} Producto{validRowsCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
