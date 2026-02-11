import { useEffect, useRef, useState } from 'react';
import { Upload, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { readExcelFile, generateExcelTemplate, type SheetData, type ClienteImportRow } from './utils/excelImporter';
import { useExcelImport } from './hooks/useExcelImport';
import { useClientes } from './hooks/useClientes';
import { useCollaborators } from './hooks/useCollaborators';
import './ImportarClientes.css';

export default function ImportarClientes() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  
  // Estados por hoja para preservar cambios al navegar entre hojas
  const [editedSheets, setEditedSheets] = useState<{ [sheetIndex: number]: ClienteImportRow[] }>({});
  const [sheetValidations, setSheetValidations] = useState<{ [sheetIndex: number]: { [rowIndex: number]: { valid: boolean; errors: string[] } } }>({});
  const [sheetSelectedRows, setSheetSelectedRows] = useState<{ [sheetIndex: number]: { [rowIndex: number]: boolean } }>({});
  const [selectedSheets, setSelectedSheets] = useState<{ [sheetIndex: number]: boolean }>({}); // Hojas seleccionadas para importar
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Configuración por hoja (cada hoja puede tener preventista diferente)
  const [sheetPreventistas, setSheetPreventistas] = useState<{ [sheetIndex: number]: number | '' }>({});

  const { mapRowToPayload, validateRow } = useExcelImport();
  const { createCliente } = useClientes();
  const { preventistas } = useCollaborators();

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Importar Clientes';
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      const data = await readExcelFile(file);
      setSheets(data);
      setSelectedSheetIndex(0);

      // Inicializar estados para cada hoja
      const newEditedSheets: { [sheetIndex: number]: ClienteImportRow[] } = {};
      const newSheetValidations: { [sheetIndex: number]: { [rowIndex: number]: { valid: boolean; errors: string[] } } } = {};
      const newSheetSelectedRows: { [sheetIndex: number]: { [rowIndex: number]: boolean } } = {};
      const sheetsSelection: { [sheetIndex: number]: boolean } = {};
      const newSheetPreventistas: { [sheetIndex: number]: number | '' } = {};
      
      data.forEach((sheet, sheetIdx) => {
        newEditedSheets[sheetIdx] = [...sheet.datos];
        const validation: { [key: number]: { valid: boolean; errors: string[] } } = {};
        const selected: { [key: number]: boolean } = {};
        
        sheet.datos.forEach((row, idx) => {
          validation[idx] = validateRow(row);
          selected[idx] = validation[idx].valid; // Seleccionar automáticamente las filas válidas
        });
        
        newSheetValidations[sheetIdx] = validation;
        newSheetSelectedRows[sheetIdx] = selected;
        sheetsSelection[sheetIdx] = true; // Seleccionar todas las hojas por defecto
        
        // Inicializar configuración de preventista para cada hoja
        newSheetPreventistas[sheetIdx] = '';
      });
      
      setEditedSheets(newEditedSheets);
      setSheetValidations(newSheetValidations);
      setSheetSelectedRows(newSheetSelectedRows);
      setSelectedSheets(sheetsSelection);
      setSheetPreventistas(newSheetPreventistas);
    } catch (err: any) {
      setError(err.message || 'Error al leer el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      await processFile(file);
    } else {
      setError('Por favor, arrastra un archivo Excel válido (.xlsx, .xls, .csv)');
    }
  };

  const handleSheetChange = (index: number) => {
    setSelectedSheetIndex(index);
    setSuccess(null);
    setError(null);
  };

  const handleCellChange = (rowIdx: number, field: keyof ClienteImportRow, value: any) => {
    const currentSheetData = [...(editedSheets[selectedSheetIndex] || [])];
    currentSheetData[rowIdx] = { ...currentSheetData[rowIdx], [field]: value === '' ? undefined : value };
    
    setEditedSheets(prev => ({ ...prev, [selectedSheetIndex]: currentSheetData }));
    
    const validation = validateRow(currentSheetData[rowIdx]);
    setSheetValidations(prev => ({
      ...prev,
      [selectedSheetIndex]: { ...(prev[selectedSheetIndex] || {}), [rowIdx]: validation }
    }));
    
    // Auto-seleccionar la fila si se vuelve válida
    const currentSelectedRows = sheetSelectedRows[selectedSheetIndex] || {};
    if (validation.valid && !currentSelectedRows[rowIdx]) {
      setSheetSelectedRows(prev => ({
        ...prev,
        [selectedSheetIndex]: { ...(prev[selectedSheetIndex] || {}), [rowIdx]: true }
      }));
    }
  };

  const handleToggleRow = (rowIdx: number) => {
    setSheetSelectedRows(prev => ({
      ...prev,
      [selectedSheetIndex]: {
        ...(prev[selectedSheetIndex] || {}),
        [rowIdx]: !(prev[selectedSheetIndex]?.[rowIdx] || false)
      }
    }));
  };

  const handleToggleAll = () => {
    const currentValidation = sheetValidations[selectedSheetIndex] || {};
    const currentSelected = sheetSelectedRows[selectedSheetIndex] || {};
    const allSelected = Object.keys(currentValidation).every(idx => currentSelected[Number(idx)]);
    const newSelected: { [key: number]: boolean } = {};
    Object.keys(currentValidation).forEach(idx => {
      newSelected[Number(idx)] = !allSelected;
    });
    setSheetSelectedRows(prev => ({ ...prev, [selectedSheetIndex]: newSelected }));
  };

  const handleToggleSheet = (sheetIndex: number) => {
    const newSelectedSheets = { ...selectedSheets, [sheetIndex]: !selectedSheets[sheetIndex] };
    setSelectedSheets(newSelectedSheets);
    
    // Actualizar la selección de filas de esta hoja
    const currentValidation = sheetValidations[sheetIndex] || {};
    const newSelected: { [key: number]: boolean } = {};
    Object.keys(currentValidation).forEach(idx => {
      newSelected[Number(idx)] = newSelectedSheets[sheetIndex] && currentValidation[Number(idx)].valid;
    });
    setSheetSelectedRows(prev => ({ ...prev, [sheetIndex]: newSelected }));
  };

  const handleToggleAllSheets = () => {
    const allSelected = Object.values(selectedSheets).every(Boolean);
    const newSelectedSheets: { [sheetIndex: number]: boolean } = {};
    const newSheetSelectedRows: { [sheetIndex: number]: { [rowIndex: number]: boolean } } = {};
    
    sheets.forEach((_, sheetIdx) => {
      newSelectedSheets[sheetIdx] = !allSelected;
      const currentValidation = sheetValidations[sheetIdx] || {};
      const newSelected: { [key: number]: boolean } = {};
      Object.keys(currentValidation).forEach(idx => {
        newSelected[Number(idx)] = !allSelected && currentValidation[Number(idx)].valid;
      });
      newSheetSelectedRows[sheetIdx] = newSelected;
    });
    
    setSelectedSheets(newSelectedSheets);
    setSheetSelectedRows(newSheetSelectedRows);
  };

  const handleAddRow = () => {
    const newRow: ClienteImportRow = {
      sub_canal: '',
      visita: '',
      dia_visita: '',
      nit_ci: undefined,
      nombre: '',
      direccion: '',
      ciudad: '',
      coordenadas: '',
      telefono: '',
    };
    const currentSheetData = editedSheets[selectedSheetIndex] || [];
    const newIndex = currentSheetData.length;
    
    setEditedSheets(prev => ({
      ...prev,
      [selectedSheetIndex]: [...currentSheetData, newRow]
    }));
    
    setSheetValidations(prev => ({
      ...prev,
      [selectedSheetIndex]: { ...(prev[selectedSheetIndex] || {}), [newIndex]: validateRow(newRow) }
    }));
    
    setSheetSelectedRows(prev => ({
      ...prev,
      [selectedSheetIndex]: { ...(prev[selectedSheetIndex] || {}), [newIndex]: false }
    }));
  };

  const handleDeleteRow = (rowIdx: number) => {
    const currentSheetData = editedSheets[selectedSheetIndex] || [];
    const updated = currentSheetData.filter((_, idx) => idx !== rowIdx);
    
    setEditedSheets(prev => ({ ...prev, [selectedSheetIndex]: updated }));
    
    // Reorganizar validaciones y selecciones
    const currentValidation = sheetValidations[selectedSheetIndex] || {};
    const currentSelected = sheetSelectedRows[selectedSheetIndex] || {};
    const newValidation: { [key: number]: { valid: boolean; errors: string[] } } = {};
    const newSelected: { [key: number]: boolean } = {};
    
    updated.forEach((row, idx) => {
      const oldIdx = idx >= rowIdx ? idx + 1 : idx;
      newValidation[idx] = currentValidation[oldIdx] || validateRow(row);
      newSelected[idx] = currentSelected[oldIdx] || false;
    });
    
    setSheetValidations(prev => ({ ...prev, [selectedSheetIndex]: newValidation }));
    setSheetSelectedRows(prev => ({ ...prev, [selectedSheetIndex]: newSelected }));
  };

  const handleImport = async () => {
    // Validar que todas las hojas seleccionadas tengan preventista
    const selectedSheetIndices = Object.keys(selectedSheets).filter(idx => selectedSheets[Number(idx)]);
    const sheetsWithoutPreventista = selectedSheetIndices.filter(idx => !sheetPreventistas[Number(idx)]);
    
    if (sheetsWithoutPreventista.length > 0) {
      const sheetNames = sheetsWithoutPreventista.map(idx => sheets[Number(idx)].nombre).join(', ');
      setError(`Debes seleccionar un preventista para las siguientes hojas: ${sheetNames}`);
      return;
    }

    // Contar total de filas seleccionadas en todas las hojas seleccionadas
    let totalSelectedRows = 0;
    sheets.forEach((_, sheetIdx) => {
      if (selectedSheets[sheetIdx]) {
        const selectedInThisSheet = Object.values(sheetSelectedRows[sheetIdx] || {}).filter(Boolean).length;
        totalSelectedRows += selectedInThisSheet;
      }
    });

    if (totalSelectedRows === 0) {
      setError('Selecciona al menos una fila para importar');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let ok = 0;
      let fail = 0;
      const errors: string[] = [];

      // Iterar sobre todas las hojas
      for (let sheetIdx = 0; sheetIdx < sheets.length; sheetIdx++) {
        // Solo procesar hojas seleccionadas
        if (!selectedSheets[sheetIdx]) {
          continue;
        }

        const sheetData = editedSheets[sheetIdx] || [];
        const sheetSelectedRowsData = sheetSelectedRows[sheetIdx] || {};
        
        for (let i = 0; i < sheetData.length; i++) {
          // Solo importar filas seleccionadas
          if (!sheetSelectedRowsData[i]) {
            continue;
          }

          const row = sheetData[i];
          
          // Validar la fila
          const validation = validateRow(row);
          if (!validation.valid) {
            fail++;
            errors.push(`Hoja "${sheets[sheetIdx].nombre}" - Fila ${i + 1}: Datos inválidos`);
            continue;
          }

          // Obtener la configuración de preventista de esta hoja
          const sheetPreventistaId = sheetPreventistas[sheetIdx];
          
          const payload = mapRowToPayload(row, Number(sheetPreventistaId));

          try {
            await createCliente(payload);
            ok++;
          } catch (err: any) {
            console.error(`Error importando cliente de hoja "${sheets[sheetIdx].nombre}" fila`, i + 1, err);
            errors.push(`Hoja "${sheets[sheetIdx].nombre}" - Fila ${i + 1}: ${err.message || 'Error desconocido'}`);
            fail++;
          }
        }
      }

      if (ok > 0) {
        let msg = `✓ ${ok} cliente${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''} correctamente`;
        if (fail > 0) {
          msg += ` (${fail} con error${fail !== 1 ? 's' : ''})`;
        }
        msg += '.';
        setSuccess(msg);
        // Limpiar tabla después de importación exitosa
        setTimeout(() => setSheets([]), 2000);
      }
      if (ok === 0 && fail > 0) {
        setError(`✗ No se pudo importar ningún cliente. ${fail} fila${fail !== 1 ? 's' : ''} con error${fail !== 1 ? 's' : ''}.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al importar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Acceder a los datos de la hoja actual
  const currentSheetData = editedSheets[selectedSheetIndex] || [];
  const currentValidation = sheetValidations[selectedSheetIndex] || {};
  const currentSelectedRows = sheetSelectedRows[selectedSheetIndex] || {};
  // const currentSheetPreventista = sheetPreventistas[selectedSheetIndex] || '';
  
  const totalRows = currentSheetData.length;
  const selectedCount = Object.values(currentSelectedRows).filter(Boolean).length;
  const selectedSheetsCount = Object.values(selectedSheets).filter(Boolean).length;
  
  // Calcular total de filas seleccionadas en hojas seleccionadas
  const totalRowsInSelectedSheets = sheets.reduce((acc, _, idx) => {
    if (selectedSheets[idx]) {
      const selectedInSheet = Object.values(sheetSelectedRows[idx] || {}).filter(Boolean).length;
      return acc + selectedInSheet;
    }
    return acc;
  }, 0);

  return (
    <div className="import-page">
      <div className="import-header">
        <h1>Importar Clientes</h1>
        <p>Carga clientes desde un archivo Excel con vista previa y validación</p>
      </div>

      {sheets.length === 0 ? (
        <>
          <div className="upload-section">
            <div 
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
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
                style={{ display: 'none' }}
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
                    <li><b>Obligatorios:</b> Sub Canal, Nombre, Dirección</li>
                    <li><b>Opcionales:</b> NIT/CI, Visita, Ciudad, Coordenadas, Teléfono, Día de Visita</li>
                    <li><b>Nota:</b> El preventista se selecciona en la pantalla, NO en el Excel</li>
                  </ul>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">3</div>
                <div className="instruction-text">
                  <p>Carga el archivo aquí</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Detectamos automáticamente todas las hojas del Excel</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">4</div>
                <div className="instruction-text">
                  <p>Selecciona las hojas a importar</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Marca las hojas completas o ajusta individualmente por fila</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">5</div>
                <div className="instruction-text">
                  <p>Asigna un preventista a cada hoja</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Elige el preventista responsable de los clientes de cada hoja</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">6</div>
                <div className="instruction-text">
                  <p>Revisa y confirma la importación</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Solo se importan los clientes de las filas seleccionadas</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-state">{error}</div>}

          {/* Selector de hojas si hay varias */}
          {sheets.length > 1 && (
            <div className="sheets-selector">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    Hojas de Excel ({selectedSheetsCount}/{sheets.length} seleccionadas)
                  </h3>
                  <p style={{ margin: '.25rem 0 0 0', fontSize: '.85rem', opacity: .7 }}>
                    💡 Marca las hojas completas que deseas importar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAllSheets}
                  className="btn"
                  style={{ padding: '.5rem 1rem', fontSize: '.85rem' }}
                >
                  {Object.values(selectedSheets).every(Boolean) ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                </button>
              </div>
              <div className="sheets-tabs">
                {sheets.map((s, idx) => {
                  const sheetRows = (editedSheets[idx] || []).length;
                  const sheetSelectedRowsCount = Object.values(sheetSelectedRows[idx] || {}).filter(Boolean).length;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`sheet-tab ${idx === selectedSheetIndex ? 'active' : ''}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '.75rem',
                        background: selectedSheets[idx] ? (idx === selectedSheetIndex ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.05)') : 'var(--card)',
                        border: `2px solid ${selectedSheets[idx] ? '#10b981' : 'var(--border)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedSheets[idx] || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleSheet(idx);
                        }}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        title={selectedSheets[idx] ? 'Deseleccionar hoja' : 'Seleccionar hoja'}
                      />
                      <div 
                        onClick={() => handleSheetChange(idx)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '.5rem' }}
                      >
                        <FileText size={16} style={{ display: 'inline' }} /> {s.nombre}
                        <span className="sheet-badge">{sheetSelectedRowsCount}/{sheetRows} filas</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="preview-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="preview-title" style={{ margin: 0 }}>
                Vista previa: {sheets[selectedSheetIndex]?.nombre || 'Datos'}
                <span style={{ fontSize: '.9rem', opacity: .7, marginLeft: '1rem' }}>
                  ({selectedCount}/{totalRows} filas seleccionadas en esta hoja)
                </span>
                {sheets.length > 1 && (
                  <span style={{ fontSize: '.85rem', opacity: .6, marginLeft: '.5rem', display: 'block', marginTop: '.25rem' }}>
                    Total en hojas seleccionadas: {totalRowsInSelectedSheets} clientes
                  </span>
                )}
              </h3>
              <button 
                type="button"
                onClick={handleAddRow} 
                className="btn" 
                style={{ padding: '.5rem 1rem', fontSize: '.9rem' }}
              >
                <Plus size={16} /> Agregar Fila
              </button>
            </div>

            {/* Selector de preventista por hoja */}
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
                <FileText size={20} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Configuración de hoja: <span style={{ color: '#10b981' }}>{sheets[selectedSheetIndex]?.nombre}</span></h3>
              </div>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Preventista obligatorio por hoja */}
                <div>
                  <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600, fontSize: '1rem' }}>
                    Preventista * <span style={{ fontSize: '.85rem', opacity: .7, fontWeight: 400 }}>(Se aplica a todos los clientes de esta hoja)</span>
                  </label>
                  <select
                    value={sheetPreventistas[selectedSheetIndex] || ''}
                    onChange={(e) => setSheetPreventistas(prev => ({ ...prev, [selectedSheetIndex]: e.target.value ? Number(e.target.value) : '' }))}
                    style={{ 
                      width: '100%', 
                      padding: '.75rem', 
                      background: 'var(--card)', 
                      color: 'var(--text)', 
                      border: `2px solid ${sheetPreventistas[selectedSheetIndex] ? '#10b981' : '#ef4444'}`, 
                      borderRadius: 8,
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">-- Selecciona un preventista --</option>
                    {preventistas.map((prev) => (
                      <option key={prev.collaborator_id} value={prev.collaborator_id}>
                        {prev.nombre} {prev.apellido}
                      </option>
                    ))}
                  </select>
                  {!sheetPreventistas[selectedSheetIndex] && (
                    <p style={{ marginTop: '.5rem', fontSize: '.85rem', color: '#ef4444' }}>⚠ El preventista es obligatorio para esta hoja</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-2)', borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.95rem' }}>
                <input
                  type="checkbox"
                  checked={Object.keys(currentValidation).every(idx => currentSelectedRows[Number(idx)])}
                  onChange={handleToggleAll}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <span>Seleccionar todas las filas</span>
              </label>
              <button
                className="btn-import"
                onClick={handleImport}
                disabled={loading || totalRowsInSelectedSheets === 0}
                style={{ padding: '.7rem 1.5rem' }}
              >
                {loading ? 'Importando...' : `Importar ${totalRowsInSelectedSheets} cliente${totalRowsInSelectedSheets !== 1 ? 's' : ''}`}
              </button>
            </div>

            <div className="table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">✓</th>
                    <th>Sub Canal</th>
                    <th>NIT/CI</th>
                    <th>Nombre</th>
                    <th>Dirección</th>
                    <th>Ciudad</th>
                    <th>Coordenadas</th>
                    <th>Teléfono</th>
                    <th>Visita</th>
                    <th>Día de Visita</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSheetData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="no-data">
                        No hay datos. Haz clic en "Añadir fila" para agregar una nueva fila.
                      </td>
                    </tr>
                  ) : (
                    currentSheetData.map((row, rowIdx) => {
                      const validation = currentValidation[rowIdx] || { valid: false, errors: [] };
                      const isRowSelected = currentSelectedRows[rowIdx] || false;
                      
                      return (
                        <tr
                          key={rowIdx}
                          className={`${!validation.valid ? 'invalid-row' : ''} ${isRowSelected ? 'selected' : ''}`}
                          title={validation.errors.join(', ')}
                        >
                          <td className="checkbox-column">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => handleToggleRow(rowIdx)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.sub_canal || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'sub_canal', e.target.value)}
                              className={validation.errors.some(e => e.includes('Sub Canal')) ? 'cell-error' : ''}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.nit_ci || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'nit_ci', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.nombre || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'nombre', e.target.value)}
                              className={validation.errors.some(e => e.includes('Nombre')) ? 'cell-error' : ''}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.direccion || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'direccion', e.target.value)}
                              className={validation.errors.some(e => e.includes('Dirección')) ? 'cell-error' : ''}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.ciudad || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'ciudad', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.coordenadas || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'coordenadas', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.telefono || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'telefono', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.visita || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'visita', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.dia_visita || ''}
                              onChange={(e) => handleCellChange(rowIdx, 'dia_visita', e.target.value)}
                            />
                          </td>
                          <td className="actions-column">
                            <button
                              className="btn-delete-row"
                              onClick={() => handleDeleteRow(rowIdx)}
                              title="Eliminar fila"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
