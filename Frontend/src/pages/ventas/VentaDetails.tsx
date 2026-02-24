import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Package, DollarSign, FileText, Edit, Trash2, Plus, X, Save, CheckCircle, Clock } from 'lucide-react';
import { request } from '../../lib/http';
import { 
    getVentaById, 
    getPagosByVenta, 
    updateVenta, 
    createPago, 
    updatePago, 
    deletePago,
    getAllLotes,
    type Venta, 
    type Pago,
    type Lote,
    type CreateDetalleVentaDto,
    type Cliente
} from '../../services/ventaService';
import { getAllProducts, type Producto } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import Autocomplete from '../../components/Autocomplete';
import '../compras/compras.css';
import '../../styles/page.css';

interface ProductoExtendido extends Producto {
    precio_venta_paquete?: number;
}

interface DetalleEditable {
    detalle_venta_id?: number;
    lote_id: number;
    cantidad: number;
    precio_venta_real: number;
    modo: 'unidad' | 'paquete';
    lote?: Lote;
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

export default function VentaDetailsNew() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [venta, setVenta] = useState<Venta | null>(null);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal para editar datos básicos
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [tipoVenta, setTipoVenta] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
    const [observaciones, setObservaciones] = useState('');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [aplicarDescuento, setAplicarDescuento] = useState<boolean>(false);
    const [tipoDescuento, setTipoDescuento] = useState<'bolivianos' | 'porcentaje'>('bolivianos');
    const [valorDescuento, setValorDescuento] = useState<number>(0);
    const [montoPagado, setMontoPagado] = useState<number>(0);
    
    // Estados para edición de productos
    const [editandoProductos, setEditandoProductos] = useState(false);
    const [detallesEditables, setDetallesEditables] = useState<DetalleEditable[]>([]);
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [savingProductos, setSavingProductos] = useState(false);

    // Estados para modal de pagos
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [editandoPago, setEditandoPago] = useState<Pago | null>(null);
    const [pagoFormData, setPagoFormData] = useState({
        monto: 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        observaciones: ''
    });
    const [savingPago, setSavingPago] = useState(false);
    const [pagoError, setPagoError] = useState<string | null>(null);
    
    // Estados para modal de eliminación de pago
    const [showDeletePagoModal, setShowDeletePagoModal] = useState(false);
    const [pagoToDelete, setPagoToDelete] = useState<Pago | null>(null);
    const [deletingPago, setDeletingPago] = useState(false);

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

    // Funciones de cálculo para el modal
    const calcularSubtotalModal = (): number => {
        return parseFloat(venta?.subtotal as any) || 0;
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

    // Abrir modal de edición de datos básicos
    const handleOpenEditModal = async () => {
        if (!venta) return;
        
        try {
            setLoading(true);
            const clientesData = await request<Cliente[]>('/clientes', {}, auth?.token);
            setClientes(clientesData);
            
            setClienteId(venta.cliente_id || null);
            setTipoVenta(venta.tipo_venta);
            setObservaciones(venta.observaciones || '');
            setMontoPagado(parseFloat(venta.monto_pagado as any) || 0);
            
            // Configurar descuento si existe
            if (venta.descuento && venta.descuento > 0) {
                setAplicarDescuento(true);
                setValorDescuento(venta.descuento);
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

    // Guardar cambios de datos básicos (sin productos)
    const handleSaveBasicEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!venta) return;
        
        try {
            setSaving(true);
            setEditError(null);
            
            // Enviar datos básicos con descuento y monto pagado
            await updateVenta(venta.venta_id, {
                cliente_id: clienteId || undefined,
                tipo_venta: tipoVenta,
                descuento: aplicarDescuento ? calcularDescuentoModal() : 0,
                monto_pagado: tipoVenta === 'CONTADO' ? calcularTotalModal() : montoPagado,
                observaciones,
            }, auth?.token);
            
            await loadVentaDetails();
            setShowEditModal(false);
            alert('¡Datos básicos actualizados exitosamente!');
        } catch (err: any) {
            setEditError(err?.response?.data?.message || err?.message || 'Error al actualizar la venta');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Iniciar edición de productos
    const handleIniciarEdicionProductos = async () => {
        if (!venta) return;
        
        try {
            const [lotesData, productosData] = await Promise.all([
                getAllLotes(auth?.token),
                getAllProducts()
            ]);
            setLotes(lotesData);
            setProductos(productosData);
            
            const detalles = venta.detalles?.map(detalle => ({
                detalle_venta_id: detalle.detalle_venta_id,
                lote_id: detalle.lote_id,
                cantidad: detalle.cantidad,
                precio_venta_real: parseFloat(detalle.precio_venta_real as any) || 0,
                modo: (detalle as any).modo || 'unidad' as 'unidad' | 'paquete',
                lote: detalle.lote,
                producto: detalle.lote?.producto as any,
            })) || [];
            
            setDetallesEditables(detalles);
            setEditandoProductos(true);
        } catch (err) {
            console.error('Error al cargar productos:', err);
        } finally {
            // nothing
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
        
        if (campo === 'product_id') {
            const producto = productos.find(p => p.product_id === valor);
            if (producto) {
                // Filtrar lotes de este producto con stock disponible
                const lotesDelProducto = lotes.filter(
                    l => l.product_id === valor && l.cantidad_actual > 0
                );
                
                // Determinar precio según modo actual
                const modoActual = nuevosDetalles[index].modo;
                let precio = 0;
                if (modoActual === 'paquete') {
                    const precioVentaPaquete = parseFloat((producto as any).precio_venta_paquete_sin_factura) || 0;
                    const precioBase = parseFloat(producto.precio_venta_sin_factura as any) || 0;
                    const cantPorPaquete = (producto as any).cant_por_paquete || 1;
                    precio = precioVentaPaquete || (precioBase * cantPorPaquete);
                } else {
                    precio = parseFloat(producto.precio_venta_sin_factura as any) || 0;
                }
                
                nuevosDetalles[index] = {
                    ...nuevosDetalles[index],
                    producto: producto as any,
                    precio_venta_real: precio,
                    cantidad: 1,
                    lote_id: lotesDelProducto.length > 0 ? lotesDelProducto[0].lote_id : 0,
                    lote: lotesDelProducto.length > 0 ? lotesDelProducto[0] : undefined,
                };
            }
        } else if (campo === 'lote_id') {
            const lote = lotes.find(l => l.lote_id === parseInt(valor));
            if (lote) {
                nuevosDetalles[index] = {
                    ...nuevosDetalles[index],
                    lote_id: lote.lote_id,
                    lote: lote,
                };
            }
        } else if (campo === 'modo') {
            const producto = nuevosDetalles[index].producto;
            const cantPorPaquete = (producto as any)?.cant_por_paquete || 1;
            
            let nuevoPrecio = 0;
            if (valor === 'paquete') {
                const precioVentaPaquete = parseFloat((producto as any)?.precio_venta_paquete_sin_factura) || 0;
                const precioBase = parseFloat(producto?.precio_venta_sin_factura as any) || 0;
                nuevoPrecio = precioVentaPaquete || (precioBase * cantPorPaquete);
            } else {
                nuevoPrecio = parseFloat(producto?.precio_venta_sin_factura as any) || 0;
            }
            
            nuevosDetalles[index] = {
                ...nuevosDetalles[index],
                modo: valor,
                cantidad: 1,
                precio_venta_real: nuevoPrecio,
            };
        } else {
            nuevosDetalles[index] = {
                ...nuevosDetalles[index],
                [campo]: campo === 'cantidad' || campo === 'precio_venta_real' ? parseFloat(valor) || 0 : valor,
            };
        }
        
        setDetallesEditables(nuevosDetalles);
    };

    // Agregar nuevo producto
    const handleAgregarProducto = () => {
        setDetallesEditables([...detallesEditables, {
            lote_id: 0,
            cantidad: 1,
            precio_venta_real: 0,
            modo: 'unidad',
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
        if (!venta) return;
        
        // Validar
        if (detallesEditables.some(d => d.lote_id === 0 || !d.lote_id)) {
            alert('Todos los lotes deben estar seleccionados');
            return;
        }
        
        if (detallesEditables.some(d => d.cantidad <= 0 || d.precio_venta_real <= 0)) {
            alert('Cantidad y precio deben ser mayores a 0');
            return;
        }
        
        try {
            setSavingProductos(true);
            
            const detalles: CreateDetalleVentaDto[] = detallesEditables.map(d => ({
                lote_id: Number(d.lote_id),
                cantidad: Number(d.cantidad),
                modo: d.modo || 'unidad',
            }));
            
            await updateVenta(venta.venta_id, {
                detalles,
                descuento: parseFloat(venta.descuento as any) || 0,
            }, auth?.token);
            
            await loadVentaDetails();
            setEditandoProductos(false);
            setDetallesEditables([]);
            alert('¡Productos actualizados exitosamente!');
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Error al actualizar productos';
            alert(errorMsg);
            console.error('Error al actualizar productos:', err);
        } finally {
            setSavingProductos(false);
        }
    };

    // === FUNCIONES PARA MANEJO DE PAGOS ===
    
    const handleAbrirModalPago = () => {
        if (!venta) return;
        setPagoFormData({
            monto: 0,
            fecha_pago: new Date().toISOString().split('T')[0],
            observaciones: ''
        });
        setEditandoPago(null);
        setPagoError(null);
        setShowPagoModal(true);
    };

    const handleEditarPago = (pago: Pago) => {
        let fechaFormateada = pago.fecha_pago;
        if (typeof fechaFormateada === 'string' && fechaFormateada.includes('T')) {
            fechaFormateada = fechaFormateada.split('T')[0];
        } else if (typeof fechaFormateada === 'string') {
            fechaFormateada = fechaFormateada.split(' ')[0];
        }
        
        setPagoFormData({
            monto: pago.monto,
            fecha_pago: fechaFormateada,
            observaciones: pago.observaciones || ''
        });
        setEditandoPago(pago);
        setPagoError(null);
        setShowPagoModal(true);
    };

    const handleCerrarModalPago = () => {
        setShowPagoModal(false);
        setEditandoPago(null);
        setPagoFormData({
            monto: 0,
            fecha_pago: new Date().toISOString().split('T')[0],
            observaciones: ''
        });
        setPagoError(null);
    };

    const handleGuardarPago = async () => {
        if (!venta) return;
        
        if (pagoFormData.monto <= 0) {
            setPagoError('El monto debe ser mayor a 0');
            return;
        }

        if (!editandoPago && pagoFormData.monto > venta.monto_adeudado) {
            setPagoError(`El monto no puede exceder el adeudado (Bs. ${parseFloat(venta.monto_adeudado as any).toFixed(2)})`);
            return;
        }

        if (editandoPago) {
            const diferenciaMontos = pagoFormData.monto - parseFloat(editandoPago.monto as any);
            if (diferenciaMontos > venta.monto_adeudado) {
                setPagoError(`El monto adicional excede el adeudado (Bs. ${parseFloat(venta.monto_adeudado as any).toFixed(2)})`);
                return;
            }
        }

        try {
            setSavingPago(true);
            setPagoError(null);

            if (editandoPago) {
                await updatePago(editandoPago.pago_id, {
                    monto: pagoFormData.monto,
                    fecha_pago: pagoFormData.fecha_pago,
                    observaciones: pagoFormData.observaciones || undefined
                }, auth?.token);
            } else {
                await createPago({
                    venta_id: venta.venta_id,
                    monto: pagoFormData.monto,
                    fecha_pago: pagoFormData.fecha_pago,
                    observaciones: pagoFormData.observaciones || undefined
                }, auth?.token);
            }

            await loadVentaDetails();
            handleCerrarModalPago();
            
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Error al guardar el pago';
            setPagoError(errorMsg);
            console.error('Error al guardar pago:', err);
        } finally {
            setSavingPago(false);
        }
    };

    const handleAbrirModalEliminarPago = (pago: Pago) => {
        setPagoToDelete(pago);
        setShowDeletePagoModal(true);
    };

    const handleCerrarModalEliminarPago = () => {
        setShowDeletePagoModal(false);
        setPagoToDelete(null);
    };

    const handleConfirmarEliminarPago = async () => {
        if (!pagoToDelete) return;

        try {
            setDeletingPago(true);
            await deletePago(pagoToDelete.pago_id, auth?.token);
            
            // Recargar datos de la venta y pagos
            await loadVentaDetails();
            
            handleCerrarModalEliminarPago();
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Error al eliminar el pago';
            alert(errorMsg);
            console.error('Error al eliminar pago:', err);
        } finally {
            setDeletingPago(false);
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
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-primary" onClick={handleOpenEditModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit size={18} /> Editar Venta
                    </button>
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
                        <div className="info-value">{venta.cliente?.nombre || 'Sin Cliente'}</div>
                        {venta.cliente && (
                            <div className="info-secondary">
                                {venta.cliente.telefono && <span>Tel: {venta.cliente.telefono}</span>}
                                {venta.cliente.nit_ci && <span> | NIT/CI: {venta.cliente.nit_ci}</span>}
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

                    <div className="info-card">
                        <div className="info-label">
                            <FileText size={16} />
                            Factura
                        </div>
                        <div className="info-value">
                            <span className={`badge ${venta.con_factura ? 'badge-info' : 'badge-secondary'}`}>
                                {venta.con_factura ? '✓ Con Factura' : 'Sin Factura'}
                            </span>
                        </div>
                        <div className="info-secondary" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {venta.con_factura ? 'Precios incluyen factura' : 'Precios sin factura'}
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
                    <div className="financial-card subtotal">
                        <div className="financial-label">Subtotal</div>
                        <div className="financial-value">Bs {parseFloat(venta.subtotal as any).toFixed(2)}</div>
                    </div>

                    {venta.descuento && venta.descuento > 0 && (
                        <div className="financial-card descuento">
                            <div className="financial-label">Descuento</div>
                            <div className="financial-value" style={{ color: 'var(--color-success)' }}>
                                - Bs {parseFloat(venta.descuento as any).toFixed(2)}
                            </div>
                        </div>
                    )}

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
                        <div className="financial-value">
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="section-title" style={{ marginBottom: 0 }}>
                        <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Productos Vendidos
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
                    venta.detalles && venta.detalles.length > 0 ? (
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
                                            <td>#{detalle.lote_id}</td>
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
                    )
                ) : (
                    <div>
                        <button 
                            type="button" 
                            className="btn-success" 
                            onClick={handleAgregarProducto}
                            style={{ marginBottom: '1rem' }}
                        >
                            <Plus size={18} /> Agregar Producto
                        </button>

                        <div className="products-list">
                            {detallesEditables.map((detalle, index) => {
                                const lote = detalle.lote || lotes.find(l => l.lote_id === detalle.lote_id);
                                const producto = detalle.producto || lote?.producto;
                                const cantPorPaquete = (producto as any)?.cant_por_paquete || 1;
                                
                                // Obtener el lote original de la venta (antes de cualquier modificación)
                                const detalleOriginal = detalle.detalle_venta_id 
                                    ? venta?.detalles?.find(d => d.detalle_venta_id === detalle.detalle_venta_id)
                                    : null;
                                const loteOriginalId = detalleOriginal?.lote_id;
                                
                                // Calcular stock disponible según modo
                                // IMPORTANTE: Solo sumar la cantidad vendida si es el MISMO lote original
                                let stockDisponible = 0;
                                if (lote) {
                                    // Solo sumar la cantidad original si estamos viendo el lote que se usó en la venta
                                    const esLoteOriginal = lote.lote_id === loteOriginalId;
                                    const cantidadOriginalVendida = esLoteOriginal && detalleOriginal 
                                        ? detalleOriginal.cantidad 
                                        : 0;
                                    
                                    if (detalle.modo === 'paquete') {
                                        // En modo paquete: stock actual + paquetes vendidos (solo si es el lote original)
                                        const stockEnUnidades = lote.cantidad_actual + (cantidadOriginalVendida * cantPorPaquete);
                                        stockDisponible = Math.floor(stockEnUnidades / cantPorPaquete);
                                    } else {
                                        // En modo unidad: stock actual + unidades vendidas (solo si es el lote original)
                                        stockDisponible = lote.cantidad_actual + cantidadOriginalVendida;
                                    }
                                }
                                
                                // Filtrar lotes del producto seleccionado
                                // Siempre incluir el lote actual aunque no tenga stock
                                const lotesDelProducto = producto 
                                    ? lotes.filter(l => {
                                        if (l.product_id !== producto.product_id) return false;
                                        // Incluir si tiene stock O si es el lote actualmente seleccionado
                                        return l.cantidad_actual > 0 || l.lote_id === detalle.lote_id;
                                    })
                                    : [];
                                
                                return (
                                    <div key={index} className="product-card">
                                        {/* Producto */}
                                        <div className="product-form-group">
                                            <label>Producto *</label>
                                            <Autocomplete
                                                options={productos.map(prod => ({
                                                    value: prod.product_id,
                                                    label: prod.nombre,
                                                    subtitle: prod.categoria ? `Categoría: ${prod.categoria.nombre}` : undefined
                                                }))}
                                                value={producto?.product_id || 0}
                                                onChange={(value) => handleModificarDetalle(index, 'product_id', typeof value === 'number' ? value : parseInt(value as string))}
                                                placeholder="Buscar producto..."
                                                required
                                            />
                                        </div>

                                        {/* Modo */}
                                        <div className="product-form-group">
                                            <label>Modo *</label>
                                            <select
                                                value={detalle.modo}
                                                onChange={(e) => handleModificarDetalle(index, 'modo', e.target.value)}
                                            >
                                                <option value="unidad">Por unidad</option>
                                                <option value="paquete">Por paquete</option>
                                            </select>
                                        </div>

                                        {/* Unidades por paquete (si modo = paquete) */}
                                        {detalle.modo === 'paquete' && (
                                            <div className="product-form-group">
                                                <label>Unidades por paquete</label>
                                                <input
                                                    type="text"
                                                    value={cantPorPaquete}
                                                    className="input-disabled"
                                                    disabled
                                                />
                                            </div>
                                        )}

                                        {/* Lote */}
                                        <div className="product-form-group">
                                            <label>Lote *</label>
                                            <select
                                                value={detalle.lote_id}
                                                onChange={(e) => handleModificarDetalle(index, 'lote_id', Number(e.target.value))}
                                                disabled={lotesDelProducto.length === 0}
                                                required
                                            >
                                                <option value={0}>-- Selecciona un lote --</option>
                                                {lotesDelProducto.map(l => (
                                                    <option key={l.lote_id} value={l.lote_id}>
                                                        Lote #{l.lote_id} - Stock: {stockDisponible}
                                                        {l.fecha_vencimiento && ` - Venc: ${new Date(l.fecha_vencimiento).toLocaleDateString('es-ES')}`}
                                                    </option>
                                                ))}
                                            </select>
                                            {producto && lotesDelProducto.length === 0 && (
                                                <small style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                                                    Sin stock disponible
                                                </small>
                                            )}
                                        </div>

                                        {/* Stock Disponible */}
                                        <div className="product-form-group">
                                            <label>Stock Disponible</label>
                                            <div style={{ 
                                                padding: '0.65rem 0.85rem',
                                                background: 'var(--bg-2)',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--text)'
                                            }}>
                                                <Package size={16} />
                                                <strong>{stockDisponible} {detalle.modo === 'paquete' ? 'paquetes' : 'unidades'}</strong>
                                            </div>
                                        </div>

                                        {/* Cantidad (según modo) */}
                                        <div className="product-form-group">
                                            <label>
                                                {detalle.modo === 'paquete' ? 'Paquetes *' : 'Cantidad *'}
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={stockDisponible}
                                                value={detalle.cantidad}
                                                onChange={(e) => handleModificarDetalle(index, 'cantidad', e.target.value)}
                                                disabled={stockDisponible === 0}
                                                style={{
                                                    borderColor: detalle.cantidad > stockDisponible ? 'var(--danger, #ef4444)' : undefined
                                                }}
                                                required
                                            />
                                            {detalle.cantidad > stockDisponible && (
                                                <small style={{ color: 'var(--danger, #ef4444)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                                                    ⚠️ Stock insuficiente. Disponible: {stockDisponible} {detalle.modo === 'paquete' ? 'paquetes' : 'unidades'}
                                                </small>
                                            )}
                                            {detalle.modo === 'paquete' && (
                                                <small className="form-help-text">
                                                    = {detalle.cantidad * cantPorPaquete} unidades totales
                                                </small>
                                            )}
                                        </div>

                                        {/* Precio Unitario/por Paquete */}
                                        <div className="product-form-group">
                                            <label>Precio {detalle.modo === 'paquete' ? 'por Paquete' : 'Unitario'} (Bs.) *</label>
                                            <input
                                                type="text"
                                                value={`Bs ${detalle.precio_venta_real.toFixed(2)}`}
                                                className="input-disabled"
                                                disabled
                                            />
                                        </div>

                                        {/* Subtotal */}
                                        <div className="product-form-group">
                                            <label>Subtotal</label>
                                            <input
                                                type="text"
                                                value={`Bs ${(detalle.cantidad * detalle.precio_venta_real).toFixed(2)}`}
                                                className="input-disabled"
                                                disabled
                                            />
                                        </div>

                                        {/* Botón eliminar */}
                                        {detallesEditables.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-icon btn-danger"
                                                onClick={() => handleEliminarProducto(index)}
                                                title="Eliminar producto"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="total-summary-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>TOTAL:</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>
                                    Bs {detallesEditables.reduce((sum, d) => sum + (d.cantidad * d.precio_venta_real), 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Historial de Pagos */}
            {venta.tipo_venta === 'CREDITO' && (
                <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="section-title">
                            <DollarSign size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Historial de Pagos
                        </h3>
                        {venta.monto_adeudado > 0 && (
                            <button 
                                className="btn-primary" 
                                onClick={handleAbrirModalPago}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Plus size={18} /> Registrar Pago
                            </button>
                        )}
                    </div>
                    {pagos.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Fecha y Hora</th>
                                    <th className="text-right">Monto</th>
                                    <th>Observaciones</th>
                                    <th style={{ width: '120px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagos.map((pago) => (
                                    <tr key={pago.pago_id}>
                                        <td className="id-col">#{pago.pago_id}</td>
                                        <td>
                                            {formatearFecha(pago.fecha_pago)}
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {formatearHora((pago as any).createdAt || pago.fecha_pago)}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <strong style={{ color: 'var(--success)' }}>
                                                Bs {parseFloat(pago.monto as any).toFixed(2)}
                                            </strong>
                                        </td>
                                        <td>{pago.observaciones || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    className="btn-icon btn-icon-primary"
                                                    onClick={() => handleEditarPago(pago)}
                                                    title="Editar pago"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-icon-danger"
                                                    onClick={() => handleAbrirModalEliminarPago(pago)}
                                                    title="Eliminar pago"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: '600', background: 'var(--bg-2)' }}>
                                    <td colSpan={2} className="text-right">TOTAL PAGADO:</td>
                                    <td className="text-right" style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
                                        Bs {parseFloat(venta.monto_pagado as any).toFixed(2)}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>No se han registrado pagos para esta venta</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de edición de datos básicos */}
            {showEditModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h3>Editar Datos de Venta #{venta.venta_id}</h3>
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
                                    <label>Cliente</label>
                                    <Autocomplete
                                        options={[
                                            { value: 0, label: '-- Sin cliente --' },
                                            ...clientes.map(cliente => ({
                                                value: cliente.cliente_id,
                                                label: cliente.nombre,
                                                subtitle: cliente.nit_ci ? `NIT/CI: ${cliente.nit_ci}` : undefined
                                            }))
                                        ]}
                                        value={clienteId ?? 0}
                                        onChange={(value) => setClienteId(value === 0 ? null : (typeof value === 'number' ? value : parseInt(value as string)))}
                                        placeholder="Buscar cliente..."
                                    />
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>Tipo de Venta *</label>
                                    <select
                                        className="form-input"
                                        value={tipoVenta}
                                        onChange={(e) => {
                                            const tipo = e.target.value as 'CONTADO' | 'CREDITO';
                                            setTipoVenta(tipo);
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
                                {tipoVenta === 'CREDITO' && (
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
                                        
                                        {tipoVenta === 'CREDITO' && (
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
                                        placeholder="Notas adicionales sobre la venta..."
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

            {/* Modal para Registrar/Editar Pago */}
            {showPagoModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>
                                {editandoPago ? 'Editar Pago' : 'Registrar Pago'}
                            </h3>
                            <button className="modal-close" onClick={handleCerrarModalPago} disabled={savingPago}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '1.5rem' }}>
                            {pagoError && (
                                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                                    {pagoError}
                                </div>
                            )}

                            {!editandoPago && venta && (
                                <div className="info-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-2)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Monto Total:</span>
                                        <span style={{ fontWeight: '600' }}>Bs {parseFloat(venta.total as any).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--success)' }}>Pagado:</span>
                                        <span style={{ fontWeight: '600', color: 'var(--success)' }}>Bs {parseFloat(venta.monto_pagado as any).toFixed(2)}</span>
                                    </div>
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--warning)', fontWeight: '600' }}>Adeudado:</span>
                                        <span style={{ fontWeight: '700', color: 'var(--warning)', fontSize: '1.1rem' }}>
                                            Bs {parseFloat(venta.monto_adeudado as any).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Monto del Pago *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={pagoFormData.monto || ''}
                                    onChange={(e) => setPagoFormData({ ...pagoFormData, monto: parseFloat(e.target.value) || 0 })}
                                    min="0.01"
                                    max={editandoPago 
                                        ? parseFloat(venta.monto_adeudado as any) + parseFloat(editandoPago.monto as any)
                                        : parseFloat(venta.monto_adeudado as any)
                                    }
                                    step="0.01"
                                    placeholder="0.00"
                                    disabled={savingPago}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {editandoPago 
                                        ? `Máximo permitido: Bs ${(parseFloat(venta.monto_adeudado as any) + parseFloat(editandoPago.monto as any)).toFixed(2)}`
                                        : `Monto adeudado: Bs ${parseFloat(venta.monto_adeudado as any).toFixed(2)}`
                                    }
                                </small>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Fecha del Pago *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={pagoFormData.fecha_pago}
                                    onChange={(e) => setPagoFormData({ ...pagoFormData, fecha_pago: e.target.value })}
                                    disabled={savingPago}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Observaciones</label>
                                <textarea
                                    className="form-input"
                                    value={pagoFormData.observaciones}
                                    onChange={(e) => setPagoFormData({ ...pagoFormData, observaciones: e.target.value })}
                                    rows={3}
                                    placeholder="Notas sobre el pago (opcional)..."
                                    disabled={savingPago}
                                />
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button"
                                className="btn-secondary" 
                                onClick={handleCerrarModalPago}
                                disabled={savingPago}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                className="btn-primary"
                                onClick={handleGuardarPago}
                                disabled={savingPago}
                            >
                                {savingPago ? 'Guardando...' : (editandoPago ? 'Actualizar Pago' : 'Registrar Pago')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar pago */}
            {showDeletePagoModal && pagoToDelete && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Confirmar Eliminación</h3>
                            <button className="modal-close" onClick={handleCerrarModalEliminarPago} disabled={deletingPago}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '1.5rem' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '1rem',
                                padding: '1rem',
                                background: 'var(--bg-2)',
                                borderRadius: '8px',
                                border: '1px solid var(--warning)'
                            }}>
                                <div style={{ color: 'var(--warning)', marginTop: '0.2rem' }}>
                                    <Trash2 size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                                        ¿Está seguro de eliminar este pago?
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                                        Esta acción no se puede deshacer.
                                    </p>
                                    <div style={{ 
                                        background: 'var(--bg)', 
                                        padding: '0.75rem', 
                                        borderRadius: '6px',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Monto del pago:</span>
                                            <strong style={{ color: 'var(--danger)' }}>
                                                Bs {parseFloat(pagoToDelete.monto as any).toFixed(2)}
                                            </strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Fecha:</span>
                                            <span>{formatearFecha(pagoToDelete.fecha_pago)}</span>
                                        </div>
                                        {pagoToDelete.observaciones && (
                                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    Observaciones: {pagoToDelete.observaciones}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ 
                                        margin: '1rem 0 0 0', 
                                        fontSize: '0.9rem', 
                                        color: 'var(--warning)',
                                        fontWeight: '500'
                                    }}>
                                        ⚠️ El monto será devuelto al saldo adeudado de la venta.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button"
                                className="btn-secondary" 
                                onClick={handleCerrarModalEliminarPago}
                                disabled={deletingPago}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                className="btn-danger"
                                onClick={handleConfirmarEliminarPago}
                                disabled={deletingPago}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Trash2 size={18} />
                                {deletingPago ? 'Eliminando...' : 'Eliminar Pago'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
