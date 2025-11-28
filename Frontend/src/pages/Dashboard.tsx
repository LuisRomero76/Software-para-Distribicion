import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../lib/http';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, LogOut } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await request<any[]>('/admin', {}, auth?.token);
        setAdminCount(Array.isArray(data) ? data.length : 0);
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo cargar información');
      }
    })();
  }, [auth?.token]);

  return (
    <div className="dashboard">
      <header className="topbar" data-theme={theme}>
        <a href="/" className="brand-inline">
          <img src={logo} alt="Grupo Vicorsa Logo" width={60}/>
          <strong>Vicorsa Group</strong>
        </a>
        <div className="user-area">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <span>{auth?.nombre } {auth?.apellido}</span>
          <button className="btn outline" onClick={logout}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </header>
      <main className="content">
        <div className="card">
          <h2>Bienvenido</h2>
          {error && <div className="error">{error}</div>}
          {!error && (
            <p>
              {adminCount === null
                ? 'Cargando información…'
                : `Administradores registrados: ${adminCount}`}
            </p>
          )}
          <p className="muted-small">
            Usa el menú superior para navegar por el panel.
          </p>
        </div>
      </main>
    </div>
  );
}
