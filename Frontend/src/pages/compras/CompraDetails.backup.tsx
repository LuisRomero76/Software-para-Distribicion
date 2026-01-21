import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Package, DollarSign, FileText, CheckCircle, Clock, Edit, Trash2, Plus, X } from 'lucide-react';
import { getCompraById, getPagosByCompra, updateCompra, type Compra, type PagoCompra } from '../../services/compraService';
import { getAllProveedores, type Proveedor } from '../../services/proveedorService';
import { getAllProducts, type Producto } from '../../services/productService';
import './compras.css';
import '../../styles/page.css';

// Extend Producto type to include package pricing
interface ProductoExtendido extends Producto {
    precio_compra_paquete?: number;
}

interface CompraProducto {
    id: string;
    producto_id: number;
    cantidad: number;
    precio_compra: number;
    modo: 'unidad' | 'paquete';
    paquetes?: number;
    fecha_vencimiento?: string;
    producto?: ProductoExtendido;
}

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
    
    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    
    // Datos del formulario de edición
    // const [usarProveedorExistente, setUsarProveedorExistente] = useState<boolean>(false);
    const [proveedorId, setProveedorId] = useState<number | null>(null);
    // const [nuevoProveedor, setNuevoProveedor] = useState<Partial<Proveedor>>({
    //     nombre: '',
    //     nit_ci: '',
    //     email: '',
    //     telefono: '',
    //     ciudad: '',
    // });
    const [tipoCompra, setTipoCompra] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
    const [montoPagado, setMontoPagado] = useState<number>(0);
    const [observaciones, setObservaciones] = useState('');
    const [aplicarDescuento, setAplicarDescuento] = useState<boolean>(false);
    const [tipoDescuento, setTipoDescuento] = useState<'bolivianos' | 'porcentaje'>('bolivianos');
    const [valorDescuento, setValorDescuento] = useState<number>(0);
    
    // Datos auxiliares
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<ProductoExtendido[]>([]);
    const [productosCompra, setProductosCompra] = useState<CompraProducto[]>([]);

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
    
    const handleOpenEditModal = async () => {
        if (!compra) return;
        
        try {
            setLoading(true);
            const [prov, prod] = await Promise.all([
                getAllProveedores(),
                getAllProducts(),
            ]);
            setProveedores(prov);
            setProductos(prod as ProductoExtendido[]);
            
            // Pre-popular datos del formulario
            setProveedorId(compra.proveedor?.proveedor_id || null);
            
            setTipoCompra(compra.tipo_compra);
            setMontoPagado(parseFloat(compra.monto_pagado as any) || 0);
            setObservaciones(compra.observaciones || '');
            
            // Configurar descuento si existe
            if (compra.descuento && compra.descuento > 0) {
                setAplicarDescuento(true);
                setValorDescuento(compra.descuento);
                setTipoDescuento('bolivianos'); // Por defecto en bolivianos, podríamos agregar un campo tipo_descuento en el futuro
            } else {
                setAplicarDescuento(false);
                setValorDescuento(0);
            }
            
            // Convertir detalles a formato del formulario
            const productosForm: CompraProducto[] = (compra.detalles || []).map((detalle: any, index: number) => ({
                id: `${index + 1}`,
                producto_id: detalle.producto_id || detalle.producto?.product_id || 0,
                cantidad: detalle.modo === 'paquete' ? detalle.cantidad : detalle.cantidad,
                precio_compra: parseFloat(detalle.precio_unitario),
                modo: detalle.modo || 'unidad',
                paquetes: detalle.modo === 'paquete' ? detalle.cantidad : 1,
                fecha_vencimiento: detalle.fecha_vencimiento || '',
                producto: detalle.producto,
            }));
            
            setProductosCompra(productosForm.length > 0 ? productosForm : [{
                id: '1',
                producto_id: 0,
                cantidad: 1,
                precio_compra: 0,
                modo: 'unidad',
                paquetes: 1,
                fecha_vencimiento: '',
            }]);
            
            setShowEditModal(true);
            setEditError(null);
        } catch (err) {
            setEditError('Error al cargar datos para edición');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleProductoChange = (index: number, field: string, value: any) => {
        const nuevosProductos = [...productosCompra];
        
        if (field === 'producto_id') {
            const producto = productos.find(p => p.product_id === value);
            if (producto) {
                nuevosProductos[index] = {
                    ...nuevosProductos[index],
                    producto_id: value,
                    producto: producto,
                    precio_compra: producto.precio_compra || 0,
                };
            }
        } else if (field === 'cantidad') {
            nuevosProductos[index].cantidad = Math.max(1, parseInt(value) || 0);
        } else if (field === 'paquetes') {
            nuevosProductos[index].paquetes = Math.max(1, parseInt(value) || 0);
        } else if (field === 'modo') {
            const nuevoModo = value as 'unidad' | 'paquete';
            nuevosProductos[index].modo = nuevoModo;
            const producto = nuevosProductos[index].producto;
            if (producto) {
                nuevosProductos[index].precio_compra = nuevoModo === 'paquete' 
                    ? (producto.precio_compra_paquete || producto.precio_compra || 0)
                    : (producto.precio_compra || 0);
            }
        } else if (field === 'precio_compra') {
            nuevosProductos[index].precio_compra = parseFloat(value) || 0;
        } else if (field === 'fecha_vencimiento') {
            nuevosProductos[index].fecha_vencimiento = value;
        }
        
        setProductosCompra(nuevosProductos);
    };
    
    const agregarProducto = () => {
        setProductosCompra([
            ...productosCompra,
            {
                id: Date.now().toString(),
                producto_id: 0,
                cantidad: 1,
                precio_compra: 0,
                modo: 'unidad',
                paquetes: 1,
                fecha_vencimiento: '',
            }
        ]);
    };
    
    const eliminarProducto = (index: number) => {
        if (productosCompra.length > 1) {
            setProductosCompra(productosCompra.filter((_, i) => i !== index));
        }
    };
    
    const calcularSubtotal = (): number => {
        return productosCompra.reduce((sum, item) => {
            if (item.modo === 'paquete') {
                const paquetes = item.paquetes ?? 1;
                return sum + (paquetes * item.precio_compra);
            } else {
                return sum + (item.cantidad * item.precio_compra);
            }
        }, 0);
    };
    
    const calcularDescuento = (): number => {
        if (!aplicarDescuento || valorDescuento <= 0) return 0;
        
        const subtotal = calcularSubtotal();
        if (tipoDescuento === 'porcentaje') {
            const descuento = subtotal * (valorDescuento / 100);
            return Math.min(descuento, subtotal);
        }
        return Math.min(valorDescuento, subtotal);
    };
    
    const calcularTotal = (): number => {
        return Math.max(0, calcularSubtotal() - calcularDescuento());
    };
    
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!compra) return;
        
        if (productosCompra.some(p => p.producto_id === 0)) {
            setEditError('Todos los productos deben estar seleccionados');
            return;
        }
        
        if (productosCompra.some(p => (p.modo === 'unidad' ? p.cantidad <= 0 : (p.paquetes ?? 0) <= 0) || p.precio_compra <= 0)) {
            setEditError('Cantidad/Paquetes y precio deben ser mayores a 0');
            return;
        }
        
        try {
            setSaving(true);
            setEditError(null);
            
            const detalles = productosCompra.map(p => {
                if (p.modo === 'paquete') {
                    return {
                        product_id: p.producto_id,
                        cantidad: p.paquetes ?? 1,
                        precio_unitario: parseFloat(String(p.precio_compra)),
                        fecha_vencimiento: p.fecha_vencimiento || undefined,
                        modo: 'paquete' as const,
                    };
                } else {
                    return {
                        product_id: p.producto_id,
                        cantidad: p.cantidad,
                        precio_unitario: parseFloat(String(p.precio_compra)),
                        fecha_vencimiento: p.fecha_vencimiento || undefined,
                        modo: 'unidad' as const,
                    };
                }
            });
            
            // Actualizar la compra con todos los campos
            await updateCompra(compra.compra_id, {
                proveedor_id: proveedorId !== null ? proveedorId : null,
                tipo_compra: tipoCompra,
                descuento: aplicarDescuento ? calcularDescuento() : 0,
                monto_pagado: tipoCompra === 'CONTADO' ? calcularTotal() : montoPagado,
                observaciones,
                detalles,
            });
            
            // Recargar los detalles
            await loadCompraDetails();
            setShowEditModal(false);
            alert('¡Compra actualizada exitosamente!');
        } catch (err: any) {
            setEditError(err?.message || 'Error al actualizar la compra');
            console.error(err);
        } finally {
            setSaving(false);
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
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-primary" onClick={handleOpenEditModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit size={18} /> Editar Compra
                    </button>
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
                                {compra.proveedor.nit_ci && <span> | NIT/CI: {compra.proveedor.nit_ci}</span>}
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
                    <div className="financial-card subtotal">
                        <div className="financial-label">Subtotal</div>
                        <div className="financial-value">Bs {parseFloat(compra.subtotal as any).toFixed(2)}</div>
                    </div>

                    {compra.descuento && compra.descuento > 0 && (
                        <div className="financial-card descuento">
                            <div className="financial-label">Descuento</div>
                            <div className="financial-value" style={{ color: 'var(--color-success)' }}>
                                - Bs {parseFloat(compra.descuento as any).toFixed(2)}
                            </div>
                        </div>
                    )}

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
                        <div className="financial-value">
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
                                <th>Modo</th>
                                <th className="text-center">Cantidad</th>
                                <th className="text-right">Precio Unitario</th>
                                <th className="text-center">Fecha Vencimiento</th>
                                <th className="text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compra.detalles.map((detalle: any, idx: number) => {
                                const producto = detalle.producto;
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
                                            <span className={`badge ${esPaquete ? 'badge-warning' : 'badge-success'}`}>
                                                {esPaquete ? '📦 Paquete' : '🔢 Unidad'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <strong>{cantidadMostrar}</strong>
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
                                <td colSpan={5} className="text-right">TOTAL:</td>
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
            
            {/* Modal de Edición */}
            {showEditModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h3>Editar Compra #{compra.compra_id}</h3>
                            <button className="modal-close" onClick={() => !saving && setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveEdit}>
                            <div className="modal-body" style={{ padding: '1.5rem' }}>
                                {editError && (
                                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                                        {editError}
                                    </div>
                                )}
                                
                                {/* Proveedor */}
                                <div className="form-section" style={{ marginBottom: '1.5rem' }}>
                                    <h4 className="section-title" style={{ fontSize: '1.1rem' }}>Proveedor</h4>
                                    
                                    <div className="form-group">
                                        <label>Seleccionar Proveedor</label>
                                        <select
                                            className="form-input"
                                            value={proveedorId || ''}
                                            onChange={(e) => setProveedorId(e.target.value ? parseInt(e.target.value) : null)}
                                        >
                                            <option value="">-- Sin proveedor --</option>
                                            {proveedores.map(p => (
                                                <option key={p.proveedor_id} value={p.proveedor_id}>
                                                    {p.nombre} {p.nit_ci ? `- ${p.nit_ci}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Productos */}
                                <div className="form-section" style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Productos</h4>
                                        <button type="button" className="btn-icon btn-success" onClick={agregarProducto}>
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                    
                                    <div className="products-list">
                                        {productosCompra.map((item, index) => {
                                            const producto = item.producto || productos.find(p => p.product_id === item.producto_id);
                                            const cantPorPaquete = producto?.cant_por_paquete || 1;
                                            
                                            return (
                                                <div key={item.id} className="product-card" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                                    <div className="product-form-group">
                                                        <label>Producto *</label>
                                                        <select
                                                            value={item.producto_id}
                                                            onChange={(e) => handleProductoChange(index, 'producto_id', parseInt(e.target.value))}
                                                            required
                                                        >
                                                            <option value="0">-- Seleccionar --</option>
                                                            {productos.map(p => (
                                                                <option key={p.product_id} value={p.product_id}>
                                                                    {p.nombre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="product-form-group">
                                                        <label>Modo de Compra</label>
                                                        <select
                                                            value={item.modo}
                                                            onChange={(e) => handleProductoChange(index, 'modo', e.target.value)}
                                                        >
                                                            <option value="unidad">Por Unidad</option>
                                                            <option value="paquete">Por Paquete</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {item.modo === 'paquete' ? (
                                                        <>
                                                            <div className="product-form-group">
                                                                <label>Paquetes *</label>
                                                                <input
                                                                    type="number"
                                                                    value={item.paquetes}
                                                                    onChange={(e) => handleProductoChange(index, 'paquetes', e.target.value)}
                                                                    min="1"
                                                                    required
                                                                />
                                                                <small style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                    {cantPorPaquete} unidades/paquete
                                                                </small>
                                                            </div>
                                                            <div className="product-form-group">
                                                                <label>Total Unidades</label>
                                                                <input
                                                                    type="text"
                                                                    value={(item.paquetes ?? 0) * cantPorPaquete}
                                                                    className="input-disabled"
                                                                    disabled
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="product-form-group">
                                                            <label>Cantidad *</label>
                                                            <input
                                                                type="number"
                                                                value={item.cantidad}
                                                                onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                                                                min="1"
                                                                required
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="product-form-group">
                                                        <label>Precio {item.modo === 'paquete' ? 'por Paquete' : 'Unitario'} *</label>
                                                        <input
                                                            type="number"
                                                            value={item.precio_compra}
                                                            onChange={(e) => handleProductoChange(index, 'precio_compra', e.target.value)}
                                                            step="0.01"
                                                            min="0"
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div className="product-form-group">
                                                        <label>Fecha Vencimiento</label>
                                                        <input
                                                            type="date"
                                                            value={item.fecha_vencimiento || ''}
                                                            onChange={(e) => handleProductoChange(index, 'fecha_vencimiento', e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    <div className="product-form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label>Subtotal</label>
                                                            <input
                                                                type="text"
                                                                value={(item.modo === 'paquete' 
                                                                    ? (item.paquetes ?? 0) * item.precio_compra 
                                                                    : item.cantidad * item.precio_compra
                                                                ).toFixed(2)}
                                                                className="input-disabled"
                                                                disabled
                                                            />
                                                        </div>
                                                        {productosCompra.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="btn-icon btn-danger"
                                                                onClick={() => eliminarProducto(index)}
                                                                title="Eliminar producto"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Datos de la Compra */}
                                <div className="form-section" style={{ marginBottom: '1.5rem' }}>
                                    <h4 className="section-title" style={{ fontSize: '1.1rem' }}>Datos de la Compra</h4>
                                    
                                    {/* Descuento */}
                                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>Aplicar Descuento</h5>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={aplicarDescuento}
                                                    onChange={(e) => {
                                                        setAplicarDescuento(e.target.checked);
                                                        if (!e.target.checked) setValorDescuento(0);
                                                    }}
                                                />
                                                <span>Activar descuento</span>
                                            </label>
                                        </div>
                                        
                                        {aplicarDescuento && (
                                            <div className="grid-2">
                                                <div className="form-group">
                                                    <label>Tipo de descuento</label>
                                                    <select
                                                        className="form-input"
                                                        value={tipoDescuento}
                                                        onChange={(e) => {
                                                            setTipoDescuento(e.target.value as 'bolivianos' | 'porcentaje');
                                                            setValorDescuento(0);
                                                        }}
                                                    >
                                                        <option value="bolivianos">Bolivianos (Bs)</option>
                                                        <option value="porcentaje">Porcentaje (%)</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>{tipoDescuento === 'bolivianos' ? 'Monto del descuento (Bs)' : 'Porcentaje de descuento (%)'}</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={valorDescuento}
                                                        onChange={(e) => setValorDescuento(parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        max={tipoDescuento === 'porcentaje' ? 100 : calcularSubtotal()}
                                                        step={tipoDescuento === 'porcentaje' ? '0.1' : '0.01'}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label>Tipo de Compra *</label>
                                            <select
                                                className="form-input"
                                                value={tipoCompra}
                                                onChange={(e) => {
                                                    const tipo = e.target.value as 'CONTADO' | 'CREDITO';
                                                    setTipoCompra(tipo);
                                                    if (tipo === 'CONTADO') {
                                                        setMontoPagado(0);
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="CONTADO">Contado</option>
                                                <option value="CREDITO">Crédito</option>
                                            </select>
                                        </div>
                                        
                                        {tipoCompra === 'CREDITO' && (
                                            <>
                                                <div className="form-group">
                                                    <label>Monto Adelantado (Bs.)</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={montoPagado}
                                                        onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        max={calcularTotal()}
                                                        step="0.01"
                                                        placeholder="0.00"
                                                    />
                                                    {montoPagado > calcularTotal() && (
                                                        <small style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                                                            ⚠️ El adelanto no puede ser mayor al total
                                                        </small>
                                                    )}
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label>Monto Adeudado (Bs.)</label>
                                                    <input
                                                        type="text"
                                                        className="form-input input-disabled"
                                                        value={(calcularTotal() - montoPagado).toFixed(2)}
                                                        disabled
                                                        style={{ 
                                                            fontWeight: '600',
                                                            color: (calcularTotal() - montoPagado) > 0 ? 'var(--warning)' : 'var(--success)'
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="form-group span-2">
                                            <label>Observaciones</label>
                                            <textarea
                                                className="form-input"
                                                value={observaciones}
                                                onChange={(e) => setObservaciones(e.target.value)}
                                                rows={3}
                                                placeholder="Notas adicionales sobre la compra..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Resumen Total */}
                                <div style={{ background: 'var(--bg-2)', padding: '1.5rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                                            <span style={{ fontWeight: '500' }}>Bs {calcularSubtotal().toFixed(2)}</span>
                                        </div>
                                        
                                        {aplicarDescuento && valorDescuento > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--success)' }}>
                                                <span>Descuento ({tipoDescuento === 'porcentaje' ? `${valorDescuento}%` : 'Bs'}):</span>
                                                <span style={{ fontWeight: '500' }}>- Bs {calcularDescuento().toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Total de la Compra</h3>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                                                Bs {calcularTotal().toFixed(2)}
                                            </span>
                                        </div>
                                        
                                        {tipoCompra === 'CREDITO' && (
                                            <>
                                                <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                                                <div style={{ background: 'var(--card)', padding: '1rem', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Monto pagado:</span>
                                                            <span style={{ fontWeight: '600', color: 'var(--success)' }}>Bs {montoPagado.toFixed(2)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Monto adeudado:</span>
                                                            <span style={{ fontWeight: '600', color: 'var(--warning)' }}>Bs {Math.max(0, calcularTotal() - montoPagado).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)} disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
