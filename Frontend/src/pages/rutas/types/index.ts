export interface Cliente {
  cliente_id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  ciudad?: string;
  coordenadas?: string;
}

export interface Colaborador {
  collaborator_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export type EstadoRuta = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export interface Ruta {
  ruta_id: number;
  dia_visita: string;
  estado: EstadoRuta;
  observaciones?: string;
  cliente_id: number;
  collaborator_id: number;
  createdAt: string;
  updatedAt: string;
  cliente?: Cliente;
  colaborador?: Colaborador;
}

export type RutaFormData = Omit<Ruta, 'ruta_id' | 'createdAt' | 'updatedAt' | 'cliente' | 'colaborador'>;
