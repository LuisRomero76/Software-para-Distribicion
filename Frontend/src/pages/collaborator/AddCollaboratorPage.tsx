import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../lib/http';

export default function AddCollaboratorPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Grupo Vicorsa | Agregar Colaborador';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!nombre || !apellido || !email || !password) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    
    setLoading(true);
    try {
      await request('/collaborator', {
        method: 'POST',
        body: JSON.stringify({ nombre, apellido, telefono, email, password }),
        headers: { 'Content-Type': 'application/json' }
      }, auth?.token);
      
      setSuccess('Colaborador creado correctamente.');
      setNombre('');
      setApellido('');
      setTelefono('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear colaborador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title"><UserPlus size={28} /> Agregar colaborador</h2>
          <p className="page-subtitle">Crea un nuevo colaborador para el sistema</p>
        </div>
      </div>

      <div className="form-container">
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="label-text">Nombre *</span>
              <input
                type="text"
                className="form-input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Juan"
                required
              />
            </label>
            <label className="form-field">
              <span className="label-text">Apellido *</span>
              <input
                type="text"
                className="form-input"
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                placeholder="Pérez"
                required
              />
            </label>
            <label className="form-field">
              <span className="label-text">Teléfono</span>
              <input
                type="text"
                className="form-input"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="+57 300 1234567"
              />
            </label>
            <label className="form-field">
              <span className="label-text">Email *</span>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colaborador@vicorsa.com"
                required
              />
            </label>
            <label className="form-field full-width">
              <span className="label-text">Contraseña *</span>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </label>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creando…' : 'Crear colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
