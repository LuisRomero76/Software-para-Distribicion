import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, Package } from 'lucide-react';
import { createVenta, getAllLotes, type Lote } from '../../services/ventaService';
import { getAllProducts, type Producto } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../clientes/services/api';
import Autocomplete from '../../components/Autocomplete';
import '../compras/compras.css';
import '../../styles/page.css';

interface Cliente {
    cliente_id: number;
    nombre: string;
    nit_ci?: number;
    direccion?: string;
    telefono?: string;
}

interface VentaProducto {
    id: string;
    product_id: number;
    lote_id: number;
    cantidad: number;
    precio_venta: number;
    stock_disponible: number;
    lotes_disponibles: Lote[];
    modo: 'unidad' | 'paquete';
    paquetes?: number;
    producto?: Producto;
}

export default function RealizarVenta() {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Cliente: existente o sin cliente
    const [usarClienteExistente, setUsarClienteExistente] = useState<boolean>(false);
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [tipoVenta, setTipoVenta] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
    const [montoPagado, setMontoPagado] = useState<number>(0);
    const [observaciones, setObservaciones] = useState('');
    
    // Estados para descuento
    const [aplicarDescuento, setAplicarDescuento] = useState<boolean>(false);
    const [tipoDescuento, setTipoDescuento] = useState<'bolivianos' | 'porcentaje'>('bolivianos');
    const [valorDescuento, setValorDescuento] = useState<number>(0);
    
    // Datos
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [todosLotes, setTodosLotes] = useState<Lote[]>([]);
    const [productosVenta, setProductosVenta] = useState<VentaProducto[]>([
        {
            id: '1',
            product_id: 0,
            lote_id: 0,
            cantidad: 1,
            precio_venta: 0,
            stock_disponible: 0,
            lotes_disponibles: [],
            modo: 'unidad',
            paquetes: 1,
        }
    ]);

    useEffect(() => {
        document.title = 'Grupo Vicorsa | Realizar Venta';
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [clientesData, productosData, lotesData] = await Promise.all([
                apiGet<Cliente[]>('/clientes'),
                getAllProducts(),
                getAllLotes(auth?.token),
            ]);
            setClientes(clientesData);
            setProductos(productosData);
            setTodosLotes(lotesData);
        } catch (err) {
            setError('Error al cargar datos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClienteChange = (id: number) => {
        setClienteId(id);
        const cliente = clientes.find(c => c.cliente_id === id);
        setClienteSeleccionado(cliente || null);
    };

    const handleProductoChange = (index: number, field: string, value: any) => {
        const nuevosProductos = [...productosVenta];
        
        if (field === 'product_id') {
            const producto = productos.find(p => p.product_id === value);
            if (producto) {
                // Filtrar lotes de este producto con stock disponible
                const lotesDelProducto = todosLotes.filter(
                    l => l.product_id === value && l.cantidad_actual > 0
                );
                
                nuevosProductos[index].product_id = value;
                nuevosProductos[index].producto = producto;
                nuevosProductos[index].lotes_disponibles = lotesDelProducto;
                
                // Establecer precio según modo actual
                const modoActual = nuevosProductos[index].modo;
                if (modoActual === 'paquete') {
                    nuevosProductos[index].precio_venta = producto.precio_venta_paquete ?? producto.precio;
                } else {
                    nuevosProductos[index].precio_venta = producto.precio;
                }
                
                nuevosProductos[index].cantidad = 1;
                nuevosProductos[index].paquetes = 1;
                
                // Auto-seleccionar el primer lote si existe
                if (lotesDelProducto.length > 0) {
                    const primerLote = lotesDelProducto[0];
                    nuevosProductos[index].lote_id = primerLote.lote_id;
                    
                    // Calcular stock según modo
                    const unidadesPorPaquete = producto.cant_por_paquete || 1;
                    if (modoActual === 'paquete') {
                        // Modo paquete: mostrar paquetes completos disponibles
                        const paquetesDisponibles = Math.floor(primerLote.cantidad_actual / unidadesPorPaquete);
                        nuevosProductos[index].stock_disponible = paquetesDisponibles;
                    } else {
                        // Modo unidad: mostrar unidades totales disponibles
                        nuevosProductos[index].stock_disponible = primerLote.cantidad_actual;
                    }
                } else {
                    nuevosProductos[index].lote_id = 0;
                    nuevosProductos[index].stock_disponible = 0;
                }
            }
        } else if (field === 'lote_id') {
            const lote = nuevosProductos[index].lotes_disponibles.find(l => l.lote_id === value);
            const producto = nuevosProductos[index].producto;
            nuevosProductos[index].lote_id = value;
            
            // Calcular stock según modo
            if (lote && producto) {
                const unidadesPorPaquete = producto.cant_por_paquete || 1;
                if (nuevosProductos[index].modo === 'paquete') {
                    // Modo paquete: paquetes completos
                    const paquetesDisponibles = Math.floor(lote.cantidad_actual / unidadesPorPaquete);
                    nuevosProductos[index].stock_disponible = paquetesDisponibles;
                } else {
                    // Modo unidad: unidades totales
                    nuevosProductos[index].stock_disponible = lote.cantidad_actual;
                }
            } else {
                nuevosProductos[index].stock_disponible = 0;
            }
            
            // Ajustar cantidad si excede el stock
            if (nuevosProductos[index].cantidad > nuevosProductos[index].stock_disponible) {
                nuevosProductos[index].cantidad = nuevosProductos[index].stock_disponible || 1;
            }
            if ((nuevosProductos[index].paquetes ?? 0) > nuevosProductos[index].stock_disponible) {
                nuevosProductos[index].paquetes = nuevosProductos[index].stock_disponible || 1;
            }
        } else if (field === 'cantidad') {
            const cantidad = Math.max(1, parseInt(value) || 1);
            const maxStock = nuevosProductos[index].stock_disponible;
            nuevosProductos[index].cantidad = Math.min(cantidad, maxStock);
        } else if (field === 'paquetes') {
            const paquetes = Math.max(1, parseInt(value) || 1);
            const maxStock = nuevosProductos[index].stock_disponible;
            nuevosProductos[index].paquetes = Math.min(paquetes, maxStock);
        } else if (field === 'modo') {
            const nuevoModo = value as 'unidad' | 'paquete';
            nuevosProductos[index].modo = nuevoModo;
            
            // Actualizar precio según el nuevo modo
            const producto = nuevosProductos[index].producto;
            if (producto) {
                if (nuevoModo === 'paquete') {
                    nuevosProductos[index].precio_venta = producto.precio_venta_paquete ?? producto.precio;
                } else {
                    nuevosProductos[index].precio_venta = producto.precio;
                }
            }
            
            // Recalcular stock disponible según modo
            const lote = nuevosProductos[index].lotes_disponibles.find(l => l.lote_id === nuevosProductos[index].lote_id);
            if (lote && producto) {
                const unidadesPorPaquete = producto.cant_por_paquete || 1;
                if (nuevoModo === 'paquete') {
                    // Modo paquete: paquetes completos
                    const paquetesDisponibles = Math.floor(lote.cantidad_actual / unidadesPorPaquete);
                    nuevosProductos[index].stock_disponible = paquetesDisponibles;
                } else {
                    // Modo unidad: unidades totales
                    nuevosProductos[index].stock_disponible = lote.cantidad_actual;
                }
            }
            
            // Resetear cantidades
            nuevosProductos[index].cantidad = 1;
            nuevosProductos[index].paquetes = 1;
        } else if (field === 'precio_venta') {
            nuevosProductos[index].precio_venta = parseFloat(value) || 0;
        }
        
        setProductosVenta(nuevosProductos);
    };

    const agregarProducto = () => {
        setProductosVenta([
            ...productosVenta,
            {
                id: Date.now().toString(),
                product_id: 0,
                lote_id: 0,
                cantidad: 1,
                precio_venta: 0,
                stock_disponible: 0,
                lotes_disponibles: [],
                modo: 'unidad',
                paquetes: 1,
            }
        ]);
    };

    const eliminarProducto = (index: number) => {
        if (productosVenta.length > 1) {
            setProductosVenta(productosVenta.filter((_, i) => i !== index));
        }
    };

    const calcularSubtotal = (): number => {
        return productosVenta.reduce((sum, item) => {
            if (item.modo === 'paquete') {
                // Precio por paquete * cantidad de paquetes
                const paquetes = item.paquetes ?? 1;
                return sum + (paquetes * item.precio_venta);
            } else {
                // Precio por unidad * cantidad de unidades
                return sum + (item.cantidad * item.precio_venta);
            }
        }, 0);
    };

    const calcularDescuento = (): number => {
        if (!aplicarDescuento || valorDescuento <= 0) return 0;
        
        const subtotal = calcularSubtotal();
        if (tipoDescuento === 'porcentaje') {
            const descuento = subtotal * (valorDescuento / 100);
            return Math.min(descuento, subtotal); // No puede ser mayor al subtotal
        }
        return Math.min(valorDescuento, subtotal); // No puede ser mayor al subtotal
    };

    const calcularTotal = (): number => {
        return Math.max(0, calcularSubtotal() - calcularDescuento());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (productosVenta.some(p => p.product_id === 0 || p.lote_id === 0)) {
            setError('Todos los productos deben tener un lote seleccionado');
            return;
        }

        if (productosVenta.some(p => {
            if (p.modo === 'unidad') {
                return p.cantidad <= 0 || p.cantidad > p.stock_disponible;
            } else {
                return (p.paquetes ?? 0) <= 0;
            }
        })) {
            setError('Verifica las cantidades/paquetes');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const detalles = productosVenta.map(p => {
                if (p.modo === 'paquete') {
                    // Modo paquete: enviar cantidad de paquetes con indicador de modo
                    return {
                        lote_id: p.lote_id,
                        cantidad: p.paquetes ?? 1,
                        modo: 'paquete' as const,
                    };
                } else {
                    // Modo unidad: enviar cantidad de unidades
                    return {
                        lote_id: p.lote_id,
                        cantidad: p.cantidad,
                        modo: 'unidad' as const,
                    };
                }
            });

            // Si se eligió cliente existente, usar su ID; si no, no enviar cliente
            let clienteFinalId: number | undefined = undefined;
            if (usarClienteExistente && clienteId) {
                clienteFinalId = clienteId;
            }

            await createVenta({
                cliente_id: clienteFinalId,
                fecha_venta: new Date().toISOString(),
                tipo_venta: tipoVenta,
                descuento: aplicarDescuento ? calcularDescuento() : 0,
                monto_pagado: tipoVenta === 'CREDITO' ? montoPagado : undefined,
                observaciones,
                detalles,
            }, auth?.token);

            alert('¡Venta registrada exitosamente!');
            navigate('/ventas');
        } catch (err: any) {
            setError(err?.message || 'Error al registrar la venta');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && productos.length === 0) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Realizar Venta</h2>
                    <p className="page-subtitle">Registra una nueva venta de productos</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="compra-form">
                {/* Datos del Cliente */}
                <div className="form-section">
                    <h3 className="section-title">Datos del Cliente</h3>
                    
                    <div className="toggle-group">
                        <label className={`toggle ${!usarClienteExistente ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="clienteToggle"
                                checked={!usarClienteExistente}
                                onChange={() => {
                                    setUsarClienteExistente(false);
                                    setClienteId(null);
                                    setClienteSeleccionado(null);
                                }}
                            />
                            Sin Cliente
                        </label>
                        <label className={`toggle ${usarClienteExistente ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="clienteToggle"
                                checked={usarClienteExistente}
                                onChange={() => setUsarClienteExistente(true)}
                            />
                            Cliente Existente
                        </label>
                    </div>

                    {usarClienteExistente && (
                        <div className="grid-2">
                            <div className="form-group span-2">
                                <label>Seleccionar Cliente *</label>
                                <Autocomplete
                                    options={clientes.map(cliente => ({
                                        value: cliente.cliente_id,
                                        label: cliente.nombre,
                                        subtitle: cliente.nit_ci ? `NIT/CI: ${cliente.nit_ci}` : undefined
                                    }))}
                                    value={clienteId ?? 0}
                                    onChange={(value) => handleClienteChange(typeof value === 'number' ? value : parseInt(value as string))}
                                    placeholder="Buscar cliente..."
                                    required={usarClienteExistente}
                                />
                            </div>

                            {clienteSeleccionado && (
                                <>
                                    <div className="form-group">
                                        <label>NIT/CI</label>
                                        <input
                                            type="text"
                                            className="form-input input-disabled"
                                            value={clienteSeleccionado.nit_ci || '-'}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            className="form-input input-disabled"
                                            value={clienteSeleccionado.telefono || '-'}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group span-2">
                                        <label>Dirección</label>
                                        <input
                                            type="text"
                                            className="form-input input-disabled"
                                            value={clienteSeleccionado.direccion || '-'}
                                            disabled
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Productos - AHORA PRIMERO */}
                <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Productos a Vender</h3>
                        <button type="button" className="btn-icon btn-success" onClick={agregarProducto}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="products-list">
                        {productosVenta.map((item, index) => {
                            const producto = item.producto;
                            const unidadesPorPaquete = producto?.cant_por_paquete ?? 1;
                            
                            return (
                                <div key={item.id} className="product-card">
                                    <div className="product-form-group">
                                        <label>Producto *</label>
                                        <Autocomplete
                                            options={productos.map(prod => ({
                                                value: prod.product_id,
                                                label: prod.nombre,
                                                subtitle: prod.categoria ? `Categoría: ${prod.categoria.nombre}` : undefined
                                            }))}
                                            value={item.product_id}
                                            onChange={(value) => handleProductoChange(index, 'product_id', typeof value === 'number' ? value : parseInt(value as string))}
                                            placeholder="Buscar producto..."
                                            required
                                        />
                                    </div>

                                    <div className="product-form-group">
                                        <label>Modo *</label>
                                        <select
                                            value={item.modo}
                                            onChange={(e) => handleProductoChange(index, 'modo', e.target.value)}
                                        >
                                            <option value="unidad">Por unidad</option>
                                            <option value="paquete">Por paquete</option>
                                        </select>
                                    </div>

                                    {item.modo === 'paquete' && (
                                        <div className="product-form-group">
                                            <label>Paquetes *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.stock_disponible}
                                                value={item.paquetes}
                                                onChange={(e) => handleProductoChange(index, 'paquetes', e.target.value)}
                                                style={{
                                                    borderColor: (item.paquetes ?? 1) > item.stock_disponible ? 'var(--danger, #ef4444)' : undefined
                                                }}
                                                required
                                            />
                                            {(item.paquetes ?? 1) > item.stock_disponible && (
                                                <small style={{ color: 'var(--danger, #ef4444)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                                                    ⚠️ Stock insuficiente. Disponible: {item.stock_disponible} paquetes
                                                </small>
                                            )}
                                        </div>
                                    )}

                                    {item.modo === 'paquete' && (
                                        <div className="product-form-group">
                                            <label>Unidades por paquete</label>
                                            <input
                                                type="text"
                                                value={unidadesPorPaquete}
                                                className="input-disabled"
                                                disabled
                                            />
                                        </div>
                                    )}

                                    <div className="product-form-group">
                                        <label>Lote *</label>
                                        <select
                                            value={item.lote_id}
                                            onChange={(e) => handleProductoChange(index, 'lote_id', Number(e.target.value))}
                                            disabled={item.lotes_disponibles.length === 0}
                                            required
                                        >
                                            <option value={0}>-- Selecciona un lote --</option>
                                            {item.lotes_disponibles.map(lote => (
                                                <option key={lote.lote_id} value={lote.lote_id}>
                                                    Lote #{lote.lote_id} - Stock: {lote.cantidad_actual}
                                                    {lote.fecha_vencimiento && ` - Venc: ${new Date(lote.fecha_vencimiento).toLocaleDateString('es-ES')}`}
                                                </option>
                                            ))}
                                        </select>
                                        {item.product_id > 0 && item.lotes_disponibles.length === 0 && (
                                            <small style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                                                Sin stock disponible
                                            </small>
                                        )}
                                    </div>

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
                                            <strong>{item.stock_disponible}</strong>
                                        </div>
                                    </div>

                                    {item.modo === 'unidad' && (
                                        <div className="product-form-group">
                                            <label>Cantidad *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.stock_disponible}
                                                value={item.cantidad}
                                                onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                                                disabled={item.stock_disponible === 0}
                                                style={{
                                                    borderColor: item.cantidad > item.stock_disponible ? 'var(--danger, #ef4444)' : undefined
                                                }}
                                                required
                                            />
                                            {item.cantidad > item.stock_disponible && (
                                                <small style={{ color: 'var(--danger, #ef4444)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                                                    ⚠️ Stock insuficiente. Disponible: {item.stock_disponible} unidades
                                                </small>
                                            )}
                                        </div>
                                    )}

                                    <div className="product-form-group">
                                        <label>Precio {item.modo === 'paquete' ? 'por Paquete' : 'Unitario'} (Bs.) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={item.precio_venta}
                                            onChange={(e) => handleProductoChange(index, 'precio_venta', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="product-form-group">
                                        <label>Subtotal</label>
                                        <input
                                            type="text"
                                            value={`Bs ${(item.modo === 'paquete' 
                                                ? (item.paquetes ?? 1) * item.precio_venta 
                                                : item.cantidad * item.precio_venta
                                            ).toFixed(2)}`}
                                            className="input-disabled"
                                            disabled
                                        />
                                    </div>

                                    {productosVenta.length > 1 && (
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
                            );
                        })}
                    </div>
                </div>

                {/* Datos de la Venta - AHORA DESPUÉS DE PRODUCTOS */}
                <div className="form-section">
                    <h3 className="section-title">Datos de la Venta</h3>
                    
                    {/* Opciones de Descuento */}
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text)' }}>Aplicar Descuento</h4>
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
                            <label>Tipo de Venta *</label>
                            <select
                                className="form-input"
                                value={tipoVenta}
                                onChange={(e) => {
                                    setTipoVenta(e.target.value as 'CONTADO' | 'CREDITO');
                                    if (e.target.value === 'CONTADO') {
                                        setMontoPagado(0);
                                    }
                                }}
                                required
                            >
                                <option value="CONTADO">Contado</option>
                                <option value="CREDITO">Crédito</option>
                            </select>
                        </div>

                        {tipoVenta === 'CREDITO' && (
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
                                placeholder="Notas adicionales sobre la venta..."
                            />
                        </div>
                    </div>
                </div>

                {/* Resumen Total */}
                <div className="form-section total-section">
                    <div className="total-display">
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
                                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Total de la Venta</h3>
                                <p className="total-amount" style={{ margin: 0 }}>Bs {calcularTotal().toFixed(2)}</p>
                            </div>

                            {tipoVenta === 'CREDITO' && (
                                <>
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                                    <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
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

                {/* Acciones */}
                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => navigate('/ventas')}>
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={loading || productosVenta.some(p => p.stock_disponible === 0)}
                    >
                        {loading ? 'Registrando...' : 'Registrar Venta'}
                    </button>
                </div>
            </form>
        </div>
    );
}
