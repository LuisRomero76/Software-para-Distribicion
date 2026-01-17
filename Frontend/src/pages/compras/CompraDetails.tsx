import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Package, DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';
import { getCompraById, getPagosByCompra, type Compra, type PagoCompra } from '../../services/compraService';
import './compras.css';
import '../../styles/page.css';

// Helper para formatear fecha - extrae directamente del string ISO para evitar problemas de zona horaria
const formatearFecha = (fecha: string | Date) => {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    // Si es solo fecha (YYYY-MM-DD), extraer directamente
    if (fechaStr.includes('T')) {
        const date = new Date(fechaStr);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const day = date.getDate();
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${day} de ${meses[month]} de ${year}`;
    } else {
        // Formato YYYY-MM-DD - extraer directamente sin conversión
        const [year, month, day] = fechaStr.split('-').map(Number);
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${day} de ${meses[month - 1]} de ${year}`;
    }
};

// Helper para formatear hora - extrae del timestamp sin conversión de zona horaria
const formatearHora = (fecha: string | Date) => {
    const date = new Date(fecha);
    
    // Usar toLocaleTimeString con zona horaria de Bolivia (UTC-4)
    const timeString = date.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/La_Paz'
    });
    
    return timeString;
};

export default function CompraDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [compra, setCompra] = useState<Compra | null>(null);
    const [pagos, setPagos] = useState<PagoCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Grupo Vicorsa | Detalles de Compra';
        loadCompraDetails();
    }, [id]);

    const loadCompraDetails = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            const [compraData, pagosData] = await Promise.all([
                getCompraById(parseInt(id)),
                getPagosByCompra(parseInt(id)),
            ]);
            setCompra(compraData);
            setPagos(pagosData);
            setError(null);
        } catch (err) {
            setError('Error al cargar los detalles de la compra');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-state">Cargando detalles...</div>
            </div>
        );
    }

    if (error || !compra) {
        return (
            <div className="page-container">
                <div className="alert alert-error">
                    <span>{error || 'Compra no encontrada'}</span>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/compras')}>
                    <ArrowLeft size={18} /> Volver
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => navigate('/compras')} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="page-title">Detalles de Compra #{compra.compra_id}</h2>
                        <p className="page-subtitle">Información completa de la compra</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`badge ${compra.tipo_compra === 'CONTADO' ? 'badge-success' : 'badge-warning'}`}>
                        {compra.tipo_compra}
                    </span>
                    <span className={`badge ${compra.estado === 'COMPLETADO' ? 'badge-success' : 'badge-warning'}`}>
                        {compra.estado === 'COMPLETADO' ? '✓ Completado' : '⏳ Pendiente'}
                    </span>
                </div>
            </div>

            {/* Información General */}
            <div className="form-section">
                <h3 className="section-title">
                    <FileText size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Información General
                </h3>
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div className="info-card">
                        <div className="info-label">
                            <User size={16} />
                            Proveedor
                        </div>
                        <div className="info-value">{compra.proveedor?.nombre || 'Sin Proveedor'}</div>
                        {compra.proveedor && (
                            <div className="info-secondary">
                                {compra.proveedor.email && <span>Email: {compra.proveedor.email}</span>}
                                {compra.proveedor.telefono && <span> | Tel: {compra.proveedor.telefono}</span>}
                            </div>
                        )}
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <Calendar size={16} />
                            Fecha de Compra
                        </div>
                        <div className="info-value">
                            {formatearFecha(compra.fecha_compra)}
                        </div>
                        <div className="info-secondary">
                            {formatearHora((compra as any).createdAt || compra.fecha_compra)}
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <CreditCard size={16} />
                            Tipo de Compra
                        </div>
                        <div className="info-value">{compra.tipo_compra}</div>
                        <div className="info-secondary">
                            {compra.estado === 'COMPLETADO' ? (
                                <span style={{ color: 'var(--success)' }}>
                                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                    Pagado
                                </span>
                            ) : (
                                <span style={{ color: 'var(--warning)' }}>
                                    <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                    Pago pendiente
                                </span>
                            )}
                        </div>
                    </div>

                    {compra.observaciones && (
                        <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                            <div className="info-label">
                                <FileText size={16} />
                                Observaciones
                            </div>
                            <div className="info-value" style={{ fontSize: '0.95rem', fontWeight: '400' }}>
                                {compra.observaciones}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen Financiero */}
            <div className="form-section">
                <h3 className="section-title">
                    <DollarSign size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Resumen Financiero
                </h3>
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="financial-card total">
                        <div className="financial-label">Total de la Compra</div>
                        <div className="financial-value">Bs {parseFloat(compra.total as any).toFixed(2)}</div>
                    </div>

                    <div className="financial-card pagado">
                        <div className="financial-label">Monto Pagado</div>
                        <div className="financial-value">Bs {parseFloat(compra.monto_pagado as any).toFixed(2)}</div>
                    </div>

                    <div className="financial-card adeudado">
                        <div className="financial-label">Monto Adeudado</div>
                        <div className="financial-value" style={{ color: compra.monto_adeudado > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            Bs {parseFloat(compra.monto_adeudado as any).toFixed(2)}
                        </div>
                    </div>

                    {pagos.length > 0 && (
                        <div className="financial-card pagos">
                            <div className="financial-label">Número de Pagos</div>
                            <div className="financial-value">{pagos.length}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Productos Comprados */}
            <div className="form-section">
                <h3 className="section-title">
                    <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Productos Comprados
                </h3>
                {compra.detalles && compra.detalles.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th className="text-center">Cantidad</th>
                                <th className="text-right">Precio Unitario</th>
                                <th className="text-center">Fecha Vencimiento</th>
                                <th className="text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compra.detalles.map((detalle: any, idx: number) => {
                                return (
                                    <tr key={idx}>
                                        <td>
                                            <strong>{detalle.producto?.nombre || 'N/A'}</strong>
                                        </td>
                                        <td className="text-center">
                                            <strong>{detalle.cantidad}</strong>
                                        </td>
                                        <td className="text-right">Bs {parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                        <td className="text-center">
                                            {detalle.fecha_vencimiento ? (
                                                <span className="badge badge-info">
                                                    {formatearFecha(detalle.fecha_vencimiento)}
                                                </span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <strong>Bs {parseFloat(detalle.subtotal).toFixed(2)}</strong>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr style={{ fontWeight: '600', background: 'var(--bg-2)' }}>
                                <td colSpan={4} className="text-right">TOTAL:</td>
                                <td className="text-right" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                                    Bs {parseFloat(compra.total as any).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">No hay productos en esta compra</div>
                )}
            </div>

            {/* Historial de Pagos */}
            {compra.tipo_compra === 'CREDITO' && (
                <div className="form-section">
                    <h3 className="section-title">
                        <DollarSign size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Historial de Pagos
                    </h3>
                    {pagos.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Fecha y Hora</th>
                                    <th className="text-right">Monto</th>
                                    <th>Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagos.map((pago, idx) => (
                                    <tr key={pago.pago_compra_id}>
                                        <td className="id-col">#{idx + 1}</td>
                                        <td>
                                            <div>{formatearFecha(pago.createdAt || new Date().toISOString())}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {formatearHora(pago.createdAt || new Date().toISOString())}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <strong style={{ color: 'var(--success)' }}>
                                                Bs {parseFloat(pago.monto as any).toFixed(2)}
                                            </strong>
                                        </td>
                                        <td>{pago.observaciones || '-'}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: '600', background: 'var(--bg-2)' }}>
                                    <td colSpan={2} className="text-right">TOTAL PAGADO:</td>
                                    <td className="text-right" style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
                                        Bs {parseFloat(compra.monto_pagado as any).toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            No se han registrado pagos para esta compra
                        </div>
                    )}
                </div>
            )}

            {/* Acciones */}
            <div className="form-actions">
                <button className="btn-secondary" onClick={() => navigate('/compras')}>
                    <ArrowLeft size={18} /> Volver a Compras
                </button>
            </div>
        </div>
    );
}
