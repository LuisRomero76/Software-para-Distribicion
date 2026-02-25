import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, Download, Search, RefreshCw, AlertCircle, DollarSign, X } from 'lucide-react';
import { getAllVentas, deleteVenta, createPago, getPagosByVenta, type Venta, type Pago, type CreatePagoDto } from '../../services/ventaService';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import '../compras/compras.css';
import '../../styles/page.css';
import { useSorting } from '../../hooks/useSorting';
import { SortableTh } from '../../components/SortableTh';

interface VentaDetail extends Venta {
    detalles?: any[];
}

export default function VerVentas() {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [ventas, setVentas] = useState<VentaDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteVentaState, setDeleteVentaState] = useState<Venta | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const pageIds = paginatedVentas.map(v => v.venta_id);
        const allSelected = pageIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            allSelected ? pageIds.forEach(id => next.delete(id)) : pageIds.forEach(id => next.add(id));
            return next;
        });
    };

    const handleBulkDelete = async () => {
        setBulkDeleting(true);
        try {
            await Promise.all([...selectedIds].map(id => deleteVenta(id, auth?.token)));
            setVentas(prev => prev.filter(v => !selectedIds.has(v.venta_id)));
            setSelectedIds(new Set());
            setShowBulkDeleteModal(false);
        } catch (err: any) {
            alert(err?.message ?? 'Error al eliminar las ventas seleccionadas');
        } finally {
            setBulkDeleting(false);
        }
    };
    
    // Estados para modal de pagos
    const [pagoModal, setPagoModal] = useState<{ venta: Venta | null; pagos: Pago[] }>({ venta: null, pagos: [] });
    const [montoPago, setMontoPago] = useState<number>(0);
    const [observacionesPago, setObservacionesPago] = useState('');
    const [registrandoPago, setRegistrandoPago] = useState(false);

    useEffect(() => {
        document.title = 'Grupo Vicorsa | Ver Ventas';
        loadVentas();
    }, []);

    const loadVentas = async () => {
        try {
            setLoading(true);
            const data = await getAllVentas(auth?.token);
            setVentas(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar las ventas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteVentaState) return;
        setDeleting(true);
        try {
            await deleteVenta(deleteVentaState.venta_id, auth?.token);
            setVentas(ventas.filter(v => v.venta_id !== deleteVentaState.venta_id));
            setDeleteVentaState(null);
        } catch (err) {
            setError('Error al eliminar la venta');
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    const handleOpenPagoModal = async (venta: Venta) => {
        try {
            const pagos = await getPagosByVenta(venta.venta_id, auth?.token);
            setPagoModal({ venta, pagos });
            setMontoPago(0);
            setObservacionesPago('');
        } catch (err) {
            setError('Error al cargar los pagos');
            console.error(err);
        }
    };

    const handleRegistrarPago = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pagoModal.venta || montoPago <= 0) return;

        setRegistrandoPago(true);
        try {
            const pagoDto: CreatePagoDto = {
                venta_id: pagoModal.venta.venta_id,
                monto: montoPago,
                fecha_pago: new Date().toISOString(),
                observaciones: observacionesPago || undefined,
            };

            await createPago(pagoDto, auth?.token);
            
            // Recargar ventas para actualizar montos
            await loadVentas();
            
            // Cerrar modal
            setPagoModal({ venta: null, pagos: [] });
            setMontoPago(0);
            setObservacionesPago('');
            
            alert('¡Pago registrado exitosamente!');
        } catch (err: any) {
            setError(err?.message || 'Error al registrar el pago');
            console.error(err);
        } finally {
            setRegistrandoPago(false);
        }
    };

    const exportToExcel = () => {
        const dataToExport = ventas.map(venta => ({
            'ID': venta.venta_id,
            'Cliente': venta.cliente?.nombre || 'N/A',
            'Tipo': venta.tipo_venta,
            'Estado': venta.estado,
            'Fecha': new Date(venta.fecha_venta).toLocaleDateString('es-ES'),
            'Subtotal (Bs.)': parseFloat(venta.subtotal as any).toFixed(2),
            'Descuento (Bs.)': parseFloat(venta.descuento as any).toFixed(2),
            'Total (Bs.)': parseFloat(venta.total as any).toFixed(2),
            'Pagado (Bs.)': parseFloat(venta.monto_pagado as any).toFixed(2),
            'Adeudado (Bs.)': parseFloat(venta.monto_adeudado as any).toFixed(2),
            'Artículos': venta.detalles?.length || 0,
            'Observaciones': venta.observaciones || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

        worksheet['!cols'] = [
            { wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
        ];

        const today = new Date();
        const fileName = `ventas_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const filteredVentas = ventas.filter(venta => 
        venta.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.venta_id.toString().includes(searchTerm) ||
        venta.tipo_venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const { sorted: sortedVentas, sort: sortField, handleSort } = useSorting(filteredVentas, (item, key) => {
        if (key === 'cliente') return item.cliente?.nombre ?? '';
        return (item as any)[key];
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVentas = sortedVentas.slice(startIndex, startIndex + itemsPerPage);
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Ver Ventas</h2>
                    <p className="page-subtitle">Gestiona el historial de ventas</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-export" onClick={exportToExcel} disabled={ventas.length === 0} title="Exportar a Excel">
                        <Download size={18} /> Exportar
                    </button>
                    <button className="btn-refresh" onClick={loadVentas} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> Actualizar
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/ventas/realizar')}>
                        <Plus size={18} /> Nueva Venta
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="table-container">
                <div className="table-controls">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, ID, tipo u observaciones..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="table-info">
                        {filteredVentas.length} de {ventas.length} venta(s)
                    </div>
                    {selectedIds.size > 0 && (
                        <button className="btn-bulk-delete" onClick={() => setShowBulkDeleteModal(true)}>
                            <Trash2 size={16} /> Eliminar seleccionados ({selectedIds.size})
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading-state">Cargando ventas...</div>
                ) : error ? (
                    <div className="error-state">{error}</div>
                ) : filteredVentas.length === 0 ? (
                    <div className="empty-state">No hay ventas registradas.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="check-col">
                                    <input
                                        type="checkbox"
                                        checked={paginatedVentas.length > 0 && paginatedVentas.every(v => selectedIds.has(v.venta_id))}
                                        onChange={toggleSelectAll}
                                        title="Seleccionar todos"
                                    />
                                </th>
                                <SortableTh label="ID" sortKey="venta_id" sort={sortField} onSort={handleSort} />
                                <SortableTh label="Cliente" sortKey="cliente" sort={sortField} onSort={handleSort} />
                                <SortableTh label="Tipo" sortKey="tipo_venta" sort={sortField} onSort={handleSort} />
                                <th>Factura</th>
                                <SortableTh label="Estado" sortKey="estado" sort={sortField} onSort={handleSort} />
                                <SortableTh label="Fecha" sortKey="fecha_venta" sort={sortField} onSort={handleSort} />
                                <SortableTh label="Total (Bs.)" sortKey="total" sort={sortField} onSort={handleSort} />
                                <th>Adeudado (Bs.)</th>
                                <th>Artículos</th>
                                <th className="actions-col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedVentas.map(venta => (
                                <tr key={venta.venta_id} className={selectedIds.has(venta.venta_id) ? 'row-selected' : ''}>
                                    <td className="check-col">
                                        <input type="checkbox" checked={selectedIds.has(venta.venta_id)} onChange={() => toggleSelect(venta.venta_id)} />
                                    </td>
                                    <td className="id-col">#{venta.venta_id}</td>
                                    <td>{venta.cliente?.nombre || 'Cliente General'}</td>
                                    <td>
                                        <span className={`badge ${venta.tipo_venta === 'CONTADO' ? 'badge-success' : 'badge-warning'}`}>
                                            {venta.tipo_venta}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${venta.con_factura ? 'badge-info' : 'badge-secondary'}`}>
                                            {venta.con_factura ? '✓ Con Factura' : 'Sin Factura'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${venta.estado === 'COMPLETADO' ? 'badge-success' : 'badge-warning'}`}>
                                            {venta.estado === 'COMPLETADO' ? '✓ Completado' : '⏳ Pendiente'}
                                        </span>
                                    </td>
                                    <td>{new Date(venta.fecha_venta).toLocaleDateString('es-ES')}</td>
                                    <td className="text-right">{parseFloat(venta.total as any).toFixed(2)}</td>
                                    <td className="text-right" style={{ color: venta.monto_adeudado > 0 ? 'var(--warning)' : 'var(--success)' }}>
                                        <strong>{parseFloat(venta.monto_adeudado as any).toFixed(2)}</strong>
                                    </td>
                                    <td className="text-center">{venta.detalles?.length || 0}</td>
                                    <td className="actions-col">
                                        {venta.estado === 'PENDIENTE' && (
                                            <button className="action-btn success" onClick={() => handleOpenPagoModal(venta)} title="Registrar pago">
                                                <DollarSign size={16} />
                                            </button>
                                        )}
                                        <button className="action-btn view" onClick={() => navigate(`/ventas/${venta.venta_id}`)} title="Ver detalles">
                                            <Eye size={16} />
                                        </button>
                                        <button className="action-btn delete" onClick={() => setDeleteVentaState(venta)} title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredVentas.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {deleteVentaState && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <h3>¿Eliminar venta?</h3>
                        <p>Se eliminará la venta #{deleteVentaState.venta_id} del sistema. Esta acción no se puede deshacer.</p>
                        <div className="modal-actions">
                            <button className="btn outline" onClick={() => setDeleteVentaState(null)}>Cancelar</button>
                            <button className="btn danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkDeleteModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <h3>¿Eliminar {selectedIds.size} venta(s)?</h3>
                        <p>Esta acción no se puede deshacer. Se eliminarán permanentemente las ventas seleccionadas.</p>
                        <div className="modal-actions">
                            <button className="btn outline" onClick={() => setShowBulkDeleteModal(false)} disabled={bulkDeleting}>Cancelar</button>
                            <button className="btn danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                                {bulkDeleting ? 'Eliminando...' : `Sí, eliminar ${selectedIds.size}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pagoModal.venta && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setPagoModal({ venta: null, pagos: [] })}>
                    <div className="modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Registrar Pago - Venta #{pagoModal.venta.venta_id}</h3>
                            <button className="modal-close" onClick={() => setPagoModal({ venta: null, pagos: [] })}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-2)', borderRadius: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Subtotal</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Bs {parseFloat(pagoModal.venta.subtotal as any).toFixed(2)}</p>
                                    </div>
                                    {parseFloat(pagoModal.venta.descuento as any) > 0 && (
                                        <div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Descuento</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--danger)' }}>- Bs {parseFloat(pagoModal.venta.descuento as any).toFixed(2)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Bs {parseFloat(pagoModal.venta.total as any).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Pagado</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--success)' }}>Bs {parseFloat(pagoModal.venta.monto_pagado as any).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Adeudado</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--warning)' }}>Bs {parseFloat(pagoModal.venta.monto_adeudado as any).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {pagoModal.pagos.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Historial de Pagos</h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Monto (Bs.)</th>
                                                <th>Observaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagoModal.pagos.map((pago, idx) => (
                                                <tr key={idx}>
                                                    <td>{new Date(pago.fecha_pago).toLocaleDateString('es-ES')}</td>
                                                    <td>Bs {parseFloat(pago.monto as any).toFixed(2)}</td>
                                                    <td>{pago.observaciones || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <form onSubmit={handleRegistrarPago}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Nuevo Pago</h4>
                                <div className="form-grid">
                                    <label className="form-field">
                                        <span className="label-text">Monto a Pagar (Bs.) *</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            onChange={(e) => setMontoPago(parseFloat(e.target.value) || 0)}
                                            min="0.01"
                                            max={pagoModal.venta.monto_adeudado}
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                        />
                                        {montoPago > pagoModal.venta.monto_adeudado && (
                                            <small style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                                                El monto no puede exceder la deuda
                                            </small>
                                        )}
                                    </label>
                                    <label className="form-field span-2">
                                        <span className="label-text">Observaciones</span>
                                        <textarea
                                            className="form-input"
                                            value={observacionesPago}
                                            onChange={(e) => setObservacionesPago(e.target.value)}
                                            rows={3}
                                            placeholder="Notas sobre el pago..."
                                        />
                                    </label>
                                </div>
                                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setPagoModal({ venta: null, pagos: [] })}>
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={registrandoPago || montoPago <= 0 || montoPago > pagoModal.venta.monto_adeudado}
                                    >
                                        {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
