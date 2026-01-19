import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Package, DollarSign, Calendar, FileText, Building2 } from 'lucide-react';
import { getProveedorById, type Proveedor } from '../../services/proveedorService';
import { type Compra } from '../../services/compraService';
import { request } from '../../lib/http';
import './compras.css';
import '../../styles/page.css';

// Helper para formatear fecha
const formatearFecha = (fecha: string | Date) => {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    if (fechaStr.includes('T')) {
        const date = new Date(fechaStr);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${day} de ${meses[month]} de ${year}`;
    } else {
        const [year, month, day] = fechaStr.split('-').map(Number);
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${day} de ${meses[month - 1]} de ${year}`;
    }
};

export default function ProveedorDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [proveedor, setProveedor] = useState<Proveedor | null>(null);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Grupo Vicorsa | Detalles del Proveedor';
        loadProveedorDetails();
    }, [id]);

    const loadProveedorDetails = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            const proveedorData = await getProveedorById(parseInt(id));
            setProveedor(proveedorData);

            // Obtener compras del proveedor usando el endpoint específico
            const comprasData = await request<Compra[]>(`/compra/proveedor/${id}`, { method: 'GET' });
            setCompras(comprasData);
            
            setError(null);
        } catch (err) {
            setError('Error al cargar los detalles del proveedor');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Calcular estadísticas
    const calcularEstadisticas = () => {
        const totalCompras = compras.length;
        const totalGastado = compras.reduce((sum, compra) => sum + parseFloat(compra.total as any), 0);
        const totalAdeudado = compras.reduce((sum, compra) => sum + parseFloat(compra.monto_adeudado as any), 0);
        const comprasPendientes = compras.filter(c => c.estado === 'PENDIENTE').length;
        
        return { totalCompras, totalGastado, totalAdeudado, comprasPendientes };
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-state">Cargando detalles del proveedor...</div>
            </div>
        );
    }

    if (error || !proveedor) {
        return (
            <div className="page-container">
                <div className="alert alert-error">
                    <span>{error || 'Proveedor no encontrado'}</span>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/compras/proveedores')}>
                    <ArrowLeft size={18} /> Volver
                </button>
            </div>
        );
    }

    const stats = calcularEstadisticas();

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => navigate('/compras/proveedores')} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="page-title">
                            <Building2 size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            {proveedor.nombre}
                        </h2>
                        <p className="page-subtitle">Información completa del proveedor</p>
                    </div>
                </div>
            </div>

            {/* Información del Proveedor */}
            <div className="form-section">
                <h3 className="section-title">
                    <User size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Información del Proveedor
                </h3>
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div className="info-card">
                        <div className="info-label">
                            <Building2 size={16} />
                            Nombre/Empresa
                        </div>
                        <div className="info-value">{proveedor.nombre}</div>
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <FileText size={16} />
                            NIT/CI
                        </div>
                        <div className="info-value">{proveedor.nit_ci || 'No registrado'}</div>
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <Mail size={16} />
                            Email
                        </div>
                        <div className="info-value">{proveedor.email || 'No registrado'}</div>
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <Phone size={16} />
                            Teléfono
                        </div>
                        <div className="info-value">{proveedor.telefono || 'No registrado'}</div>
                    </div>

                    <div className="info-card">
                        <div className="info-label">
                            <MapPin size={16} />
                            Ciudad
                        </div>
                        <div className="info-value">{proveedor.ciudad || 'No registrado'}</div>
                    </div>

                    {proveedor.createdAt && (
                        <div className="info-card">
                            <div className="info-label">
                                <Calendar size={16} />
                                Fecha de Registro
                            </div>
                            <div className="info-value">{formatearFecha(proveedor.createdAt)}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Estadísticas */}
            <div className="form-section">
                <h3 className="section-title">
                    <DollarSign size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Resumen de Compras
                </h3>
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="financial-card total">
                        <div className="financial-label">Total de Compras</div>
                        <div className="financial-value">{stats.totalCompras}</div>
                    </div>

                    <div className="financial-card pagado">
                        <div className="financial-label">Total Gastado</div>
                        <div className="financial-value">Bs {stats.totalGastado.toFixed(2)}</div>
                    </div>

                    <div className="financial-card adeudado">
                        <div className="financial-label">Total Adeudado</div>
                        <div className="financial-value" style={{ color: stats.totalAdeudado > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            Bs {stats.totalAdeudado.toFixed(2)}
                        </div>
                    </div>

                    <div className="financial-card pagos">
                        <div className="financial-label">Compras Pendientes</div>
                        <div className="financial-value">{stats.comprasPendientes}</div>
                    </div>
                </div>
            </div>

            {/* Historial de Compras */}
            <div className="form-section">
                <h3 className="section-title">
                    <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Historial de Compras
                </h3>
                {compras.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#ID</th>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th className="text-right">Total</th>
                                <th className="text-right">Pagado</th>
                                <th className="text-right">Adeudado</th>
                                <th className="actions-col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map((compra) => (
                                <tr key={compra.compra_id}>
                                    <td className="id-col">#{compra.compra_id}</td>
                                    <td>{formatearFecha(compra.fecha_compra)}</td>
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
                                    <td className="text-right">
                                        <strong>Bs {parseFloat(compra.total as any).toFixed(2)}</strong>
                                    </td>
                                    <td className="text-right">
                                        Bs {parseFloat(compra.monto_pagado as any).toFixed(2)}
                                    </td>
                                    <td className="text-right">
                                        <span style={{ color: compra.monto_adeudado > 0 ? 'var(--warning)' : 'var(--success)' }}>
                                            Bs {parseFloat(compra.monto_adeudado as any).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button
                                            className="action-btn view"
                                            onClick={() => navigate(`/compras/${compra.compra_id}`)}
                                            title="Ver detalles"
                                        >
                                            <FileText size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        No se han registrado compras con este proveedor
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="form-actions">
                <button className="btn-secondary" onClick={() => navigate('/compras/proveedores')}>
                    <ArrowLeft size={18} /> Volver a Proveedores
                </button>
            </div>
        </div>
    );
}
