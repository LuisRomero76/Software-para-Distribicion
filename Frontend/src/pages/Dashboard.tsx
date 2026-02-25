import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import '../styles/Dashboard.css';
import { useEffect, useState } from 'react';
import { getDashboardStats, type DashboardStats } from '../services/dashboardService';

function formatMoney(value: number): string {
  return value.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDayLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  const mesIdx = parseInt(month, 10) - 1;
  return `${MESES_CORTOS[mesIdx]}-${day}`;
}

function calcChange(current: number, previous: number): { text: string; positive: boolean } | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Estadísticas';
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const metricas = stats?.metricas;

  const changeHoyAyer = metricas ? calcChange(metricas.totalHoy, metricas.totalAyer) : null;
  const changeMesActualAnterior = metricas ? calcChange(metricas.totalMesActual, metricas.totalMesAnterior) : null;

  const ventasDiariasData = stats?.ventasDiarias.map((v) => ({
    dia: formatDayLabel(v.dia),
    ventas: v.cantidad,
  })) ?? [];

  const ingresosEgresosData = stats?.ingresosEgresosDiarios.map((d) => ({
    dia: formatDayLabel(d.dia),
    ingresos: d.ingresos,
    egresos: d.egresos,
  })) ?? [];

  const mesActual = metricas?.mesActualNombre
    ? metricas.mesActualNombre.charAt(0).toUpperCase() + metricas.mesActualNombre.slice(1)
    : '—';
  const mesAnterior = metricas?.mesAnteriorNombre
    ? metricas.mesAnteriorNombre.charAt(0).toUpperCase() + metricas.mesAnteriorNombre.slice(1)
    : '—';

  if (loading) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--muted)' }}>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#ef4444' }}>Error al cargar datos: {error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* Tarjetas de métricas */}
      <div className="metrics-grid">
        {/* Total Hoy */}
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <DollarSign size={24} color="#3b82f6" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Hoy ({metricas?.cantidadHoy ?? 0} ventas)</p>
            <h3 className="metric-value">Bs {formatMoney(metricas?.totalHoy ?? 0)}</h3>
            {changeHoyAyer && (
              <span className={`metric-change ${changeHoyAyer.positive ? 'positive' : 'negative'}`}>
                {changeHoyAyer.text} vs ayer
              </span>
            )}
          </div>
        </div>

        {/* Total Ayer */}
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Ayer ({metricas?.cantidadAyer ?? 0} ventas)</p>
            <h3 className="metric-value">Bs {formatMoney(metricas?.totalAyer ?? 0)}</h3>
          </div>
        </div>

        {/* Mes Actual */}
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
            <Calendar size={24} color="#f97316" />
          </div>
          <div className="metric-content">
            <p className="metric-label">{mesActual} ({metricas?.cantidadMesActual ?? 0} ventas)</p>
            <h3 className="metric-value">Bs {formatMoney(metricas?.totalMesActual ?? 0)}</h3>
            {changeMesActualAnterior && (
              <span className={`metric-change ${changeMesActualAnterior.positive ? 'positive' : 'negative'}`}>
                {changeMesActualAnterior.text} vs {mesAnterior}
              </span>
            )}
          </div>
        </div>

        {/* Mes Anterior */}
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
            <ShoppingCart size={24} color="#a855f7" />
          </div>
          <div className="metric-content">
            <p className="metric-label">{mesAnterior} ({metricas?.cantidadMesAnterior ?? 0} ventas)</p>
            <h3 className="metric-value">Bs {formatMoney(metricas?.totalMesAnterior ?? 0)}</h3>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de barras: Cantidad de ventas diarias del mes */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Ventas diarias — Últimos 8 días</h3>
            <p>Cantidad de ventas por día</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasDiariasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" stroke="var(--muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--muted)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                  }}
                  formatter={(value: number) => [value, 'Ventas']}
                  labelFormatter={(label) => `Día ${label}`}
                />
                <Legend />
                <Bar dataKey="ventas" fill="#10b981" name="Ventas" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de barras: Ingresos vs Egresos diarios */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Ingresos vs Egresos — Últimos 8 días</h3>
            <p>Montos diarios en Bs</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ingresosEgresosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" stroke="var(--muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                  }}
                  formatter={(value: number, name: string) => [
                    `Bs ${formatMoney(value)}`,
                    name === 'ingresos' ? 'Ingresos' : 'Egresos',
                  ]}
                  labelFormatter={(label) => `Día ${label}`}
                />
                <Legend
                  formatter={(value) => (value === 'ingresos' ? 'Ingresos' : 'Egresos')}
                />
                <Bar dataKey="ingresos" fill="#3b82f6" name="ingresos" radius={[6, 6, 0, 0]} />
                <Bar dataKey="egresos" fill="#ef4444" name="egresos" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
