import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { getAllVentas, deleteVenta, type Venta } from '../../services/ventaService';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import '../compras/compras.css';
import '../../styles/page.css';

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
    const [selectedVenta, setSelectedVenta] = useState<VentaDetail | null>(null);

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

    const exportToExcel = () => {
        const dataToExport = ventas.map(venta => ({
            'ID': venta.venta_id,
            'Cliente': venta.cliente?.nombre || 'N/A',
            'Tipo': venta.tipo_venta,
            'Fecha': new Date(venta.fecha_venta).toLocaleDateString('es-ES'),
            'Total (Bs.)': parseFloat(venta.total as any).toFixed(2),
            'Artículos': venta.detalles?.length || 0,
            'Observaciones': venta.observaciones || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

        worksheet['!cols'] = [
            { wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
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

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVentas = filteredVentas.slice(startIndex, startIndex + itemsPerPage);
    
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
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Total (Bs.)</th>
                                <th>Artículos</th>
                                <th className="actions-col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedVentas.map(venta => (
                                <tr key={venta.venta_id}>
                                    <td className="id-col">#{venta.venta_id}</td>
                                    <td>{venta.cliente?.nombre || 'Cliente General'}</td>
                                    <td>
                                        <span className={`badge ${venta.tipo_venta === 'CONTADO' ? 'badge-success' : 'badge-warning'}`}>
                                            {venta.tipo_venta}
                                        </span>
                                    </td>
                                    <td>{new Date(venta.fecha_venta).toLocaleDateString('es-ES')}</td>
                                    <td className="text-right">{parseFloat(venta.total as any).toFixed(2)}</td>
                                    <td className="text-center">{venta.detalles?.length || 0}</td>
                                    <td className="actions-col">
                                        <button className="action-btn view" onClick={() => setSelectedVenta(venta)} title="Ver detalles">
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

            {selectedVenta && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedVenta(null)}>
                    <div className="modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalles de Venta #{selectedVenta.venta_id}</h3>
                            <button className="modal-close" onClick={() => setSelectedVenta(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <label className="form-field">
                                    <span className="label-text">Cliente</span>
                                    <input type="text" className="form-input" value={selectedVenta.cliente?.nombre || 'Cliente General'} disabled />
                                </label>
                                <label className="form-field">
                                    <span className="label-text">Tipo de Venta</span>
                                    <input type="text" className="form-input" value={selectedVenta.tipo_venta} disabled />
                                </label>
                                <label className="form-field">
                                    <span className="label-text">Fecha</span>
                                    <input type="text" className="form-input" value={new Date(selectedVenta.fecha_venta).toLocaleDateString('es-ES')} disabled />
                                </label>
                                <label className="form-field">
                                    <span className="label-text">Total (Bs.)</span>
                                    <input type="text" className="form-input" value={parseFloat(selectedVenta.total as any).toFixed(2)} disabled />
                                </label>
                                <label className="form-field span-2">
                                    <span className="label-text">Observaciones</span>
                                    <textarea className="form-input" value={selectedVenta.observaciones || 'Sin observaciones'} disabled rows={3} />
                                </label>
                            </div>
                            {selectedVenta.detalles && selectedVenta.detalles.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Productos Vendidos</h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Lote</th>
                                                <th>Cantidad</th>
                                                <th>Precio Unit.</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedVenta.detalles.map((detalle: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td>{detalle.lote?.producto?.nombre || 'N/A'}</td>
                                                    <td>Lote #{detalle.lote_id}</td>
                                                    <td>{detalle.cantidad}</td>
                                                    <td>Bs {parseFloat(detalle.precio_venta_real).toFixed(2)}</td>
                                                    <td>Bs {parseFloat(detalle.subtotal).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setSelectedVenta(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}
