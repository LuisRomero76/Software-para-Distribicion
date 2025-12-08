export interface Vehicle {
  vehicle_id: number;
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  capacidad_carga: number;
  disponible: boolean;
  createdAt: string;
}

export interface Collaborator {
  collaborator_id: number;
  nombre: string;
  apellido: string;
  email: string;
}

export interface VehicleAssignment {
  assignment_id: number;
  vehicle_id: number;
  collaborator_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  createdAt: string;
  vehicle?: Vehicle;
  collaborator?: Collaborator;
}

export type VehicleFormData = Omit<Vehicle, 'vehicle_id' | 'createdAt'>;
export type VehicleAssignmentFormData = Omit<VehicleAssignment, 'assignment_id' | 'createdAt' | 'vehicle' | 'collaborator'>;
