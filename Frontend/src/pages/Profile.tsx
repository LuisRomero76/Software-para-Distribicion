import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../lib/http';
import { User, Mail, Phone, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Editar Perfil';
  }, []);

  useEffect(() => {
    if (auth) {
      setFormData({
        nombre: auth.nombre || '',
        apellido: auth.apellido || '',
        telefono: auth.telefono || '',
        email: auth.email || ''
      });
    }
  }, [auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await request(
        `/admin/${auth?.admin_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        },
        auth?.token
      );
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo actualizar el perfil');
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
          <h2 className="page-title">Editar perfil</h2>
          <p className="page-subtitle">Actualiza tu información personal</p>
        </div>
      </div>

      <div className="form-container">
        <form className="admin-form" onSubmit={handleSubmit}>
          {success && (
            <div className="success">
              ✓ Perfil actualizado exitosamente. Redirigiendo...
            </div>
          )}
          
          {error && (
            <div className="error">{error}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">
                <User size={16} /> Nombre
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">
                <User size={16} /> Apellido
              </label>
              <input
                type="text"
                id="apellido"
                value={formData.apellido}
                onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">
                <Phone size={16} /> Teléfono
              </label>
              <input
                type="text"
                id="telefono"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
