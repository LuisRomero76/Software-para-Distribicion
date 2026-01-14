import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Package, DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';
import { getVentaById, getPagosByVenta, type Venta, type Pago } from '../../services/ventaService';
import { useAuth } from '../../context/AuthContext';
import '../compras/compras.css';
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

export default function VentaDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [venta, setVenta] = useState<Venta | null>(null);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Grupo Vicorsa | Detalles de Venta';
        loadVentaDetails();
    }, [id]);

    const loadVentaDetails = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            const [ventaData, pagosData] = await Promise.all([
                getVentaById(parseInt(id), auth?.token),
                getPagosByVenta(parseInt(id), auth?.token),
            ]);
            setVenta(ventaData);
            setPagos(pagosData);
            setError(null);
        } catch (err) {
            setError('Error al cargar los detalles de la venta');
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

    if (error || !venta) {
        return (
            <div className="page-container">
                <div className="alert alert-error">
                    <span>{error || 'Venta no encontrada'}</span>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/ventas')}>
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
                    <button className="btn-secondary" onClick={() => navigate('/ventas')} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="page-title">Detalles de Venta #{venta.venta_id}</h2>
                        <p className="page-subtitle">Información completa de la venta</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`badge ${venta.tipo_venta === 'CONTADO' ? 'badge-success' : 'badge-warning'}`}>
                        {venta.tipo_venta}
                    </span>
                    <span className={`badge ${venta.estado === 'COMPLETADO' ? 'badge-success' : 'badge-warning'}`}>
                        {venta.estado === 'COMPLETADO' ? '✓ Completado' : '⏳ Pendiente'}
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
                            Cliente
                        </div>
                        <div className="info-value">{venta.cliente?.nombre || 'Cliente General'}</div>
                        {venta.cliente && (
                            <div className="info-secondary">
                                {venta.cliente.nit_ci && <span>NIT/CI: {venta.cliente.nit_ci}</span>}
                                {venta.cliente.telefono && <span> | Tel: {venta.cliente.telefono}</span>}
                            </div>
                        )}
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <Calendar size={16} />
                            Fecha de Venta
                        </div>
                        <div className="info-value">
                            {formatearFecha(venta.fecha_venta)}
                        </div>
                        <div className="info-secondary">
                            {formatearHora((venta as any).createdAt || venta.fecha_venta)}
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <CreditCard size={16} />
                            Tipo de Venta
                        </div>
                        <div className="info-value">{venta.tipo_venta}</div>
                        <div className="info-secondary">
                            {venta.estado === 'COMPLETADO' ? (
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

                    {venta.observaciones && (
                        <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                            <div className="info-label">
                                <FileText size={16} />
                                Observaciones
                            </div>
                            <div className="info-value" style={{ fontSize: '0.95rem', fontWeight: '400' }}>
                                {venta.observaciones}
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
                        <div className="financial-label">Total de la Venta</div>
                        <div className="financial-value">Bs {parseFloat(venta.total as any).toFixed(2)}</div>
                    </div>

                    <div className="financial-card pagado">
                        <div className="financial-label">Monto Pagado</div>
                        <div className="financial-value">Bs {parseFloat(venta.monto_pagado as any).toFixed(2)}</div>
                    </div>

                    <div className="financial-card adeudado">
                        <div className="financial-label">Monto Adeudado</div>
                        <div className="financial-value" style={{ color: venta.monto_adeudado > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            Bs {parseFloat(venta.monto_adeudado as any).toFixed(2)}
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

            {/* Productos Vendidos */}
            <div className="form-section">
                <h3 className="section-title">
                    <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Productos Vendidos
                </h3>
                {venta.detalles && venta.detalles.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Lote</th>
                                <th>Modo</th>
                                <th className="text-center">Cantidad</th>
                                <th className="text-right">Precio Unitario</th>
                                <th className="text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {venta.detalles.map((detalle: any, idx: number) => {
                                const producto = detalle.lote?.producto;
                                const cantPorPaquete = producto?.cant_por_paquete || 1;
                                
                                // Usar el modo que viene del backend
                                const esPaquete = detalle.modo === 'paquete';
                                const cantidadMostrar = esPaquete 
                                    ? `${detalle.cantidad} paquete${detalle.cantidad !== 1 ? 's' : ''}`
                                    : `${detalle.cantidad} unidad${detalle.cantidad !== 1 ? 'es' : ''}`;                                
                                return (
                                    <tr key={idx}>
                                        <td>
                                            <strong>{producto?.nombre || 'N/A'}</strong>
                                            {esPaquete && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {cantPorPaquete} unidades/paquete
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className="badge badge-info">Lote #{detalle.lote_id}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${esPaquete ? 'badge-warning' : 'badge-success'}`}>
                                                {esPaquete ? '📦 Paquete' : '🔢 Unidad'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <strong>{cantidadMostrar}</strong>
                                        </td>
                                        <td className="text-right">Bs {parseFloat(detalle.precio_venta_real).toFixed(2)}</td>
                                        <td className="text-right">
                                            <strong>Bs {parseFloat(detalle.subtotal).toFixed(2)}</strong>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr style={{ fontWeight: '600', background: 'var(--bg-2)' }}>
                                <td colSpan={5} className="text-right">TOTAL:</td>
                                <td className="text-right" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                                    Bs {parseFloat(venta.total as any).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">No hay productos en esta venta</div>
                )}
            </div>

            {/* Historial de Pagos */}
            {venta.tipo_venta === 'CREDITO' && (
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
                                    <tr key={pago.pago_id}>
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
                                        Bs {parseFloat(venta.monto_pagado as any).toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            No se han registrado pagos para esta venta
                        </div>
                    )}
                </div>
            )}

            {/* Acciones */}
            <div className="form-actions">
                <button className="btn-secondary" onClick={() => navigate('/ventas')}>
                    <ArrowLeft size={18} /> Volver a Ventas
                </button>
            </div>
        </div>
    );
}
