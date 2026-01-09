import { useState, useEffect } from 'react';
import { type Compra, getAllCompras, deleteCompra as deleteCompraService } from '../../services/compraService';
import { Trash2, Eye, Plus, Search, RefreshCw, Download } from 'lucide-react';
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
    const [selectedCompra, setSelectedCompra] = useState<CompraDetail | null>(null);

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
        try {
            await deleteCompraService(deleteCompra.compra_id);
            setCompras(compras.filter(c => c.compra_id !== deleteCompra.compra_id));
            setDeleteCompra(null);
        } catch (err) {
            setError('Error al eliminar la compra');
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    const exportToExcel = () => {
        const dataToExport = compras.map(compra => ({
            'ID': compra.compra_id,
            'Proveedor': compra.proveedor?.nombre || 'N/A',
            'Fecha': new Date(compra.fecha_compra).toLocaleDateString('es-ES'),
            'Total (Bs.)': parseFloat(compra.total as any).toFixed(2),
            'Artículos': compra.detalles?.length || 0,
            'Observaciones': compra.observaciones || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Compras');

        worksheet['!cols'] = [
            { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
        ];

        const today = new Date();
        const fileName = `compras_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const filteredCompras = compras.filter(compra => 
        compra.proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.compra_id.toString().includes(searchTerm) ||
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
                                <th>Total<br/>(Bs.)</th>
                                <th>Artículos</th>
                                <th>Observaciones</th>
                                <th className="actions-col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCompras.map(compra => (
                                <tr key={compra.compra_id}>
                                    <td className="id-col">#{compra.compra_id}</td>
                                    <td>{compra.proveedor?.nombre || '-'}</td>
                                    <td>{new Date(compra.fecha_compra).toLocaleDateString('es-ES')}</td>
                                    <td>{parseFloat(compra.total as any).toFixed(2)}</td>
                                    <td>{compra.detalles?.length || 0}</td>
                                    <td>{compra.observaciones || '-'}</td>
                                    <td className="actions-col">
                                        <button className="action-btn view" onClick={() => setSelectedCompra(compra)} title="Ver detalles">
                                            <Eye size={16} />
                                        </button>
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

            {selectedCompra && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedCompra(null)}>
                    <div className="modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalles de Compra #{selectedCompra.compra_id}</h3>
                            <button className="modal-close" onClick={() => setSelectedCompra(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <label className="form-field">
                                    <span className="label-text">Proveedor</span>
                                    <input type="text" className="form-input" value={selectedCompra.proveedor?.nombre || 'N/A'} disabled />
                                </label>
                                <label className="form-field">
                                    <span className="label-text">Fecha</span>
                                    <input type="text" className="form-input" value={new Date(selectedCompra.fecha_compra).toLocaleDateString('es-ES')} disabled />
                                </label>
                                <label className="form-field">
                                    <span className="label-text">Total (Bs.)</span>
                                    <input type="text" className="form-input" value={parseFloat(selectedCompra.total as any).toFixed(2)} disabled />
                                </label>
                                <label className="form-field span-2">
                                    <span className="label-text">Observaciones</span>
                                    <textarea className="form-input" value={selectedCompra.observaciones || '-'} disabled rows={2} />
                                </label>
                            </div>
                            {selectedCompra.detalles && selectedCompra.detalles.length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>Productos</h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Precio Unit. (Bs.)</th>
                                                <th>Subtotal (Bs.)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedCompra.detalles.map((det: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td>{det.producto?.nombre || `Producto #${det.product_id}`}</td>
                                                    <td>{det.cantidad}</td>
                                                    <td>{parseFloat(det.precio_unitario).toFixed(2)}</td>
                                                    <td>{(det.cantidad * parseFloat(det.precio_unitario)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setSelectedCompra(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteCompra && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <h3>¿Eliminar compra?</h3>
                        <p>Se eliminará la compra #{deleteCompra.compra_id} del sistema.</p>
                        <div className="modal-actions">
                            <button className="btn outline" onClick={() => setDeleteCompra(null)}>Cancelar</button>
                            <button className="btn danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
