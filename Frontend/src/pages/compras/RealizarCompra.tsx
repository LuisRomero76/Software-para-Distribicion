import { useState, useEffect } from 'react';
import { createCompra, type DetalleCompra } from '../../services/compraService';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/page.css';
import './compras.css';
import { getAllProveedores, createProveedor, type Proveedor } from '../../services/proveedorService';
import { getAllProducts, type Producto } from '../../services/productService';
import Autocomplete from '../../components/Autocomplete';

interface CompraProducto extends DetalleCompra {
    id: string; // ID temporal para el formulario
    modo: 'unidad' | 'paquete';
    paquetes?: number; // solo si modo = paquete
    fecha_vencimiento?: string;
    producto?: Producto; // Override del tipo heredado
}

/**
 * Convierte una fecha de input (YYYY-MM-DD) a formato ISO con hora local de mediodía
 * Esto evita problemas de zona horaria donde el día cambia al convertir a UTC
 */
const formatearFechaParaBackend = (fecha: string): string | undefined => {
    if (!fecha || fecha.trim() === '') return undefined;
    
    // Crear fecha con hora de mediodía para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);
    return fechaLocal.toISOString();
};

export default function RealizarCompra() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Proveedor: existente o nuevo (opcional)
    const [usarProveedorExistente, setUsarProveedorExistente] = useState<boolean>(false);
    const [proveedorId, setProveedorId] = useState<number | null>(null);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
    const [nuevoProveedor, setNuevoProveedor] = useState<Partial<Proveedor>>({
        nombre: '',
        nit_ci: '',
        email: '',
        telefono: '',
        ciudad: '',
    });
    
    // Tipo de compra y pago
    const [tipoCompra, setTipoCompra] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
    const [montoPagado, setMontoPagado] = useState<number>(0);
    
    // Fecha se define automáticamente al registrar
    const [observaciones, setObservaciones] = useState('');
    
    // Estados para descuento
    const [aplicarDescuento, setAplicarDescuento] = useState<boolean>(false);
    const [tipoDescuento, setTipoDescuento] = useState<'bolivianos' | 'porcentaje'>('bolivianos');
    const [valorDescuento, setValorDescuento] = useState<number>(0);
    
    // Productos y proveedores
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosCompra, setProductosCompra] = useState<CompraProducto[]>([
        {
            id: '1',
            producto_id: 0,
            cantidad: 1,
            precio_compra: 0,
            modo: 'unidad',
            paquetes: 1,
            fecha_vencimiento: '',
        }
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prov, prod] = await Promise.all([
                getAllProveedores(),
                getAllProducts(),
            ]);
            setProveedores(prov);
            setProductos(prod);
        } catch (err) {
            setError('Error al cargar datos');
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
                nuevosProductos[index].producto_id = value;
                nuevosProductos[index].producto = producto;
                // Establecer precio según modo actual
                const modoActual = nuevosProductos[index].modo;
                if (modoActual === 'paquete') {
                    nuevosProductos[index].precio_compra = producto.precio_compra_paquete ?? 0;
                } else {
                    nuevosProductos[index].precio_compra = producto.precio_compra ?? 0;
                }
                // reset por si cambió el modo
                nuevosProductos[index].cantidad = 1;
                nuevosProductos[index].paquetes = 1;
            }
        } else if (field === 'cantidad') {
            nuevosProductos[index].cantidad = Math.max(1, parseInt(value) || 0);
        } else if (field === 'paquetes') {
            nuevosProductos[index].paquetes = Math.max(1, parseInt(value) || 0);
        } else if (field === 'modo') {
            const nuevoModo = value as 'unidad' | 'paquete';
            nuevosProductos[index].modo = nuevoModo;
            // Actualizar precio según el nuevo modo
            const producto = nuevosProductos[index].producto;
            if (producto) {
                if (nuevoModo === 'paquete') {
                    nuevosProductos[index].precio_compra = producto.precio_compra_paquete ?? 0;
                } else {
                    nuevosProductos[index].precio_compra = producto.precio_compra ?? 0;
                }
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
                // Precio por paquete * cantidad de paquetes
                const paquetes = item.paquetes ?? 1;
                return sum + (paquetes * item.precio_compra);
            } else {
                // Precio por unidad * cantidad de unidades
                return sum + (item.cantidad * item.precio_compra);
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
        
        // Proveedor opcional: se permite sin proveedor

        if (productosCompra.some(p => p.producto_id === 0)) {
            setError('Todos los productos deben estar seleccionados');
            return;
        }

        if (productosCompra.some(p => (p.modo === 'unidad' ? p.cantidad <= 0 : (p.paquetes ?? 0) <= 0) || p.precio_compra <= 0)) {
            setError('Cantidad/Paquetes y precio deben ser mayores a 0');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Si se eligió proveedor existente, usar su ID; si no, intentar crear nuevo si hay datos
            let proveedorFinalId: number | undefined = undefined;
            if (usarProveedorExistente && proveedorId) {
                proveedorFinalId = proveedorId;
            } else {
                // Crear proveedor si al menos hay nombre
                const tieneDatosProveedor = (nuevoProveedor.nombre && nuevoProveedor.nombre.trim().length > 0) ||
                    nuevoProveedor.nit_ci || nuevoProveedor.email || nuevoProveedor.telefono || nuevoProveedor.ciudad;
                if (tieneDatosProveedor) {
                    const creado = await createProveedor({
                        nombre: nuevoProveedor.nombre ?? '',
                        nit_ci: nuevoProveedor.nit_ci ?? '',
                        email: nuevoProveedor.email ?? '',
                        telefono: nuevoProveedor.telefono ?? '',
                        ciudad: nuevoProveedor.ciudad ?? '',
                    });
                    proveedorFinalId = creado.proveedor_id;
                }
            }

            const detalles = productosCompra.map(p => {
                if (p.modo === 'paquete') {
                    // Modo paquete: guardar cantidad de paquetes y precio por paquete con indicador de modo
                    return {
                        product_id: p.producto_id,
                        cantidad: p.paquetes ?? 1,
                        precio_unitario: parseFloat(String(p.precio_compra)),
                        fecha_vencimiento: formatearFechaParaBackend(p.fecha_vencimiento || ''),
                        modo: 'paquete' as const,
                    };
                } else {
                    // Modo unidad: guardar cantidad de unidades y precio por unidad
                    return {
                        product_id: p.producto_id,
                        cantidad: p.cantidad,
                        precio_unitario: parseFloat(String(p.precio_compra)),
                        fecha_vencimiento: formatearFechaParaBackend(p.fecha_vencimiento || ''),
                        modo: 'unidad' as const,
                    };
                }
            });

            console.log('Detalles a enviar:', JSON.stringify(detalles, null, 2));

            await createCompra({
                proveedor_id: proveedorFinalId,
                tipo_compra: tipoCompra,
                descuento: aplicarDescuento ? calcularDescuento() : 0,
                monto_pagado: tipoCompra === 'CONTADO' ? calcularTotal() : montoPagado,
                observaciones,
                detalles,
            });

            alert('¡Compra registrada exitosamente!');
            navigate('/compras');
        } catch (err) {
            setError('Error al registrar la compra');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && proveedores.length === 0) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Realizar Compra</h2>
                    <p className="page-subtitle">Registra una nueva compra de productos</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="compra-form">
                {/* Datos del Proveedor */}
                <div className="form-section">
                    <h3 className="section-title">Datos del Proveedor</h3>
                    
                    <div className="toggle-group">
                        <label className={`toggle ${!usarProveedorExistente ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="proveedorToggle"
                                checked={!usarProveedorExistente}
                                onChange={() => {
                                    setUsarProveedorExistente(false);
                                    setProveedorId(null);
                                    setProveedorSeleccionado(null);
                                }}
                            />
                            Sin Proveedor
                        </label>
                        <label className={`toggle ${usarProveedorExistente ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="proveedorToggle"
                                checked={usarProveedorExistente}
                                onChange={() => setUsarProveedorExistente(true)}
                            />
                            Proveedor Existente
                        </label>
                    </div>

                    {usarProveedorExistente && (
                        <div className="grid-2">
                            <div className="form-group span-2">
                                <label htmlFor="proveedor">Seleccionar Proveedor *</label>
                                <Autocomplete
                                    id="proveedor"
                                    options={proveedores.map(prov => ({
                                        value: prov.proveedor_id,
                                        label: prov.nombre,
                                        subtitle: prov.nit_ci ? `NIT/CI: ${prov.nit_ci}` : undefined
                                    }))}
                                    value={proveedorId ?? 0}
                                    onChange={(value) => {
                                        const idVal = typeof value === 'number' ? value : parseInt(value as string);
                                        if (idVal > 0) {
                                            setProveedorId(idVal);
                                            const prov = proveedores.find(p => p.proveedor_id === idVal) ?? null;
                                            setProveedorSeleccionado(prov);
                                            setNuevoProveedor({
                                                nombre: prov?.nombre ?? '',
                                                nit_ci: (prov as any)?.nit_ci ?? '',
                                                email: prov?.email ?? '',
                                                telefono: prov?.telefono ?? '',
                                                ciudad: prov?.ciudad ?? '',
                                            });
                                        } else {
                                            setProveedorId(null);
                                            setProveedorSeleccionado(null);
                                            setNuevoProveedor({ nombre: '', nit_ci: '', email: '', telefono: '', ciudad: '' });
                                        }
                                    }}
                                    placeholder="Buscar proveedor..."
                                    required={usarProveedorExistente}
                                />
                            </div>

                            {proveedorSeleccionado && (
                                <>
                                    <div className="form-group">
                                        <label>NIT/CI</label>
                                        <input
                                            type="text"
                                            className="form-input input-disabled"
                                            value={proveedorSeleccionado.nit_ci || '-'}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            className="form-input input-disabled"
                                            value={proveedorSeleccionado.telefono || '-'}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-input input-disabled"
                                            value={proveedorSeleccionado.email || '-'}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Ciudad</label>
                                        <input
                                            type="text"
                                            className="form-input input-disabled"
                                            value={proveedorSeleccionado.ciudad || '-'}
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
                        <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Productos a Comprar</h3>
                        <button type="button" className="btn-icon btn-success" onClick={agregarProducto}>
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="products-list">
                        {productosCompra.map((item, index) => {
                            const producto = item.producto;
                            const unidadesPorPaquete = producto?.cant_por_paquete ?? 1;
                            
                            return (
                                <div key={item.id} className="product-card">
                                    <div className="product-form-group">
                                        <label htmlFor={`producto-${index}`}>Producto *</label>
                                        <Autocomplete
                                            id={`producto-${index}`}
                                            options={productos.map(prod => ({
                                                value: prod.product_id,
                                                label: prod.nombre,
                                                subtitle: prod.categoria ? `Categoría: ${prod.categoria.nombre}` : undefined
                                            }))}
                                            value={item.producto_id}
                                            onChange={(value) => handleProductoChange(index, 'producto_id', typeof value === 'number' ? value : parseInt(value as string))}
                                            placeholder="Buscar producto..."
                                            required
                                        />
                                    </div>

                                    <div className="product-form-group">
                                        <label htmlFor={`modo-${index}`}>Modo *</label>
                                        <select
                                            id={`modo-${index}`}
                                            value={item.modo}
                                            onChange={(e) => handleProductoChange(index, 'modo', e.target.value)}
                                        >
                                            <option value="unidad">Por unidad</option>
                                            <option value="paquete">Por paquete</option>
                                        </select>
                                    </div>

                                    {item.modo === 'paquete' && (
                                        <div className="product-form-group">
                                            <label htmlFor={`paquetes-${index}`}>Paquetes *</label>
                                            <input
                                                id={`paquetes-${index}`}
                                                type="number"
                                                min="1"
                                                value={item.paquetes ?? 1}
                                                onChange={(e) => handleProductoChange(index, 'paquetes', e.target.value)}
                                                required
                                            />
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

                                    {item.modo === 'unidad' && (
                                        <div className="product-form-group">
                                            <label htmlFor={`cantidad-${index}`}>Cantidad *</label>
                                            <input
                                                id={`cantidad-${index}`}
                                                type="number"
                                                min="1"
                                                value={item.cantidad}
                                                onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="product-form-group">
                                        <label htmlFor={`vencimiento-${index}`}>Fecha de Vencimiento</label>
                                        <input
                                            id={`vencimiento-${index}`}
                                            type="date"
                                            value={item.fecha_vencimiento || ''}
                                            onChange={(e) => handleProductoChange(index, 'fecha_vencimiento', e.target.value)}
                                        />
                                    </div>

                                    <div className="product-form-group">
                                        <label htmlFor={`precio-${index}`}>Precio {item.modo === 'paquete' ? 'por Paquete' : 'Unitario'} (Bs.) *</label>
                                        <input
                                            id={`precio-${index}`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={item.precio_compra}
                                            onChange={(e) => handleProductoChange(index, 'precio_compra', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="product-form-group">
                                        <label>Subtotal</label>
                                        <input
                                            type="text"
                                            value={`Bs ${(item.modo === 'paquete' 
                                                ? (item.paquetes ?? 1) * item.precio_compra 
                                                : item.cantidad * item.precio_compra
                                            ).toFixed(2)}`}
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
                            );
                        })}
                    </div>
                </div>

                {/* Datos de la Compra - AHORA DESPUÉS DE PRODUCTOS */}
                <div className="form-section">
                    <h3 className="section-title">Datos de la Compra</h3>
                    
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
                            <label htmlFor="tipo-compra">Tipo de Compra *</label>
                            <select
                                id="tipo-compra"
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
                                    <label htmlFor="monto-pagado">Monto Adelantado (Bs.)</label>
                                    <input
                                        id="monto-pagado"
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
                            <label htmlFor="observaciones">Observaciones</label>
                            <textarea
                                id="observaciones"
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

                            <div style={{ height: '1px', background: 'var(--text)', margin: '0.5rem 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Total de la Compra</h3>
                                <p className="total-amount" style={{ margin: 0 }}>Bs {calcularTotal().toFixed(2)}</p>
                            </div>

                            {tipoCompra === 'CREDITO' && (
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
                    <button
                        type="button"
                        onClick={() => navigate('/compras')}
                        className="btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrar Compra'}
                    </button>
                </div>
            </form>
        </div>
    );
}
