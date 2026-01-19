import { useState, useEffect } from 'react';
import { 
    type Compra, 
    type PagoCompra,
    getAllCompras, 
    deleteCompra as deleteCompraService,
    getPagosByCompra,
    createPagoCompra
} from '../../services/compraService';
import { Trash2, Eye, Plus, Search, RefreshCw, Download, DollarSign, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import '../../styles/page.css';
import '../../styles/table.css';
import './compras.css';

interface CompraDetail extends Compra {
    detalles?: any[];
}

export default function VerCompras() {
    const navigate = useNavigate();
    const [compras, setCompras] = useState<CompraDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteCompra, setDeleteCompra] = useState<Compra | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    
    // Estados para modal de pagos
    const [pagoModal, setPagoModal] = useState<{ compra: Compra | null; pagos: PagoCompra[] }>({ compra: null, pagos: [] });
    const [montoPago, setMontoPago] = useState<number>(0);
    const [observacionesPago, setObservacionesPago] = useState('');
    const [registrandoPago, setRegistrandoPago] = useState(false);

    useEffect(() => {
        document.title = 'Grupo Vicorsa | Ver Compras';
        loadCompras();
    }, []);

    const loadCompras = async () => {
        try {
            setLoading(true);
            const data = await getAllCompras();
            setCompras(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar las compras');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteCompra) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteCompraService(deleteCompra.compra_id);
            setCompras(compras.filter(c => c.compra_id !== deleteCompra.compra_id));
            setDeleteCompra(null);
        } catch (err: any) {
            const errorMessage = err?.message || err?.response?.data?.message || 'Error al eliminar la compra';
            setDeleteError(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    const handleOpenPagoModal = async (compra: Compra) => {
        try {
            const pagosData = await getPagosByCompra(compra.compra_id);
            setPagoModal({ compra, pagos: pagosData });
            setMontoPago(0);
            setObservacionesPago('');
        } catch (err) {
            console.error('Error al cargar pagos:', err);
            setPagoModal({ compra, pagos: [] });
        }
    };

    const handleRegistrarPago = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pagoModal.compra || montoPago <= 0) return;

        setRegistrandoPago(true);
        try {
            await createPagoCompra({
                compra_id: pagoModal.compra.compra_id,
                monto: montoPago,
                fecha_pago: new Date().toISOString().split('T')[0],
                observaciones: observacionesPago || undefined,
            });

            // Recargar compras y pagos
            await loadCompras();
            const pagosActualizados = await getPagosByCompra(pagoModal.compra.compra_id);
            const compraActualizada = compras.find(c => c.compra_id === pagoModal.compra?.compra_id);
            
            if (compraActualizada) {
                setPagoModal({ compra: compraActualizada, pagos: pagosActualizados });
            }
            
            setMontoPago(0);
            setObservacionesPago('');
        } catch (err) {
            console.error('Error al registrar pago:', err);
            alert('Error al registrar el pago');
        } finally {
            setRegistrandoPago(false);
        }
    };

    const exportToExcel = () => {
        const dataToExport = compras.map(compra => ({
            'ID': compra.compra_id,
            'Proveedor': compra.proveedor?.nombre || 'N/A',
            'Fecha': new Date(compra.fecha_compra).toLocaleDateString('es-ES'),
            'Tipo': compra.tipo_compra,
            'Estado': compra.estado,
            'Total (Bs.)': parseFloat(compra.total as any).toFixed(2),
            'Monto Pagado (Bs.)': parseFloat(compra.monto_pagado as any).toFixed(2),
            'Monto Adeudado (Bs.)': parseFloat(compra.monto_adeudado as any).toFixed(2),
            'Artículos': compra.detalles?.length || 0,
            'Observaciones': compra.observaciones || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Compras');

        worksheet['!cols'] = [
            { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
        ];

        const today = new Date();
        const fileName = `compras_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const filteredCompras = compras.filter(compra => 
        compra.proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.compra_id.toString().includes(searchTerm) ||
        compra.tipo_compra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCompras = filteredCompras.slice(startIndex, startIndex + itemsPerPage);
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Ver Compras</h2>
                    <p className="page-subtitle">Gestiona el historial de compras</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-export" onClick={exportToExcel} disabled={compras.length === 0} title="Exportar a Excel">
                        <Download size={18} /> Exportar
                    </button>
                    <button className="btn-refresh" onClick={loadCompras} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> Actualizar
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/compras/realizar')}>
                        <Plus size={18} /> Nueva Compra
                    </button>
                </div>
            </div>

            <div className="table-container">
                <div className="table-controls">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por proveedor, ID u observaciones..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="table-info">
                        {filteredCompras.length} de {compras.length} compra(s)
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Cargando compras...</div>
                ) : error ? (
                    <div className="error-state">{error}</div>
                ) : filteredCompras.length === 0 ? (
                    <div className="empty-state">No hay compras registradas.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Proveedor</th>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th className="text-right">Total<br/>(Bs.)</th>
                                <th className="text-right">Pagado<br/>(Bs.)</th>
                                <th className="text-right">Adeudado<br/>(Bs.)</th>
                                <th className="actions-col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCompras.map(compra => (
                                <tr key={compra.compra_id}>
                                    <td className="id-col">#{compra.compra_id}</td>
                                    <td>{compra.proveedor?.nombre || '-'}</td>
                                    <td>
                                        <div>{new Date(compra.fecha_compra).toLocaleDateString('es-ES')}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {new Date(compra.createdAt || compra.fecha_compra).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${compra.tipo_compra === 'CONTADO' ? 'badge-success' : 'badge-warning'}`}>
                                            {compra.tipo_compra}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${compra.estado === 'COMPLETADO' ? 'badge-success' : 'badge-warning'}`}>
                                            {compra.estado}
                                        </span>
                                    </td>
                                    <td className="text-right">{parseFloat(compra.total as any).toFixed(2)}</td>
                                    <td className="text-right">{parseFloat(compra.monto_pagado as any).toFixed(2)}</td>
                                    <td className="text-right">
                                        <span style={{ color: compra.monto_adeudado > 0 ? 'var(--warning)' : 'inherit' }}>
                                            {parseFloat(compra.monto_adeudado as any).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button 
                                            className="action-btn view" 
                                            onClick={() => navigate(`/compras/${compra.compra_id}`)} 
                                            title="Ver detalles"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {compra.tipo_compra === 'CREDITO' && compra.monto_adeudado > 0 && (
                                            <button 
                                                className="action-btn edit" 
                                                onClick={() => handleOpenPagoModal(compra)} 
                                                title="Registrar pago"
                                            >
                                                <DollarSign size={16} />
                                            </button>
                                        )}
                                        <button className="action-btn delete" onClick={() => setDeleteCompra(compra)} title="Eliminar">
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
                    totalItems={filteredCompras.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Modal de Pagos */}
            {pagoModal.compra && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setPagoModal({ compra: null, pagos: [] })}>
                    <div className="modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Registrar Pago - Compra #{pagoModal.compra.compra_id}</h3>
                            <button className="modal-close" onClick={() => setPagoModal({ compra: null, pagos: [] })}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Resumen de la Compra */}
                            <div className="payment-summary">
                                <div className="payment-info">
                                    <span className="label">Total:</span>
                                    <span className="value">Bs {parseFloat(pagoModal.compra.total as any).toFixed(2)}</span>
                                </div>
                                <div className="payment-info">
                                    <span className="label">Pagado:</span>
                                    <span className="value success">Bs {parseFloat(pagoModal.compra.monto_pagado as any).toFixed(2)}</span>
                                </div>
                                <div className="payment-info">
                                    <span className="label">Adeudado:</span>
                                    <span className="value warning">Bs {parseFloat(pagoModal.compra.monto_adeudado as any).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Formulario de Nuevo Pago */}
                            {pagoModal.compra.monto_adeudado > 0 && (
                                <form onSubmit={handleRegistrarPago} className="payment-form">
                                    <h4>Nuevo Pago</h4>
                                    <div className="form-grid">
                                        <label className="form-field">
                                            <span className="label-text">Monto a Pagar (Bs.) *</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={pagoModal.compra.monto_adeudado}
                                                value={montoPago || ''}
                                                onChange={e => setMontoPago(parseFloat(e.target.value))}
                                                className="form-input"
                                                required
                                            />
                                            <small className="field-hint">Máximo: Bs {parseFloat(pagoModal.compra.monto_adeudado as any).toFixed(2)}</small>
                                        </label>
                                        <label className="form-field span-2">
                                            <span className="label-text">Observaciones</span>
                                            <textarea
                                                value={observacionesPago}
                                                onChange={e => setObservacionesPago(e.target.value)}
                                                className="form-input"
                                                rows={2}
                                                placeholder="Notas adicionales (opcional)"
                                            />
                                        </label>
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={registrandoPago || montoPago <= 0}>
                                        {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
                                    </button>
                                </form>
                            )}

                            {/* Historial de Pagos */}
                            {pagoModal.pagos.length > 0 && (
                                <div className="payment-history">
                                    <h4>Historial de Pagos</h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Fecha</th>
                                                <th className="text-right">Monto (Bs.)</th>
                                                <th>Observaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagoModal.pagos.map((pago, idx) => (
                                                <tr key={pago.pago_compra_id}>
                                                    <td>{idx + 1}</td>
                                                    <td>{new Date(pago.fecha_pago).toLocaleDateString('es-ES')}</td>
                                                    <td className="text-right">Bs {parseFloat(pago.monto as any).toFixed(2)}</td>
                                                    <td>{pago.observaciones || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setPagoModal({ compra: null, pagos: [] })}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {deleteCompra && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <h3>{deleteError ? 'Error al Eliminar' : '¿Eliminar compra?'}</h3>
                        
                        {deleteError ? (
                            <>
                                <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                                    <span>{deleteError}</span>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn primary" onClick={() => {
                                        setDeleteCompra(null);
                                        setDeleteError(null);
                                    }}>
                                        Entendido
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p>Se eliminará la compra #{deleteCompra.compra_id} del sistema.</p>
                                <div className="modal-actions">
                                    <button className="btn outline" onClick={() => setDeleteCompra(null)} disabled={deleting}>
                                        Cancelar
                                    </button>
                                    <button className="btn danger" onClick={handleDelete} disabled={deleting}>
                                        {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
