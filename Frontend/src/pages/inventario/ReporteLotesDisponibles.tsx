import { useState, useEffect } from 'react';
import { getLotesDisponibles, type Lote } from '../../services/loteService';
import { Package, DollarSign, AlertCircle, FileText, Download, TrendingUp, Box } from 'lucide-react';
import '../../styles/page.css';

// Helper para formatear fecha sin problemas de zona horaria
const   formatearFecha = (fecha: string | Date) => {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    
    // Si es solo fecha (YYYY-MM-DD) o timestamp ISO, extraer la fecha directamente
    if (fechaStr.includes('T')) {
        // Es un timestamp completo, extraer solo la parte de la fecha
        const [fechaParte] = fechaStr.split('T');
        const [year, month, day] = fechaParte.split('-').map(Number);
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${day} ${meses[month - 1]} ${year}`;
    } else {
        // Es solo fecha YYYY-MM-DD
        const [year, month, day] = fechaStr.split('-').map(Number);
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${day} ${meses[month - 1]} ${year}`;
    }
};

export default function ReporteLotesDisponibles() {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroProducto, setFiltroProducto] = useState('');
    const [filtroVencimiento, setFiltroVencimiento] = useState<'todos' | 'proximos' | 'vencidos'>('todos');

    useEffect(() => {
        cargarLotes();
    }, []);

    const cargarLotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getLotesDisponibles();
            setLotes(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar los lotes');
            console.error('Error al cargar lotes:', err);
        } finally {
            setLoading(false);
        }
    };

    const lotesFiltrados = lotes.filter(lote => {
        // Filtro por nombre de producto
        const cumpleNombre = filtroProducto === '' || 
            lote.producto?.nombre.toLowerCase().includes(filtroProducto.toLowerCase());

        // Filtro por vencimiento
        let cumpleVencimiento = true;
        if (filtroVencimiento !== 'todos' && lote.fecha_vencimiento) {
            const hoy = new Date();
            const vencimiento = new Date(lote.fecha_vencimiento);
            const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

            if (filtroVencimiento === 'proximos') {
                cumpleVencimiento = diasParaVencer <= 30 && diasParaVencer >= 0;
            } else if (filtroVencimiento === 'vencidos') {
                cumpleVencimiento = diasParaVencer < 0;
            }
        }

        return cumpleNombre && cumpleVencimiento;
    });

    const calcularValorInventario = (lote: Lote) => {
        // cantidad_actual ya está en unidades totales
        const totalUnidades = lote.cantidad_actual;
        const costoUnitario = typeof lote.costo_unitario === 'string' ? parseFloat(lote.costo_unitario) : lote.costo_unitario;
        return (totalUnidades * costoUnitario).toFixed(2);
    };

    const calcularTotalInventario = () => {
        return lotesFiltrados.reduce((total, lote) => {
            return total + parseFloat(calcularValorInventario(lote));
        }, 0).toFixed(2);
    };

    const calcularTotalUnidades = () => {
        return lotesFiltrados.reduce((total, lote) => {
            // cantidad_actual ya está en unidades totales
            return total + lote.cantidad_actual;
        }, 0);
    };

    const obtenerEstadoVencimiento = (fechaVencimiento?: string) => {
        if (!fechaVencimiento) return { estado: 'sin-fecha', texto: 'Sin fecha', clase: '' };

        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        if (diasParaVencer < 0) {
            return { estado: 'vencido', texto: `Vencido hace ${Math.abs(diasParaVencer)} días`, clase: 'vencido' };
        } else if (diasParaVencer <= 7) {
            return { estado: 'critico', texto: `Vence en ${diasParaVencer} días`, clase: 'critico' };
        } else if (diasParaVencer <= 30) {
            return { estado: 'proximo', texto: `Vence en ${diasParaVencer} días`, clase: 'proximo' };
        } else {
            return { estado: 'normal', texto: `Vence en ${diasParaVencer} días`, clase: '' };
        }
    };

    const exportarAExcel = () => {
        // Crear tabla HTML
        let html = '<table>';
        
        // Encabezados
        html += '<thead><tr>';
        const headers = ['ID Lote', 'Producto', 'Categoría', 'Paquetes', 'Unidades Sueltas', 'Total Unidades', 'Costo Unitario', 'Valor Total', 'Fecha Ingreso', 'Fecha Vencimiento', 'Estado'];
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead>';
        
        // Filas de datos
        html += '<tbody>';
        lotesFiltrados.forEach(lote => {
            // cantidad_actual ya está en unidades totales
            const cantPorPaquete = lote.producto?.cant_por_paquete || 1;
            const paquetes = Math.floor(lote.cantidad_actual / cantPorPaquete);
            const unidadesSueltas = lote.cantidad_actual % cantPorPaquete;
            const totalUnidades = lote.cantidad_actual;
            const estadoVenc = obtenerEstadoVencimiento(lote.fecha_vencimiento);
            const costoUnitario = typeof lote.costo_unitario === 'string' ? parseFloat(lote.costo_unitario) : lote.costo_unitario;
            
            html += '<tr>';
            html += `<td>${lote.lote_id}</td>`;
            html += `<td>${lote.producto?.nombre || 'N/A'}</td>`;
            html += `<td>${lote.producto?.categoria?.nombre || 'N/A'}</td>`;
            html += `<td>${paquetes}</td>`;
            html += `<td>${unidadesSueltas}</td>`;
            html += `<td>${totalUnidades}</td>`;
            html += `<td>${costoUnitario.toFixed(2)}</td>`;
            html += `<td>${calcularValorInventario(lote)}</td>`;
            html += `<td>${formatearFecha(lote.fecha_ingreso)}</td>`;
            html += `<td>${lote.fecha_vencimiento ? formatearFecha(lote.fecha_vencimiento) : 'N/A'}</td>`;
            html += `<td>${estadoVenc.texto}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';

        // Crear blob con formato Excel
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_lotes_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-state">Cargando lotes disponibles...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="alert alert-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        <FileText size={28} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Reporte de Lotes Disponibles
                    </h2>
                    <p className="page-subtitle">Inventario completo de productos en stock</p>
                </div>
                <button className="btn-primary" onClick={exportarAExcel}>
                    <Download size={18} />
                    Exportar Excel
                </button>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="form-section">
                <h3 className="section-title">
                    <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Resumen General
                </h3>
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div className="financial-card">
                        <div className="financial-label">
                            <Box size={18} style={{ marginRight: '0.5rem' }} />
                            Total de Lotes
                        </div>
                        <div className="financial-value">{lotesFiltrados.length}</div>
                    </div>

                    <div className="financial-card">
                        <div className="financial-label">
                            <Package size={18} style={{ marginRight: '0.5rem' }} />
                            Total de Unidades
                        </div>
                        <div className="financial-value">{calcularTotalUnidades()}</div>
                    </div>

                    <div className="financial-card total">
                        <div className="financial-label">
                            <DollarSign size={18} style={{ marginRight: '0.5rem' }} />
                            Valor del Inventario
                        </div>
                        <div className="financial-value">Bs {calcularTotalInventario()}</div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="form-section">
                <h3 className="section-title">Filtros de Búsqueda</h3>
                <div className="grid-2">
                    <div className="form-group">
                        <label>Buscar Producto</label>
                        <input
                            type="text"
                            placeholder="Nombre del producto..."
                            value={filtroProducto}
                            onChange={(e) => setFiltroProducto(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Filtrar por Vencimiento</label>
                        <select
                            value={filtroVencimiento}
                            onChange={(e) => setFiltroVencimiento(e.target.value as any)}
                            className="form-input"
                        >
                            <option value="todos">Todos los lotes</option>
                            <option value="proximos">Próximos a vencer (30 días)</option>
                            <option value="vencidos">Vencidos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla de Lotes */}
            <div className="form-section">
                <h3 className="section-title">
                    <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Listado de Lotes ({lotesFiltrados.length})
                </h3>
                {lotesFiltrados.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} style={{ opacity: 0.3 }} />
                        <p>No se encontraron lotes con los filtros aplicados</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th className="text-center">Paquetes</th>
                                <th className="text-center">Unidades Sueltas</th>
                                <th className="text-center">Total Unidades</th>
                                <th className="text-right">Costo Unit.</th>
                                <th className="text-right">Valor Total</th>
                                <th className="text-center">Fecha Ingreso</th>
                                <th className="text-center">Fecha Vencimiento</th>
                                <th className="text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotesFiltrados.map(lote => {
                                const cantPorPaquete = lote.producto?.cant_por_paquete || 1;
                                const paquetes = Math.floor(lote.cantidad_actual / cantPorPaquete);
                                const unidadesSueltas = lote.cantidad_actual % cantPorPaquete;
                                const totalUnidades = lote.cantidad_actual;
                                const estadoVenc = obtenerEstadoVencimiento(lote.fecha_vencimiento);
                                const costoUnitario = typeof lote.costo_unitario === 'string' ? parseFloat(lote.costo_unitario) : lote.costo_unitario;

                                return (
                                    <tr key={lote.lote_id}>
                                        <td className="id-col">#{lote.lote_id}</td>
                                        <td>
                                            <div>
                                                <strong>{lote.producto?.nombre || 'N/A'}</strong>
                                                {lote.producto?.categoria && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        {lote.producto.categoria.nombre}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-center">{paquetes}</td>
                                        <td className="text-center">{unidadesSueltas}</td>
                                        <td className="text-center"><strong>{totalUnidades}</strong></td>
                                        <td className="text-right">Bs {costoUnitario.toFixed(2)}</td>
                                        <td className="text-right">
                                            <strong style={{ color: 'var(--primary)' }}>
                                                Bs {calcularValorInventario(lote)}
                                            </strong>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-info">
                                                {new Date(lote.fecha_ingreso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {lote.fecha_vencimiento ? (
                                                <span className="badge badge-info">
                                                    {}
                                                    {formatearFecha(lote.fecha_vencimiento)}
                                                </span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <span className={`badge ${
                                                estadoVenc.estado === 'vencido' ? 'badge-danger' :
                                                estadoVenc.estado === 'critico' ? 'badge-warning' :
                                                estadoVenc.estado === 'proximo' ? 'badge-info' :
                                                'badge-success'
                                            }`}>
                                                {estadoVenc.estado !== 'sin-fecha' && <AlertCircle size={12} style={{ marginRight: '0.25rem' }} />}
                                                {estadoVenc.texto}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
