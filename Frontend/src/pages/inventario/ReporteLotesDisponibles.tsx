import { useState, useEffect } from 'react';
import { getLotesDisponibles, type Lote } from '../../services/loteService';
import { Package, Calendar, DollarSign, AlertCircle, FileText, Download } from 'lucide-react';
import '../../styles/ReporteLotesDisponibles.css';

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
            html += `<td>${new Date(lote.fecha_ingreso).toLocaleDateString()}</td>`;
            html += `<td>${lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString() : 'N/A'}</td>`;
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
            <div className="reporte-lotes-container">
                <div className="loading-message">Cargando lotes disponibles...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reporte-lotes-container">
                <div className="error-message">
                    <AlertCircle size={24} />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="reporte-lotes-container">
            <div className="reporte-header">
                <div className="header-title">
                    <FileText size={28} />
                    <h1>Reporte de Lotes Disponibles</h1>
                </div>
                <button className="btn-exportar" onClick={exportarAExcel}>
                    <Download size={18} />
                    Exportar Excel
                </button>
            </div>

            <div className="resumen-cards">
                <div className="resumen-card">
                    <div className="card-icon">
                        <Package size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Total Lotes</span>
                        <span className="card-value">{lotesFiltrados.length}</span>
                    </div>
                </div>
                <div className="resumen-card">
                    <div className="card-icon">
                        <Package size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Total Unidades</span>
                        <span className="card-value">{calcularTotalUnidades()}</span>
                    </div>
                </div>
                <div className="resumen-card">
                    <div className="card-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Valor Inventario</span>
                        <span className="card-value">${calcularTotalInventario()}</span>
                    </div>
                </div>
            </div>

            <div className="filtros-section">
                <input
                    type="text"
                    placeholder="Buscar por nombre de producto..."
                    value={filtroProducto}
                    onChange={(e) => setFiltroProducto(e.target.value)}
                    className="filtro-input"
                />
                <select
                    value={filtroVencimiento}
                    onChange={(e) => setFiltroVencimiento(e.target.value as any)}
                    className="filtro-select"
                >
                    <option value="todos">Todos los lotes</option>
                    <option value="proximos">Próximos a vencer (30 días)</option>
                    <option value="vencidos">Vencidos</option>
                </select>
            </div>

            <div className="tabla-container">
                <table className="lotes-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>Paquetes</th>
                            <th>Unidades Sueltas</th>
                            <th>Total Unidades</th>
                            <th>Costo Unit.</th>
                            <th>Valor Total</th>
                            <th>Fecha Ingreso</th>
                            <th>Fecha Vencimiento</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lotesFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="no-data">
                                    No se encontraron lotes disponibles
                                </td>
                            </tr>
                        ) : (
                            lotesFiltrados.map(lote => {
                                // cantidad_actual ya está en unidades totales
                                const cantPorPaquete = lote.producto?.cant_por_paquete || 1;
                                const paquetes = Math.floor(lote.cantidad_actual / cantPorPaquete);
                                const unidadesSueltas = lote.cantidad_actual % cantPorPaquete;
                                const totalUnidades = lote.cantidad_actual;
                                const estadoVenc = obtenerEstadoVencimiento(lote.fecha_vencimiento);

                                return (
                                    <tr key={lote.lote_id}>
                                        <td>{lote.lote_id}</td>
                                        <td className="producto-nombre">
                                            <div className="producto-info">
                                                <span className="nombre">{lote.producto?.nombre || 'N/A'}</span>
                                                {lote.producto?.categoria && (
                                                    <span className="categoria">{lote.producto.categoria.nombre}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{paquetes}</td>
                                        <td>{unidadesSueltas}</td>
                                        <td><strong>{totalUnidades}</strong></td>
                                        <td>${typeof lote.costo_unitario === 'string' ? parseFloat(lote.costo_unitario).toFixed(2) : lote.costo_unitario.toFixed(2)}</td>
                                        <td className="valor-total">${calcularValorInventario(lote)}</td>
                                        <td>
                                            <div className="fecha-info">
                                                <Calendar size={14} />
                                                {new Date(lote.fecha_ingreso).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            {lote.fecha_vencimiento ? (
                                                <div className="fecha-info">
                                                    <Calendar size={14} />
                                                    {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="sin-fecha">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`estado-badge ${estadoVenc.clase}`}>
                                                {estadoVenc.estado !== 'sin-fecha' && <AlertCircle size={14} />}
                                                {estadoVenc.texto}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
