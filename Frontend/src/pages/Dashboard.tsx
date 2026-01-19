import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Receipt } from 'lucide-react';
import '../styles/Dashboard.css';
import { useEffect } from 'react';

// Datos estáticos para las métricas
const salesData = [
  { day: 'Lun', ventas: 45, ticketPromedio: 150 },
  { day: 'Mar', ventas: 52, ticketPromedio: 165 },
  { day: 'Mié', ventas: 38, ticketPromedio: 142 },
  { day: 'Jue', ventas: 61, ticketPromedio: 178 },
  { day: 'Vie', ventas: 55, ticketPromedio: 160 },
  { day: 'Sáb', ventas: 73, ticketPromedio: 195 },
  { day: 'Dom', ventas: 48, ticketPromedio: 152 },
];

const salesAmountData = [
  { day: 'Lun', monto: 6750 },
  { day: 'Mar', monto: 8580 },
  { day: 'Mié', monto: 5396 },
  { day: 'Jue', monto: 10858 },
  { day: 'Vie', monto: 8800 },
  { day: 'Sáb', monto: 14235 },
  { day: 'Dom', monto: 7296 },
];

export default function Dashboard() {

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Estadísticas';
  })

  return (
    <div className="dashboard-page">
      
      {/* Tarjetas de métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <DollarSign size={24} color="#3b82f6" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Hoy</p>
            <h3 className="metric-value">$12,350</h3>
            <span className="metric-change positive">+12.5%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Ayer</p>
            <h3 className="metric-value">$10,850</h3>
            <span className="metric-change positive">+8.2%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
            <ShoppingCart size={24} color="#a855f7" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Mes anterior</p>
            <h3 className="metric-value">$285,400</h3>
            <span className="metric-change negative">-3.1%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
            <Receipt size={24} color="#f97316" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Ticket promedio</p>
            <h3 className="metric-value">$163</h3>
            <span className="metric-change positive">+5.7%</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de línea: Monto por ventas diarias */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Monto por ventas diarias</h3>
            <p>Últimos 7 días</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesAmountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="monto"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Monto ($)"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de barras: Cantidad de ventas diarias */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Cantidad de ventas diarias</h3>
            <p>Últimos 7 días</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)'
                  }}
                />
                <Legend />
                <Bar
                  dataKey="ventas"
                  fill="#10b981"
                  name="Ventas"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="ticketPromedio"
                  fill="#a855f7"
                  name="Ticket Promedio ($)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
