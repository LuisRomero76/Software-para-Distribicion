import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Package, DollarSign, FileText, Edit, Trash2, Plus, X, Save, CheckCircle, Clock } from 'lucide-react';
import { getCompraById, getPagosByCompra, updateCompra, type Compra, type PagoCompra } from '../../services/compraService';
import { getAllProveedores, type Proveedor } from '../../services/proveedorService';
import { getAllProducts, type Producto } from '../../services/productService';
import './compras.css';
import '../../styles/page.css';

interface ProductoExtendido extends Producto {
    precio_compra_paquete?: number;
}

interface DetalleEditable {
    detalle_compra_id?: number;
    producto_id: number;
    product_id?: number;
    cantidad: number;
    precio_unitario: number;
    modo: 'unidad' | 'paquete';
    fecha_vencimiento?: string;
    producto?: ProductoExtendido;
}

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

const formatearHora = (fecha: string | Date) => {
    const date = new Date(fecha);
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
    
    // Modal para editar datos básicos
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [proveedorId, setProveedorId] = useState<number | null>(null);
    const [tipoCompra, setTipoCompra] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
    const [observaciones, setObservaciones] = useState('');
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [aplicarDescuento, setAplicarDescuento] = useState<boolean>(false);
    const [tipoDescuento, setTipoDescuento] = useState<'bolivianos' | 'porcentaje'>('bolivianos');
    const [valorDescuento, setValorDescuento] = useState<number>(0);
    const [montoPagado, setMontoPagado] = useState<number>(0);
    
    // Estados para edición de productos
    const [editandoProductos, setEditandoProductos] = useState(false);
    const [detallesEditables, setDetallesEditables] = useState<DetalleEditable[]>([]);
    const [productos, setProductos] = useState<ProductoExtendido[]>([]);
    const [savingProductos, setSavingProductos] = useState(false);

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

    // Abrir modal de edición de datos básicos
    const handleOpenEditModal = async () => {
        if (!compra) return;
        
        try {
            setLoading(true);
            const prov = await getAllProveedores();
            setProveedores(prov);
            
            setProveedorId(compra.proveedor?.proveedor_id || null);
            setTipoCompra(compra.tipo_compra);
            setObservaciones(compra.observaciones || '');
            setMontoPagado(parseFloat(compra.monto_pagado as any) || 0);
            
            // Configurar descuento si existe
            if (compra.descuento && compra.descuento > 0) {
                setAplicarDescuento(true);
                setValorDescuento(compra.descuento);
                setTipoDescuento('bolivianos'); // Por defecto en bolivianos
            } else {
                setAplicarDescuento(false);
                setValorDescuento(0);
            }
            
            setShowEditModal(true);
            setEditError(null);
        } catch (err) {
            setEditError('Error al cargar datos para edición');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Funciones de cálculo para el modal
    const calcularSubtotalModal = (): number => {
        return parseFloat(compra?.subtotal as any) || 0;
    };
    
    const calcularDescuentoModal = (): number => {
        if (!aplicarDescuento || valorDescuento <= 0) return 0;
        
        const subtotal = calcularSubtotalModal();
        if (tipoDescuento === 'porcentaje') {
            const descuento = subtotal * (valorDescuento / 100);
            return Math.min(descuento, subtotal);
        }
        return Math.min(valorDescuento, subtotal);
    };
    
    const calcularTotalModal = (): number => {
        return Math.max(0, calcularSubtotalModal() - calcularDescuentoModal());
    };

    // Guardar cambios de datos básicos (sin productos)
    const handleSaveBasicEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!compra) return;
        
        try {
            setSaving(true);
            setEditError(null);
            
            // Enviar datos básicos con descuento y monto pagado
            await updateCompra(compra.compra_id, {
                proveedor_id: proveedorId !== null ? proveedorId : null,
                tipo_compra: tipoCompra,
                descuento: aplicarDescuento ? calcularDescuentoModal() : 0,
                monto_pagado: tipoCompra === 'CONTADO' ? calcularTotalModal() : montoPagado,
                observaciones,
            });
            
            await loadCompraDetails();
            setShowEditModal(false);
            alert('¡Datos básicos actualizados exitosamente!');
        } catch (err: any) {
            setEditError(err?.message || 'Error al actualizar la compra');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Iniciar edición de productos
    const handleIniciarEdicionProductos = async () => {
        if (!compra) return;
        
        try {
            setLoading(true);
            const prod = await getAllProducts();
            setProductos(prod as ProductoExtendido[]);
            
            // Convertir detalles actuales a formato editable
            const detalles: DetalleEditable[] = (compra.detalles || []).map((detalle: any) => ({
                detalle_compra_id: detalle.detalle_compra_id,
                producto_id: detalle.producto_id || detalle.product_id,
                product_id: detalle.product_id || detalle.producto_id,
                cantidad: detalle.cantidad,
                precio_unitario: parseFloat(detalle.precio_unitario),
                modo: detalle.modo || 'unidad',
                fecha_vencimiento: detalle.fecha_vencimiento ? new Date(detalle.fecha_vencimiento).toISOString().split('T')[0] : '',
                producto: detalle.producto,
            }));
            
            setDetallesEditables(detalles);
            setEditandoProductos(true);
        } catch (err) {
            console.error('Error al cargar productos:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cancelar edición de productos
    const handleCancelarEdicionProductos = () => {
        setEditandoProductos(false);
        setDetallesEditables([]);
    };

    // Modificar un detalle
    const handleModificarDetalle = (index: number, campo: string, valor: any) => {
        const nuevosDetalles = [...detallesEditables];
        
        if (campo === 'producto_id') {
            const producto = productos.find(p => p.product_id === parseInt(valor));
            const modoActual = nuevosDetalles[index].modo;
            const cantPorPaquete = producto?.cant_por_paquete || 1;
            
            // Determinar el precio según el modo
            let precioAUsar = 0;
            if (modoActual === 'paquete') {
                precioAUsar = producto?.precio_compra_paquete || (producto?.precio_compra || 0) * cantPorPaquete;
            } else {
                precioAUsar = producto?.precio_compra || 0;
            }
            
            nuevosDetalles[index] = {
                ...nuevosDetalles[index],
                producto_id: parseInt(valor),
                product_id: parseInt(valor),
                producto: producto,
                precio_unitario: precioAUsar,
            };
        } else if (campo === 'modo') {
            // Al cambiar de modo, actualizar el precio según el modo seleccionado
            const producto = nuevosDetalles[index].producto;
            const cantPorPaquete = producto?.cant_por_paquete || 1;
            
            let nuevoPrecio = 0;
            if (valor === 'paquete') {
                // Cambiar a paquete: usar precio_compra_paquete o precio_compra * cantidad por paquete
                nuevoPrecio = producto?.precio_compra_paquete || (producto?.precio_compra || 0) * cantPorPaquete;
            } else {
                // Cambiar a unidad: usar precio_compra
                nuevoPrecio = producto?.precio_compra || 0;
            }
            
            nuevosDetalles[index] = {
                ...nuevosDetalles[index],
                modo: valor,
                cantidad: 1,
                precio_unitario: nuevoPrecio,
            };
        } else if (campo === 'fecha_vencimiento') {
            // No modificar la fecha, mantenerla como está (en formato YYYY-MM-DD)
            nuevosDetalles[index] = {
                ...nuevosDetalles[index],
                fecha_vencimiento: valor,
            };
        } else {
            nuevosDetalles[index] = {
                ...nuevosDetalles[index],
                [campo]: campo === 'cantidad' || campo === 'precio_unitario' ? parseFloat(valor) || 0 : valor,
            };
        }
        
        setDetallesEditables(nuevosDetalles);
    };

    // Agregar nuevo producto
    const handleAgregarProducto = () => {
        setDetallesEditables([...detallesEditables, {
            producto_id: 0,
            cantidad: 1,
            precio_unitario: 0,
            modo: 'unidad',
            fecha_vencimiento: '',
        }]);
    };

    // Eliminar producto
    const handleEliminarProducto = (index: number) => {
        if (detallesEditables.length > 1) {
            setDetallesEditables(detallesEditables.filter((_, i) => i !== index));
        }
    };

    // Guardar cambios de productos
    const handleGuardarProductos = async () => {
        if (!compra) return;
        
        // Validar
        if (detallesEditables.some(d => d.producto_id === 0)) {
            alert('Todos los productos deben estar seleccionados');
            return;
        }
        
        if (detallesEditables.some(d => d.cantidad <= 0 || d.precio_unitario <= 0)) {
            alert('Cantidad y precio deben ser mayores a 0');
            return;
        }
        
        try {
            setSavingProductos(true);
            
            const detalles = detallesEditables.map(d => ({
                detalle_compra_id: d.detalle_compra_id, // Enviar ID si existe (para actualizar)
                product_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                modo: d.modo,
                fecha_vencimiento: d.fecha_vencimiento || undefined,
            }));
            
            await updateCompra(compra.compra_id, {
                detalles,
            });
            
            await loadCompraDetails();
            setEditandoProductos(false);
            setDetallesEditables([]);
            alert('¡Productos actualizados exitosamente!');
        } catch (err: any) {
            alert(err?.message || 'Error al actualizar productos');
            console.error(err);
        } finally {
            setSavingProductos(false);
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="section-title" style={{ marginBottom: 0 }}>
                        <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Productos Comprados
                    </h3>
                    {!editandoProductos && (
                        <button className="btn-primary" onClick={handleIniciarEdicionProductos}>
                            <Edit size={18} /> Editar Productos
                        </button>
                    )}
                    {editandoProductos && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn-success" 
                                onClick={handleGuardarProductos}
                                disabled={savingProductos}
                            >
                                <Save size={18} /> {savingProductos ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                            <button 
                                className="btn-secondary" 
                                onClick={handleCancelarEdicionProductos}
                                disabled={savingProductos}
                            >
                                <X size={18} /> Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {!editandoProductos ? (
                    // Vista normal (solo lectura)
                    compra.detalles && compra.detalles.length > 0 ? (
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
                                        Bs {parseFloat(compra.subtotal as any).toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">No hay productos en esta compra</div>
                    )
                ) : (
                    // Vista de edición
                    <div>
                        <button 
                            type="button" 
                            className="btn-success" 
                            onClick={handleAgregarProducto}
                            style={{ marginBottom: '1rem' }}
                        >
                            <Plus size={18} /> Agregar Producto
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {detallesEditables.map((detalle, index) => {
                                const producto = detalle.producto || productos.find(p => p.product_id === detalle.producto_id);
                                const cantPorPaquete = producto?.cant_por_paquete || 1;
                                
                                return (
                                    <div key={index} className="product-edit-card">
                                        <div className="product-edit-header">
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>
                                                Producto #{index + 1}
                                            </h4>
                                            {detallesEditables.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-icon btn-danger"
                                                    onClick={() => handleEliminarProducto(index)}
                                                    title="Eliminar producto"
                                                    style={{ padding: '0.4rem' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="product-edit-body">
                                            <div className="form-group">
                                                <label>Producto *</label>
                                                <select
                                                    className="form-input"
                                                    value={detalle.producto_id}
                                                    onChange={(e) => handleModificarDetalle(index, 'producto_id', e.target.value)}
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
                                            
                                            <div className="form-group">
                                                <label>Modo de Compra</label>
                                                <select
                                                    className="form-input"
                                                    value={detalle.modo}
                                                    onChange={(e) => handleModificarDetalle(index, 'modo', e.target.value)}
                                                >
                                                    <option value="unidad">Por Unidad</option>
                                                    <option value="paquete">Por Paquete ({cantPorPaquete} u/paq)</option>
                                                </select>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>
                                                    {detalle.modo === 'paquete' ? 'Cantidad de Paquetes *' : 'Cantidad de Unidades *'}
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={detalle.cantidad}
                                                    onChange={(e) => handleModificarDetalle(index, 'cantidad', e.target.value)}
                                                    min="1"
                                                    required
                                                />
                                                {detalle.modo === 'paquete' && (
                                                    <small className="form-help-text">
                                                        = {detalle.cantidad * cantPorPaquete} unidades totales
                                                    </small>
                                                )}
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>
                                                    Precio {detalle.modo === 'paquete' ? 'por Paquete' : 'Unitario'} *
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={detalle.precio_unitario}
                                                    onChange={(e) => handleModificarDetalle(index, 'precio_unitario', e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>Fecha de Vencimiento</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={detalle.fecha_vencimiento || ''}
                                                    onChange={(e) => handleModificarDetalle(index, 'fecha_vencimiento', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>Subtotal</label>
                                                <input
                                                    type="text"
                                                    className="form-input input-readonly"
                                                    value={`Bs ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}`}
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="total-summary-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>SUBTOTAL:</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>
                                    Bs {detallesEditables.reduce((sum, d) => sum + (d.cantidad * d.precio_unitario), 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de edición de datos básicos */}
            {showEditModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h3>Editar Datos de Compra #{compra.compra_id}</h3>
                            <button className="modal-close" onClick={() => !saving && setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveBasicEdit}>
                            <div className="modal-body" style={{ padding: '1.5rem' }}>
                                {editError && (
                                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                                        {editError}
                                    </div>
                                )}
                                
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>Proveedor</label>
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
                                
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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
                                                    max={tipoDescuento === 'porcentaje' ? 100 : calcularSubtotalModal()}
                                                    step={tipoDescuento === 'porcentaje' ? '0.1' : '0.01'}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Información de pago para CREDITO */}
                                {tipoCompra === 'CREDITO' && (
                                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                        <h5 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text)' }}>Información de Pago</h5>
                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label>Monto Adelantado (Bs.)</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={montoPagado}
                                                    onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    max={calcularTotalModal()}
                                                    step="0.01"
                                                    placeholder="0.00"
                                                />
                                                {montoPagado > calcularTotalModal() && (
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
                                                    value={(calcularTotalModal() - montoPagado).toFixed(2)}
                                                    disabled
                                                    style={{ 
                                                        fontWeight: '600',
                                                        color: (calcularTotalModal() - montoPagado) > 0 ? 'var(--warning)' : 'var(--success)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Resumen Total */}
                                <div style={{ background: 'var(--bg-2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                            <span style={{ fontWeight: '500' }}>Subtotal:</span>
                                            <span style={{ fontWeight: '600' }}>Bs {calcularSubtotalModal().toFixed(2)}</span>
                                        </div>
                                        
                                        {aplicarDescuento && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--success)' }}>
                                                <span style={{ fontWeight: '500' }}>Descuento:</span>
                                                <span style={{ fontWeight: '600' }}>- Bs {calcularDescuentoModal().toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                                            <span style={{ fontWeight: '600' }}>Total:</span>
                                            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>Bs {calcularTotalModal().toFixed(2)}</span>
                                        </div>
                                        
                                        {tipoCompra === 'CREDITO' && (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--success)' }}>
                                                    <span>Adelantado:</span>
                                                    <span style={{ fontWeight: '600' }}>Bs {montoPagado.toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--warning)' }}>
                                                    <span>Adeudado:</span>
                                                    <span style={{ fontWeight: '600' }}>Bs {(calcularTotalModal() - montoPagado).toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-group">
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
                            
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    onClick={() => setShowEditModal(false)}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-primary"
                                    disabled={saving}
                                >
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
