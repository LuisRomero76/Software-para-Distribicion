import { useState } from 'react';
import type { CreateClientePayload } from '../hooks/useClientes';
import type { CategoriaCliente } from '../hooks/useCategoriasClientes';
import { Visita } from '../types/visita';

interface Props {
  categorias: CategoriaCliente[];
  onSubmit: (payload: CreateClientePayload) => void;
  onCancel: () => void;
}

export function ClienteForm({ categorias, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CreateClientePayload>({
    sub_canal: '',
    nombre: '',
    direccion: '',
    cliente_categoria_ids: [],
  });
  const [telefonos, setTelefonos] = useState<{ numero: string; nombre_contacto?: string }[]>([]);

  const update = (k: keyof CreateClientePayload, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleCategoria = (id: number) => {
    setForm(prev => {
      const set = new Set(prev.cliente_categoria_ids);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...prev, cliente_categoria_ids: Array.from(set) };
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <button className="modal-close" onClick={onCancel}>×</button>
        <h3>Nuevo cliente</h3>
        <div className="modal-body">
          <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, telefonos_referencia: telefonos }); }}>
            <div className="form-grid">
              <div className="form-row">
                <label>Sub canal</label>
                <input value={form.sub_canal} onChange={e => update('sub_canal', e.target.value)} maxLength={100} />
              </div>
              <div className="form-row">
                <label>Visita</label>
                <select value={form.visita || ''} onChange={e => update('visita', e.target.value as any)}>
                  <option value="">Sin especificar</option>
                  <option value={Visita.DIA}>{Visita.DIA}</option>
                  <option value={Visita.NOCHE}>{Visita.NOCHE}</option>
                </select>
              </div>
              <div className="form-row">
                <label>NIT/CI</label>
                <input type="number" value={form.nit_ci || ''} onChange={e => update('nit_ci', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="form-row">
                <label>Nombre</label>
                <input value={form.nombre} onChange={e => update('nombre', e.target.value)} maxLength={100} />
              </div>
              <div className="form-row">
                <label>Dirección</label>
                <input value={form.direccion} onChange={e => update('direccion', e.target.value)} maxLength={200} />
              </div>
              <div className="form-row">
                <label>Ciudad</label>
                <input value={form.ciudad || ''} onChange={e => update('ciudad', e.target.value || undefined)} maxLength={100} />
              </div>
              <div className="form-row">
                <label>Coordenadas</label>
                <input value={form.coordenadas || ''} onChange={e => update('coordenadas', e.target.value || undefined)} maxLength={200} placeholder="-16.5,-68.15" />
              </div>
              <div className="form-row">
                <label>Teléfono</label>
                <input value={form.telefono || ''} onChange={e => update('telefono', e.target.value || undefined)} maxLength={20} />
              </div>
              <div className="form-row">
                <label>Ruta</label>
                <input value={form.ruta || ''} onChange={e => update('ruta', e.target.value || undefined)} maxLength={100} />
              </div>
              <div className="form-row">
                <label>Día de visita</label>
                <input type="date" value={form.dia_visita || ''} onChange={e => update('dia_visita', e.target.value || undefined)} />
              </div>
            </div>

            <div className="form-row">
              <label>Categorías</label>
              <div className="chips">
                {categorias.map(cat => (
                  <button type="button" key={cat.cliente_categoria_id} className={form.cliente_categoria_ids.includes(cat.cliente_categoria_id) ? 'chip active' : 'chip'} onClick={() => toggleCategoria(cat.cliente_categoria_id)}>
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label>Teléfonos de referencia</label>
              <div className="table-controls">
                <button type="button" className="btn-secondary" onClick={() => setTelefonos(prev => [...prev, { numero: '' }])}>Añadir teléfono</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Contacto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {telefonos.map((t, idx) => (
                    <tr key={idx}>
                      <td><input value={t.numero} onChange={e => setTelefonos(prev => prev.map((x, i) => i===idx ? { ...x, numero: e.target.value } : x))} maxLength={20} /></td>
                      <td><input value={t.nombre_contacto || ''} onChange={e => setTelefonos(prev => prev.map((x, i) => i===idx ? { ...x, nombre_contacto: e.target.value || undefined } : x))} maxLength={100} /></td>
                      <td>
                        <button type="button" className="action-btn delete" onClick={() => setTelefonos(prev => prev.filter((_, i) => i!==idx))}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
