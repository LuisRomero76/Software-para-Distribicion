import { request } from '../lib/http';

export interface DashboardMetricas {
  totalHoy: number;
  cantidadHoy: number;
  totalAyer: number;
  cantidadAyer: number;
  totalMesActual: number;
  cantidadMesActual: number;
  totalMesAnterior: number;
  cantidadMesAnterior: number;
  mesActualNombre: string;
  mesAnteriorNombre: string;
}

export interface VentaDiaria {
  dia: string;
  cantidad: number;
  monto: number;
}

export interface IngresoEgresoDiario {
  dia: string;
  ingresos: number;
  egresos: number;
}

export interface DashboardStats {
  metricas: DashboardMetricas;
  ventasDiarias: VentaDiaria[];
  ingresosEgresosDiarios: IngresoEgresoDiario[];
}

export const getDashboardStats = (): Promise<DashboardStats> => {
  return request<DashboardStats>('/dashboard');
};
