import { useEffect, useRef, useState } from 'react';
import { Upload, Download, FileText, Plus, Trash2 } from 'lucide-react';
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
  
  // Estados por hoja para preservar cambios al navegar entre hojas
  const [editedSheets, setEditedSheets] = useState<{ [sheetIndex: number]: ProductImportRow[] }>({});
  const [sheetValidations, setSheetValidations] = useState<{ [sheetIndex: number]: { [rowIndex: number]: { valid: boolean; errors: string[] } } }>({});
  const [sheetSelectedRows, setSheetSelectedRows] = useState<{ [sheetIndex: number]: { [rowIndex: number]: boolean } }>({});
  const [selectedSheets, setSelectedSheets] = useState<{ [sheetIndex: number]: boolean }>({}); // Hojas seleccionadas para importar
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  
  // Configuración por hoja (cada hoja puede tener categoría y subcategoría diferentes)
  const [sheetCategories, setSheetCategories] = useState<{ [sheetIndex: number]: number | '' }>({});
  const [sheetSubCategoryModes, setSheetSubCategoryModes] = useState<{ [sheetIndex: number]: 'global' | 'manual' }>({});
  const [sheetGlobalSubCategories, setSheetGlobalSubCategories] = useState<{ [sheetIndex: number]: number | '' }>({});

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

    await processFile(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      const data = await readProductExcelFile(file);
      setSheets(data);
      setSelectedSheetIndex(0);

      // Inicializar estados para cada hoja
      const newEditedSheets: { [sheetIndex: number]: ProductImportRow[] } = {};
      const newSheetValidations: { [sheetIndex: number]: { [rowIndex: number]: { valid: boolean; errors: string[] } } } = {};
      const newSheetSelectedRows: { [sheetIndex: number]: { [rowIndex: number]: boolean } } = {};
      const sheetsSelection: { [sheetIndex: number]: boolean } = {};
      
      const newSheetCategories: { [sheetIndex: number]: number | '' } = {};
      const newSheetSubCategoryModes: { [sheetIndex: number]: 'global' | 'manual' } = {};
      const newSheetGlobalSubCategories: { [sheetIndex: number]: number | '' } = {};
      
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
        
        // Inicializar configuración de categoría para cada hoja
        newSheetCategories[sheetIdx] = '';
        newSheetSubCategoryModes[sheetIdx] = 'manual';
        newSheetGlobalSubCategories[sheetIdx] = '';
      });
      
      setEditedSheets(newEditedSheets);
      setSheetValidations(newSheetValidations);
      setSheetSelectedRows(newSheetSelectedRows);
      setSelectedSheets(sheetsSelection);
      setSheetCategories(newSheetCategories);
      setSheetSubCategoryModes(newSheetSubCategoryModes);
      setSheetGlobalSubCategories(newSheetGlobalSubCategories);
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
    // Los datos ya están en editedSheets[index], no necesitamos hacer nada más
  };

  const handleCellChange = (rowIdx: number, field: keyof ProductImportRow, value: any) => {
    const currentSheetData = [...(editedSheets[selectedSheetIndex] || [])];
    currentSheetData[rowIdx] = { ...currentSheetData[rowIdx], [field]: value === '' ? undefined : value };
    
    setEditedSheets(prev => ({ ...prev, [selectedSheetIndex]: currentSheetData }));
    
    const validation = validateRow(currentSheetData[rowIdx]);
    setSheetValidations(prev => ({
      ...prev,
      [selectedSheetIndex]: { ...(prev[selectedSheetIndex] || {}), [rowIdx]: validation }
    }));    // Auto-seleccionar la fila si se vuelve válida
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
    const newRow: ProductImportRow = {
      cod_barra: '',
      nombre: '',
      descripcion: '',
      tamaño: '',
      precio_venta_sin_factura: '',
      precio_venta_con_factura: '',
      precio_compra: '',
      precio_compra_paquete: '',
      precio_venta_paquete_sin_factura: '',
      precio_venta_paquete_con_factura: '',
      cant_por_paquete: '',
      _subcategory_id: undefined, // Para modo manual
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
    // Validar que todas las hojas seleccionadas tengan categoría
    const selectedSheetIndices = Object.keys(selectedSheets).filter(idx => selectedSheets[Number(idx)]);
    const sheetsWithoutCategory = selectedSheetIndices.filter(idx => !sheetCategories[Number(idx)]);
    
    if (sheetsWithoutCategory.length > 0) {
      const sheetNames = sheetsWithoutCategory.map(idx => sheets[Number(idx)].nombre).join(', ');
      setError(`Debes seleccionar una categoría para las siguientes hojas: ${sheetNames}`);
      return;
    }

    // Contar total de filas seleccionadas en todas las hojas seleccionadas
    let totalSelectedRows = 0;
    sheets.forEach((sheet, sheetIdx) => {
      if (selectedSheets[sheetIdx]) {
        totalSelectedRows += sheet.datos.length;
      }
    });

    if (totalSelectedRows === 0) {
      setError('Selecciona al menos una hoja o fila para importar');
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
        
        for (let i = 0; i < sheetData.length; i++) {
          const row = sheetData[i];
          
          // Validar la fila
          const validation = validateRow(row);
          if (!validation.valid) {
            fail++;
            errors.push(`Hoja "${sheets[sheetIdx].nombre}" - Fila ${i + 1}: Datos inválidos`);
            continue;
          }

          // Obtener la configuración de esta hoja
          const sheetCategoryId = sheetCategories[sheetIdx];
          const sheetMode = sheetSubCategoryModes[sheetIdx] || 'manual';
          const sheetGlobalSubCat = sheetGlobalSubCategories[sheetIdx];
          
          // Determinar la subcategoría según el modo de esta hoja
          let subCatId: number | undefined;
          if (sheetMode === 'global') {
            subCatId = sheetGlobalSubCat ? Number(sheetGlobalSubCat) : undefined;
          } else {
            subCatId = row._subcategory_id ? Number(row._subcategory_id) : undefined;
          }

          const payload = mapRowToPayload(
            row,
            Number(sheetCategoryId),
            subCatId
          );

          try {
            await request('/product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }, auth?.token);
            ok++;
          } catch (err: any) {
            console.error(`Error importando producto de hoja "${sheets[sheetIdx].nombre}" fila`, i + 1, err);
            errors.push(`Hoja "${sheets[sheetIdx].nombre}" - Fila ${i + 1}: ${err.message || 'Error desconocido'}`);
            fail++;
          }
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

  // Acceder a los datos de la hoja actual
  const currentSheetData = editedSheets[selectedSheetIndex] || [];
  const currentValidation = sheetValidations[selectedSheetIndex] || {};
  const currentSelectedRows = sheetSelectedRows[selectedSheetIndex] || {};
  const currentSheetCategory = sheetCategories[selectedSheetIndex] || '';
  const currentSheetSubCategoryMode = sheetSubCategoryModes[selectedSheetIndex] || 'manual';
  const currentSheetGlobalSubCategory = sheetGlobalSubCategories[selectedSheetIndex] || '';
  
  // const validRowsCount = Object.values(currentValidation).filter(v => v.valid).length;
  const totalRows = currentSheetData.length;
  const selectedCount = Object.values(currentSelectedRows).filter(Boolean).length;
  const selectedSheetsCount = Object.values(selectedSheets).filter(Boolean).length;
  
  // Calcular total de filas en hojas seleccionadas
  const totalRowsInSelectedSheets = sheets.reduce((acc, _, idx) => {
    if (selectedSheets[idx]) {
      const sheetData = editedSheets[idx] || [];
      return acc + sheetData.length;
    }
    return acc;
  }, 0);

  return (
    <div className="import-page">
      <div className="import-header">
        <h1>Importar Productos</h1>
        <p>Carga productos desde un archivo Excel con vista previa y validación</p>
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
                    <li><b>Obligatorios:</b> Nombre, Precio Venta Sin Factura</li>
                    <li><b>Opcionales:</b> Código de barras, Descripción, Tamaño, precios adicionales, etc.</li>
                    <li><b>Nota:</b> Categoría y subcategoría se seleccionan en la pantalla, NO en el Excel</li>
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
                  <p>Selecciona la categoría y modo de subcategoría</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Elige si aplicar la misma subcategoría a todos o seleccionar manualmente</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">6</div>
                <div className="instruction-text">
                  <p>Revisa y confirma la importación</p>
                  <p style={{ fontSize: '.9rem', opacity: .7 }}>Solo se importan los productos de las hojas seleccionadas</p>
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
                {sheets.map((s, idx) => (
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
                      <span className="sheet-badge">{(editedSheets[idx] || s.datos).length} filas</span>
                    </div>
                  </div>
                ))}
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
                    Total en hojas seleccionadas: {totalRowsInSelectedSheets} productos
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

            {/* Selectores por hoja */}
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
                <FileText size={20} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Configuración de hoja: <span style={{ color: '#10b981' }}>{sheets[selectedSheetIndex]?.nombre}</span></h3>
              </div>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Categoría obligatoria por hoja */}
                <div>
                  <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600, fontSize: '1rem' }}>
                    Categoría * <span style={{ fontSize: '.85rem', opacity: .7, fontWeight: 400 }}>(Se aplica a todos los productos de esta hoja)</span>
                  </label>
                  <select
                    value={currentSheetCategory}
                    onChange={(e) => {
                      const catId = e.target.value ? Number(e.target.value) : '';
                      setSheetCategories(prev => ({ ...prev, [selectedSheetIndex]: catId }));
                      setSheetGlobalSubCategories(prev => ({ ...prev, [selectedSheetIndex]: '' })); // Limpiar subcategoría al cambiar categoría
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '.75rem', 
                      background: 'var(--card)', 
                      color: 'var(--text)', 
                      border: `2px solid ${currentSheetCategory ? '#10b981' : '#ef4444'}`, 
                      borderRadius: 8,
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">-- Selecciona una categoría --</option>
                    {categories.map((c: any) => (
                      <option key={c.category_id} value={c.category_id}>{c.nombre}</option>
                    ))}
                  </select>
                  {!currentSheetCategory && (
                    <p style={{ marginTop: '.5rem', fontSize: '.85rem', color: '#ef4444' }}>⚠ La categoría es obligatoria para esta hoja</p>
                  )}
                </div>

                {/* Modo de subcategoría por hoja */}
                {currentSheetCategory && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '.75rem', fontWeight: 600, fontSize: '1rem' }}>
                      Modo de Subcategoría (para esta hoja)
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', padding: '.75rem 1rem', background: currentSheetSubCategoryMode === 'global' ? 'rgba(16, 185, 129, 0.1)' : 'var(--card)', border: `2px solid ${currentSheetSubCategoryMode === 'global' ? '#10b981' : 'var(--border)'}`, borderRadius: 8, flex: 1 }}>
                        <input 
                          type="radio" 
                          name={`subCategoryMode-${selectedSheetIndex}`}
                          value="global"
                          checked={currentSheetSubCategoryMode === 'global'}
                          onChange={(e) => setSheetSubCategoryModes(prev => ({ ...prev, [selectedSheetIndex]: e.target.value as 'global' | 'manual' }))}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 500 }}>Aplicar la misma subcategoría a todos</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', padding: '.75rem 1rem', background: currentSheetSubCategoryMode === 'manual' ? 'rgba(16, 185, 129, 0.1)' : 'var(--card)', border: `2px solid ${currentSheetSubCategoryMode === 'manual' ? '#10b981' : 'var(--border)'}`, borderRadius: 8, flex: 1 }}>
                        <input 
                          type="radio" 
                          name={`subCategoryMode-${selectedSheetIndex}`}
                          value="manual"
                          checked={currentSheetSubCategoryMode === 'manual'}
                          onChange={(e) => setSheetSubCategoryModes(prev => ({ ...prev, [selectedSheetIndex]: e.target.value as 'global' | 'manual' }))}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 500 }}>Seleccionar manualmente por fila</span>
                      </label>
                    </div>

                    {/* Selector global de subcategoría si el modo es global */}
                    {currentSheetSubCategoryMode === 'global' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>
                          Subcategoría Global (opcional)
                        </label>
                        {subCategories.filter((s: any) => s.category_id === currentSheetCategory).length > 0 ? (
                          <select
                            value={currentSheetGlobalSubCategory}
                            onChange={(e) => setSheetGlobalSubCategories(prev => ({ ...prev, [selectedSheetIndex]: e.target.value ? Number(e.target.value) : '' }))}
                            style={{ 
                              width: '100%', 
                              padding: '.75rem', 
                              background: 'var(--card)', 
                              color: 'var(--text)', 
                              border: `2px solid ${currentSheetGlobalSubCategory ? '#10b981' : 'var(--border)'}`, 
                              borderRadius: 8,
                              fontSize: '1rem'
                            }}
                          >
                            <option value="">-- Sin subcategoría --</option>
                            {subCategories
                              .filter((s: any) => s.category_id === currentSheetCategory)
                              .map((s: any) => (
                                <option key={s.sub_category_id} value={s.sub_category_id}>{s.nombre}</option>
                              ))
                            }
                          </select>
                        ) : (
                          <div style={{ padding: '.75rem', background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                            Esta categoría no tiene subcategorías
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje informativo si el modo es manual */}
                    {currentSheetSubCategoryMode === 'manual' && (
                      <div style={{ padding: '.75rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 8, fontSize: '.9rem', color: '#60a5fa' }}>
                        💡 Podrás seleccionar la subcategoría de cada producto en la columna "Subcategoría" de la tabla
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <input 
                        type="checkbox" 
                        checked={Object.keys(currentValidation).length > 0 && Object.keys(currentValidation).every(idx => currentSelectedRows[Number(idx)])}
                        onChange={handleToggleAll}
                        style={{ cursor: 'pointer' }}
                        title="Seleccionar/Deseleccionar todas"
                      />
                    </th>
                    <th>Estado</th>
                    {currentSheetSubCategoryMode === 'manual' && <th>Subcategoría</th>}
                    <th>Código de Barras</th>
                    <th>Nombre *</th>
                    <th>Descripción</th>
                    <th>Tamaño</th>
                    <th>Precio Venta S/F *</th>
                    <th>Precio Venta C/F</th>
                    <th>Precio Compra</th>
                    <th>Precio Compra Paq.</th>
                    <th>Precio Venta Paq. S/F</th>
                    <th>Precio Venta Paq. C/F</th>
                    <th>Cant. por Paq.</th>
                    <th style={{ width: '60px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSheetData.map((row, idx) => {
                    const v = currentValidation[idx];
                    const has = (s: string) => v?.errors.some(e => e.includes(s));
                    const availableSubCategories = subCategories.filter((s: any) => s.category_id === currentSheetCategory);
                    
                    return (
                      <tr key={idx} style={{ background: currentSelectedRows[idx] ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={currentSelectedRows[idx] || false}
                            onChange={() => handleToggleRow(idx)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div className="row-status">
                            <div className={`status-icon ${v?.valid ? 'status-valid' : 'status-invalid'}`}>
                              {v?.valid ? '✓' : '!'}
                            </div>
                          </div>
                        </td>
                        {currentSheetSubCategoryMode === 'manual' && (
                          <td>
                            {availableSubCategories.length > 0 ? (
                              <select 
                                className="cell-input"
                                value={row._subcategory_id || ''}
                                onChange={(e) => handleCellChange(idx, '_subcategory_id', e.target.value ? Number(e.target.value) : undefined)}
                                style={{ width: '100%', minWidth: '150px' }}
                              >
                                <option value="">-- Sin subcategoría --</option>
                                {availableSubCategories.map((s: any) => (
                                  <option key={s.sub_category_id} value={s.sub_category_id}>{s.nombre}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontSize: '.85rem', opacity: .6 }}>Sin subcategorías</span>
                            )}
                          </td>
                        )}
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
                        <td>
                          <input className={`cell-input ${has('Precio Venta Sin Factura') ? 'cell-error' : ''}`} value={row.precio_venta_sin_factura || ''} onChange={(e) => handleCellChange(idx, 'precio_venta_sin_factura', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.precio_venta_con_factura || ''} onChange={(e) => handleCellChange(idx, 'precio_venta_con_factura', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.precio_compra || ''} onChange={(e) => handleCellChange(idx, 'precio_compra', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.precio_compra_paquete || ''} onChange={(e) => handleCellChange(idx, 'precio_compra_paquete', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.precio_venta_paquete_sin_factura || ''} onChange={(e) => handleCellChange(idx, 'precio_venta_paquete_sin_factura', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.precio_venta_paquete_con_factura || ''} onChange={(e) => handleCellChange(idx, 'precio_venta_paquete_con_factura', e.target.value)} />
                        </td>
                        <td>
                          <input className="cell-input" value={row.cant_por_paquete || ''} onChange={(e) => handleCellChange(idx, 'cant_por_paquete', e.target.value)} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="btn-icon btn-icon-danger"
                            title="Eliminar fila"
                            style={{ padding: '.4rem', border: '1px solid #ef444433', background: 'transparent', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="import-actions">
              <button className="btn-secondary" onClick={() => setSheets([])}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={handleImport} 
                disabled={loading || totalRowsInSelectedSheets === 0}
              >
                {loading ? 'Importando...' : `Importar ${totalRowsInSelectedSheets} Producto${totalRowsInSelectedSheets !== 1 ? 's' : ''} de ${selectedSheetsCount} Hoja${selectedSheetsCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
