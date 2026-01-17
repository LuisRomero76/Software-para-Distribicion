import { useState, useEffect } from 'react';
import { createCompra, type DetalleCompra } from '../../services/compraService';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/page.css';
import './compras.css';
import { getAllProveedores, createProveedor, type Proveedor } from '../../services/proveedorService';
import { getAllProducts, type Producto } from '../../services/productService';

// Extend Producto type to include package pricing
interface ProductoExtendido extends Producto {
    precio_compra_paquete?: number;
}

interface CompraProducto extends DetalleCompra {
    id: string; // ID temporal para el formulario
    modo: 'unidad' | 'paquete';
    paquetes?: number; // solo si modo = paquete
    fecha_vencimiento?: string;
    producto?: ProductoExtendido; // Override del tipo heredado
}

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
    
    // Productos y proveedores
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<ProductoExtendido[]>([]);
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
            setProductos(prod as ProductoExtendido[]);
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

    const calcularTotal = (): number => {
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
                        fecha_vencimiento: p.fecha_vencimiento || undefined,
                        modo: 'paquete' as const,
                    };
                } else {
                    // Modo unidad: guardar cantidad de unidades y precio por unidad
                    return {
                        product_id: p.producto_id,
                        cantidad: p.cantidad,
                        precio_unitario: parseFloat(String(p.precio_compra)),
                        fecha_vencimiento: p.fecha_vencimiento || undefined,
                        modo: 'unidad' as const,
                    };
                }
            });

            console.log('Detalles a enviar:', JSON.stringify(detalles, null, 2));

            await createCompra({
                proveedor_id: proveedorFinalId,
                tipo_compra: tipoCompra,
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

    const total = calcularTotal();

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
                {/* Datos Generales */}
                <div className="form-section">
                    <h3 className="section-title">Datos de la Compra</h3>
                    
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Proveedor</label>
                            <div className="toggle-group">
                                <label className={`toggle ${usarProveedorExistente ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="proveedor-mode"
                                        checked={usarProveedorExistente}
                                        onChange={() => setUsarProveedorExistente(true)}
                                    />
                                    Existente
                                </label>
                                <label className={`toggle ${!usarProveedorExistente ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="proveedor-mode"
                                        checked={!usarProveedorExistente}
                                        onChange={() => setUsarProveedorExistente(false)}
                                    />
                                    Nuevo / Sin proveedor
                                </label>
                            </div>
                        </div>
                    </div>

                    {usarProveedorExistente ? (
                        <div className="form-group">
                            <label htmlFor="proveedor">Selecciona proveedor (opcional)</label>
                            <select
                                id="proveedor"
                                value={proveedorId ?? ''}
                                onChange={(e) => {
                                    const idVal = e.target.value ? parseInt(e.target.value) : NaN;
                                    if (!isNaN(idVal)) {
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
                            >
                                <option value="">(Sin proveedor)</option>
                                {proveedores.map(prov => (
                                    <option key={prov.proveedor_id} value={prov.proveedor_id}>
                                        {prov.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {/* Datos del proveedor (auto-relleno si se selecciona existente, editables si nuevo) */}
                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="prov-nombre">Nombre del proveedor/empresa</label>
                            <input
                                id="prov-nombre"
                                type="text"
                                value={nuevoProveedor.nombre ?? ''}
                                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
                                disabled={usarProveedorExistente && !!proveedorSeleccionado}
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="prov-nit-ci">NIT/CI</label>
                            <input
                                id="prov-nit-ci"
                                type="text"
                                value={nuevoProveedor.nit_ci ?? ''}
                                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nit_ci: e.target.value })}
                                disabled={usarProveedorExistente && !!proveedorSeleccionado}
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="prov-email">Email</label>
                            <input
                                id="prov-email"
                                type="email"
                                value={nuevoProveedor.email ?? ''}
                                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, email: e.target.value })}
                                disabled={usarProveedorExistente && !!proveedorSeleccionado}
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="prov-telefono">Teléfono</label>
                            <input
                                id="prov-telefono"
                                type="text"
                                value={nuevoProveedor.telefono ?? ''}
                                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
                                disabled={usarProveedorExistente && !!proveedorSeleccionado}
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="form-group span-2">
                            <label htmlFor="prov-ciudad">Ciudad</label>
                            <input
                                id="prov-ciudad"
                                type="text"
                                value={nuevoProveedor.ciudad ?? ''}
                                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, ciudad: e.target.value })}
                                disabled={usarProveedorExistente && !!proveedorSeleccionado}
                                placeholder="Opcional"
                            />
                        </div>
                                                {!usarProveedorExistente && (
                                                    <div className="form-actions span-2" style={{ justifyContent: 'flex-start' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-success"
                                                            onClick={async () => {
                                                                try {
                                                                    setLoading(true);
                                                                    const creado = await createProveedor({
                                                                        nombre: (nuevoProveedor.nombre ?? '').trim(),
                                                                        nit_ci: nuevoProveedor.nit_ci ?? '',
                                                                        email: nuevoProveedor.email ?? '',
                                                                        telefono: nuevoProveedor.telefono ?? '',
                                                                        ciudad: nuevoProveedor.ciudad ?? '',
                                                                    });
                                                                    const provLista = await getAllProveedores();
                                                                    setProveedores(provLista);
                                                                    setProveedorId(creado.proveedor_id);
                                                                    setUsarProveedorExistente(true);
                                                                    setProveedorSeleccionado(creado);
                                                                    setError(null);
                                                                } catch (err) {
                                                                    setError('Error al crear el proveedor');
                                                                    console.error(err);
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                        >
                                                            Guardar proveedor
                                                        </button>
                                                    </div>
                                                )}
                    </div>

                    {/* Tipo de Compra y Monto Pagado */}
                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="tipo-compra">Tipo de Compra *</label>
                            <select
                                id="tipo-compra"
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
                            <div className="form-group">
                                <label htmlFor="monto-pagado">Monto Pagado (Bs.)</label>
                                <input
                                    id="monto-pagado"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={calcularTotal()}
                                    value={montoPagado || ''}
                                    onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                                <small style={{ color: 'var(--text-secondary)' }}>
                                    Máximo: Bs {calcularTotal().toFixed(2)}
                                </small>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="observaciones">Observaciones</label>
                        <textarea
                            id="observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Ingresa observaciones (opcional)"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Productos */}
                <div className="form-section">
                    <h3 className="section-title">Productos</h3>
                    <div className="products-list">
                        {productosCompra.map((producto, index) => (
                            <div key={producto.id} className="product-card">
                                <div className="product-form-group">
                                    <label htmlFor={`producto-${index}`}>Producto *</label>
                                    <select
                                        id={`producto-${index}`}
                                        value={producto.producto_id}
                                        onChange={(e) => handleProductoChange(index, 'producto_id', parseInt(e.target.value))}
                                        required
                                    >
                                        <option value={0}>Selecciona un producto</option>
                                        {productos.map(prod => (
                                            <option key={prod.product_id} value={prod.product_id}>
                                                {prod.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="product-form-group">
                                    <label htmlFor={`modo-${index}`}>Modo</label>
                                    <select
                                        id={`modo-${index}`}
                                        value={producto.modo}
                                        onChange={(e) => handleProductoChange(index, 'modo', e.target.value)}
                                    >
                                        <option value="unidad">Por unidad</option>
                                        <option value="paquete">Por paquete</option>
                                    </select>
                                </div>

                                {producto.modo === 'unidad' ? (
                                    <div className="product-form-group">
                                        <label htmlFor={`cantidad-${index}`}>Cantidad *</label>
                                        <input
                                            id={`cantidad-${index}`}
                                            type="number"
                                            min="1"
                                            value={producto.cantidad}
                                            onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                                            required
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="product-form-group">
                                            <label htmlFor={`paquetes-${index}`}>Paquetes *</label>
                                            <input
                                                id={`paquetes-${index}`}
                                                type="number"
                                                min="1"
                                                value={producto.paquetes ?? 1}
                                                onChange={(e) => handleProductoChange(index, 'paquetes', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="product-form-group">
                                            <label>Unidades por paquete</label>
                                            <input
                                                type="text"
                                                value={producto.producto?.cant_por_paquete ?? 1}
                                                disabled
                                                className="input-disabled"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="product-form-group">
                                    <label htmlFor={`vencimiento-${index}`}>Fecha de Vencimiento</label>
                                    <input
                                        id={`vencimiento-${index}`}
                                        type="date"
                                        value={producto.fecha_vencimiento || ''}
                                        onChange={(e) => handleProductoChange(index, 'fecha_vencimiento', e.target.value)}
                                    />
                                </div>

                                <div className="product-form-group">
                                    <label htmlFor={`precio-${index}`}>Precio de Compra *</label>
                                    <input
                                        id={`precio-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={producto.precio_compra}
                                        onChange={(e) => handleProductoChange(index, 'precio_compra', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="product-form-group">
                                    <label>Subtotal</label>
                                    <input
                                        type="text"
                                        value={`BS. ${(producto.modo === 'paquete' 
                                            ? (producto.paquetes ?? 1) * producto.precio_compra 
                                            : producto.cantidad * producto.precio_compra
                                        ).toFixed(2)}`}
                                        disabled
                                        className="input-disabled"
                                    />
                                </div>

                                {productosCompra.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => eliminarProducto(index)}
                                        className="btn-icon btn-danger"
                                        title="Eliminar producto"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={agregarProducto}
                        className="btn btn-secondary"
                    >
                        <Plus size={18} /> Agregar Más Productos
                    </button>
                </div>

                {/* Total */}
                <div className="form-section total-section">
                    <div className="total-display">
                        <h3>Total de la Compra</h3>
                        <p className="total-amount">BS. {total.toFixed(2)}</p>
                        {tipoCompra === 'CREDITO' && (
                            <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Monto a pagar ahora:</span>
                                    <strong style={{ color: 'var(--success)' }}>Bs {montoPagado.toFixed(2)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Monto adeudado:</span>
                                    <strong style={{ color: 'var(--warning)' }}>Bs {(total - montoPagado).toFixed(2)}</strong>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones */}
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
