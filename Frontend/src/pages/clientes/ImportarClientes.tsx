import { useState, useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { readExcelFile, generateExcelTemplate, type SheetData, type ClienteImportRow } from './utils/excelImporter';
import { useExcelImport } from './hooks/useExcelImport';
import { useClientes } from './hooks/useClientes';
import { useCategoriasClientes } from './hooks/useCategoriasClientes';
import './ImportarClientes.css';

export default function ImportarClientes() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [editedData, setEditedData] = useState<ClienteImportRow[]>([]);
  const [rowValidation, setRowValidation] = useState<{ [key: number]: { valid: boolean; errors: string[] } }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { mapRowToPayload, validateRow } = useExcelImport();
  const { createCliente } = useClientes();
  const { categorias } = useCategoriasClientes();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      const data = await readExcelFile(file);
      setSheets(data);
      setSelectedSheetIndex(0);
      
      // Validar y preparar datos
      const firstSheet = data[0];
      const validation: { [key: number]: { valid: boolean; errors: string[] } } = {};
      firstSheet.datos.forEach((row, idx) => {
        validation[idx] = validateRow(row);
      });
      setRowValidation(validation);
      setEditedData([...firstSheet.datos]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

    // Reset file input
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

  const handleCellChange = (rowIdx: number, field: keyof ClienteImportRow, value: any) => {
    const updated = [...editedData];
    updated[rowIdx] = { ...updated[rowIdx], [field]: value === '' ? undefined : value };
    setEditedData(updated);

    // Re-validate row
    const validation = validateRow(updated[rowIdx]);
    setRowValidation(prev => ({ ...prev, [rowIdx]: validation }));
  };

  const handleImport = async () => {
    if (!selectedCategoryId) {
      setError('Por favor selecciona una categoría para los clientes');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < editedData.length; i++) {
        const validation = rowValidation[i];
        if (!validation?.valid) {
          failureCount++;
          continue;
        }

        const payload = mapRowToPayload(editedData[i], undefined, [selectedCategoryId]);
        try {
          await createCliente(payload);
          successCount++;
        } catch (err) {
          console.error(`Error importando fila ${i + 1}:`, err);
          failureCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(
          `✓ ${successCount} cliente${successCount !== 1 ? 's' : ''} importado${successCount !== 1 ? 's' : ''} correctamente${
            failureCount > 0 ? `. ${failureCount} fila${failureCount !== 1 ? 's' : ''} tuvo errores.` : '.'
          }`
        );
      }
      if (failureCount > 0 && successCount === 0) {
        setError(`No se pudo importar. Por favor revisa los datos y sus validaciones.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validRowsCount = Object.values(rowValidation).filter(v => v.valid).length;
  const totalRows = editedData.length;

  return (
    <div className="import-page">
      <div className="import-header">
        <h1>Importar Clientes</h1>
        <p>Carga clientes desde un archivo Excel con soporte a múltiples hojas por categoría</p>
      </div>

      {/* Upload Section */}
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
                <button className="btn-template" onClick={generateExcelTemplate}>
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

          {/* Instructions */}
          <div className="instructions-section">
            <h3 className="instructions-title">📋 Cómo funciona</h3>
            <div className="instructions-content">
              <div className="instruction-item">
                <div className="instruction-icon">1</div>
                <div className="instruction-text">
                  <p>Descarga la plantilla Excel</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    Usa el botón "Descargar Plantilla" para obtener el formato correcto
                  </p>
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">2</div>
                <div className="instruction-text">
                  <p>Completa los datos en Excel</p>
                  <ul>
                    <li><strong>Campos obligatorios:</strong> sub_canal, nombre, direccion</li>
                    <li><strong>Campos opcionales:</strong> nit_ci, visita, ciudad, coordenadas, telefono, ruta, dia_visita</li>
                    <li>Usa múltiples hojas para categorizar (ej: "Categoría_A", "Categoría_B")</li>
                  </ul>
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">3</div>
                <div className="instruction-text">
                  <p>Carga el archivo aquí</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    El sistema detectará automáticamente todas las hojas
                  </p>
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">4</div>
                <div className="instruction-text">
                  <p>Revisa y edita los datos</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    Puedes modificar cualquier valor antes de importar
                  </p>
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">5</div>
                <div className="instruction-text">
                  <p>Importa los clientes</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    Solo se importarán filas con datos válidos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {success && <div className="success-message">✓ {success}</div>}
          {error && <div className="error-state">⚠ {error}</div>}

          {/* Sheets Selector */}
          {sheets.length > 1 && (
            <div className="sheets-selector">
              <div className="sheets-tabs">
                {sheets.map((sheet, idx) => (
                  <button
                    key={idx}
                    className={`sheet-tab ${idx === selectedSheetIndex ? 'active' : ''}`}
                    onClick={() => handleSheetChange(idx)}
                  >
                    <FileText size={16} style={{ display: 'inline' }} /> {sheet.nombre}
                    <span className="sheet-badge">
                      {sheet.datos.length} filas
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {editedData.length > 0 ? (
            <div className="preview-section">
              <h3 className="preview-title">
                Vista previa de datos
                {validRowsCount < totalRows && (
                  <span style={{ fontSize: '0.9rem', opacity: 0.7, marginLeft: '1rem' }}>
                    ({validRowsCount}/{totalRows} filas válidas)
                  </span>
                )}
              </h3>

              {/* Category Selector */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
                  Categoría para todos los clientes *
                </label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: `1px solid ${selectedCategoryId ? '#10b981' : 'var(--border)'}`,
                    background: 'var(--card)',
                    color: 'var(--text)',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Selecciona una categoría --</option>
                  {categorias.map((cat) => (
                    <option key={cat.cliente_categoria_id} value={cat.cliente_categoria_id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {!selectedCategoryId && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ef4444' }}>
                    ⚠ Debes seleccionar una categoría para poder importar
                  </p>
                )}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Sub Canal *</th>
                      <th>Nombre *</th>
                      <th>Dirección *</th>
                      <th>NIT/CI</th>
                      <th>Ciudad</th>
                      <th>Teléfono</th>
                      <th>Visita</th>
                      <th>Ruta</th>
                      <th>Día de Visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedData.map((row, rowIdx) => {
                      const validation = rowValidation[rowIdx];
                      return (
                        <tr key={rowIdx}>
                          <td>
                            <div className="row-status">
                              <div className={`status-icon ${validation?.valid ? 'status-valid' : 'status-invalid'}`}>
                                {validation?.valid ? '✓' : '!'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <input
                                type="text"
                                className={`cell-input ${!validation?.valid && validation?.errors.some(e => e.includes('Sub Canal')) ? 'cell-error' : ''}`}
                                value={row.sub_canal || ''}
                                onChange={(e) => handleCellChange(rowIdx, 'sub_canal', e.target.value)}
                                maxLength={100}
                              />
                              {validation?.errors.some(e => e.includes('Sub Canal')) && (
                                <div className="error-message">Requerido</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <input
                                type="text"
                                className={`cell-input ${!validation?.valid && validation?.errors.some(e => e.includes('Nombre')) ? 'cell-error' : ''}`}
                                value={row.nombre || ''}
                                onChange={(e) => handleCellChange(rowIdx, 'nombre', e.target.value)}
                                maxLength={100}
                              />
                              {validation?.errors.some(e => e.includes('Nombre')) && (
                                <div className="error-message">Requerido</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <input
                                type="text"
                                className={`cell-input ${!validation?.valid && validation?.errors.some(e => e.includes('Dirección')) ? 'cell-error' : ''}`}
                                value={row.direccion || ''}
                                onChange={(e) => handleCellChange(rowIdx, 'direccion', e.target.value)}
                                maxLength={200}
                              />
                              {validation?.errors.some(e => e.includes('Dirección')) && (
                                <div className="error-message">Requerido</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              className={`cell-input ${!validation?.valid && validation?.errors.some(e => e.includes('NIT')) ? 'cell-error' : ''}`}
                              value={row.nit_ci || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'nit_ci', e.target.value ? parseInt(e.target.value, 10) : '')}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="cell-input"
                              value={row.ciudad || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'ciudad', e.target.value)}
                              maxLength={100}
                            />
                          </td>
                          <td>
                            <input
                              type="tel"
                              className="cell-input"
                              value={row.telefono || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'telefono', e.target.value)}
                              maxLength={20}
                            />
                          </td>
                          <td>
                            <select
                              className="cell-input"
                              value={row.visita || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'visita', e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="Día">Día</option>
                              <option value="Noche">Noche</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="cell-input"
                              value={row.ruta || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'ruta', e.target.value)}
                              maxLength={100}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className={`cell-input ${!validation?.valid && validation?.errors.some(e => e.includes('Fecha')) ? 'cell-error' : ''}`}
                              value={row.dia_visita || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'dia_visita', e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="import-actions">
                <button className="btn-secondary" onClick={() => setSheets([])}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={loading || validRowsCount === 0}
                >
                  Importar {validRowsCount} Cliente{validRowsCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">No hay datos para mostrar</div>
          )}
        </>
      )}
    </div>
  );
}
