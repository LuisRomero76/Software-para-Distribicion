import { useState } from 'react';

export function CategoriaForm({ onSubmit }: { onSubmit: (nombre: string) => void }) {
  const [nombre, setNombre] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <button className="modal-close" onClick={() => onSubmit('')}>×</button>
        <h3>Nueva categoría</h3>
        <div className="modal-body">
          <form className="modal-form" onSubmit={(e) => { e.preventDefault(); if (nombre.trim()) onSubmit(nombre.trim()); }}>
            <div className="form-row">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => onSubmit('')}>Cancelar</button>
              <button type="submit" className="btn-primary">Crear</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
