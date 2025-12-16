import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'Iniciar Sesión - Grupo Vicorsa';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" data-theme={theme}>
      <div className='section-toggle-theme'>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
      
      <div>
        <div className="brand">
          <img className='logo-gv' src={logo} alt="Grupo Vicorsa Logo" />
          <div>
            <h1>Vicorsa Group S.R.L.</h1>
            <p>Siempre a Tiempo</p>
          </div>
        </div>
        <div className="card">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="form">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vicorsa.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              <span>Contraseña</span>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Ingresando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>

  );
}
