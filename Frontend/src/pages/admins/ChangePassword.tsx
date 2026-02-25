import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../lib/http';
import { Lock, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Cambiar Contraseña';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validar que las contraseñas coincidan
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await request(
        `/auth/change-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: auth?.email,
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
          })
        },
        auth?.token
      );
      
      setSuccess(true);
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Volver
          </button>
          <h2 className="page-title">Cambiar contraseña</h2>
          <p className="page-subtitle">Actualiza tu contraseña de acceso</p>
        </div>
      </div>

      <div className="form-container">
        <form className="admin-form change-password-form" onSubmit={handleSubmit}>
          {success && (
            <div className="success">
              ✓ Contraseña actualizada exitosamente. Cerrando sesión...
            </div>
          )}
          
          {error && (
            <div className="error">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="currentPassword">
              <Lock size={16} /> Tu antigua contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                placeholder="Ingrese su contraseña actual"
                value={formData.currentPassword}
                onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                tabIndex={-1}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">
              <Lock size={16} /> Tu nueva contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                placeholder="Ingrese su nueva contraseña"
                value={formData.newPassword}
                onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                tabIndex={-1}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={16} /> Repita su nueva contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Repita su nueva contraseña"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                tabIndex={-1}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
