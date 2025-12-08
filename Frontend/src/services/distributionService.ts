import { request } from '../lib/http';

export interface Vehicle {
  vehicle_id: number;
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  capacidad_carga?: string;
  disponible: boolean;
  createdAt: string;
  assignments?: VehicleAssignment[];
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
  collaborator?: {
    colaborator_id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface CreateVehicleDto {
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  capacidad_carga?: string;
  disponible?: boolean;
}

export interface UpdateVehicleDto {
  placa?: string;
  marca?: string;
  modelo?: string;
  año?: number;
  capacidad_carga?: string;
  disponible?: boolean;
}

export interface CreateVehicleAssignmentDto {
  vehicle_id: number;
  collaborator_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
}

export interface UpdateVehicleAssignmentDto {
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
}

// Vehicle Services
export const getAllVehicles = async (): Promise<Vehicle[]> => {
  return request<Vehicle[]>('/vehicle', { method: 'GET' });
};

export const getVehicleById = async (id: number): Promise<Vehicle> => {
  return request<Vehicle>(`/vehicle/${id}`, { method: 'GET' });
};

export const createVehicle = async (data: CreateVehicleDto): Promise<Vehicle> => {
  return request<Vehicle>('/vehicle', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateVehicle = async (id: number, data: UpdateVehicleDto): Promise<Vehicle> => {
  return request<Vehicle>(`/vehicle/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteVehicle = async (id: number): Promise<void> => {
  return request<void>(`/vehicle/${id}`, { method: 'DELETE' });
};

export const getAvailableVehicles = async (): Promise<Vehicle[]> => {
  return request<Vehicle[]>('/vehicle/available', { method: 'GET' });
};

// VehicleAssignment Services
export const getAllAssignments = async (): Promise<VehicleAssignment[]> => {
  return request<VehicleAssignment[]>('/distribution/assignments', { method: 'GET' });
};

export const getAssignmentById = async (id: number): Promise<VehicleAssignment> => {
  return request<VehicleAssignment>(`/distribution/assignment/${id}`, { method: 'GET' });
};

export const createAssignment = async (data: CreateVehicleAssignmentDto): Promise<VehicleAssignment> => {
  return request<VehicleAssignment>('/distribution/assignment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAssignment = async (id: number, data: UpdateVehicleAssignmentDto): Promise<VehicleAssignment> => {
  return request<VehicleAssignment>(`/distribution/assignment/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteAssignment = async (id: number): Promise<void> => {
  return request<void>(`/distribution/assignment/${id}`, { method: 'DELETE' });
};

export const getActiveAssignments = async (): Promise<VehicleAssignment[]> => {
  return request<VehicleAssignment[]>('/distribution/assignments/active', { method: 'GET' });
};

export const getAssignmentsByVehicle = async (vehicleId: number): Promise<VehicleAssignment[]> => {
  return request<VehicleAssignment[]>(`/distribution/assignments/vehicle/${vehicleId}`, { method: 'GET' });
};

export const getAssignmentsByCollaborator = async (collaboratorId: number): Promise<VehicleAssignment[]> => {
  return request<VehicleAssignment[]>(`/distribution/assignments/collaborator/${collaboratorId}`, { method: 'GET' });
};
