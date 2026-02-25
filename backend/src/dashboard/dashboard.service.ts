import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from 'src/venta/entities/venta.entity';
import { Ingreso } from 'src/ingreso/entities/ingreso.entity';
import { GastoOperativo } from 'src/gasto_operativo/entities/gasto_operativo.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    @InjectRepository(Ingreso)
    private ingresoRepository: Repository<Ingreso>,
    @InjectRepository(GastoOperativo)
    private gastoRepository: Repository<GastoOperativo>,
  ) {}

  async getDashboardStats() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    const todayStr = toDateStr(today);
    const yesterdayStr = toDateStr(yesterday);

    // Primer y último día del mes actual
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Primer y último día del mes anterior
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const currentMonthStart = toDateStr(firstDayCurrentMonth);
    const currentMonthEnd = toDateStr(lastDayCurrentMonth);
    const prevMonthStart = toDateStr(firstDayPrevMonth);
    const prevMonthEnd = toDateStr(lastDayPrevMonth);

    // Totales de ventas por período (usando fecha_venta)
    const [ventasHoy, ventasAyer, ventasMesActual, ventasMesAnterior] = await Promise.all([
      this.ventaRepository
        .createQueryBuilder('v')
        .select('SUM(v.total)', 'total')
        .addSelect('COUNT(v.venta_id)', 'cantidad')
        .where('v.fecha_venta = :fecha', { fecha: todayStr })
        .getRawOne(),

      this.ventaRepository
        .createQueryBuilder('v')
        .select('SUM(v.total)', 'total')
        .addSelect('COUNT(v.venta_id)', 'cantidad')
        .where('v.fecha_venta = :fecha', { fecha: yesterdayStr })
        .getRawOne(),

      this.ventaRepository
        .createQueryBuilder('v')
        .select('SUM(v.total)', 'total')
        .addSelect('COUNT(v.venta_id)', 'cantidad')
        .where('v.fecha_venta BETWEEN :start AND :end', {
          start: currentMonthStart,
          end: currentMonthEnd,
        })
        .getRawOne(),

      this.ventaRepository
        .createQueryBuilder('v')
        .select('SUM(v.total)', 'total')
        .addSelect('COUNT(v.venta_id)', 'cantidad')
        .where('v.fecha_venta BETWEEN :start AND :end', {
          start: prevMonthStart,
          end: prevMonthEnd,
        })
        .getRawOne(),
    ]);

    // Rango de los últimos 8 días (hoy - 7 días ... hoy)
    const last8Start = new Date(today);
    last8Start.setDate(last8Start.getDate() - 7);
    const last8StartStr = toDateStr(last8Start);
    const last8StartTs = new Date(last8Start.getFullYear(), last8Start.getMonth(), last8Start.getDate(), 0, 0, 0, 0);
    const last8EndTs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Ventas diarias de los últimos 8 días agrupadas por día
    const ventasDiariasRaw = await this.ventaRepository
      .createQueryBuilder('v')
      .select('v.fecha_venta', 'dia')
      .addSelect('COUNT(v.venta_id)', 'cantidad')
      .addSelect('SUM(v.total)', 'monto')
      .where('v.fecha_venta BETWEEN :start AND :end', {
        start: last8StartStr,
        end: todayStr,
      })
      .groupBy('v.fecha_venta')
      .orderBy('v.fecha_venta', 'ASC')
      .getRawMany();

    // Ingresos diarios de los últimos 8 días
    const ingresosDiariosRaw = await this.ingresoRepository
      .createQueryBuilder('i')
      .select('DATE(i.createdAt)', 'dia')
      .addSelect('SUM(i.monto)', 'total')
      .where('i.createdAt BETWEEN :start AND :end', {
        start: last8StartTs,
        end: last8EndTs,
      })
      .groupBy('DATE(i.createdAt)')
      .orderBy('DATE(i.createdAt)', 'ASC')
      .getRawMany();

    // Egresos diarios de los últimos 8 días
    const egresosDiariosRaw = await this.gastoRepository
      .createQueryBuilder('g')
      .select('DATE(g.createdAt)', 'dia')
      .addSelect('SUM(g.monto)', 'total')
      .where('g.createdAt BETWEEN :start AND :end', {
        start: last8StartTs,
        end: last8EndTs,
      })
      .groupBy('DATE(g.createdAt)')
      .orderBy('DATE(g.createdAt)', 'ASC')
      .getRawMany();

    // Generar todos los días del rango para garantizar 8 columnas (incluso sin datos)
    const ingresosMap = new Map<string, number>();
    const egresosMap = new Map<string, number>();
    const ventasMap = new Map<string, { cantidad: number; monto: number }>();

    ingresosDiariosRaw.forEach((i) => {
      const dia = i.dia instanceof Date ? toDateStr(i.dia) : String(i.dia).split('T')[0];
      ingresosMap.set(dia, parseFloat(i.total) || 0);
    });

    egresosDiariosRaw.forEach((e) => {
      const dia = e.dia instanceof Date ? toDateStr(e.dia) : String(e.dia).split('T')[0];
      egresosMap.set(dia, parseFloat(e.total) || 0);
    });

    ventasDiariasRaw.forEach((v) => {
      const dia = v.dia instanceof Date ? toDateStr(v.dia) : String(v.dia).split('T')[0];
      ventasMap.set(dia, { cantidad: parseInt(v.cantidad) || 0, monto: parseFloat(v.monto) || 0 });
    });

    // Construir arreglos con todos los 8 días (sin huecos)
    const last8Days: string[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last8Days.push(toDateStr(d));
    }

    const ingresosEgresosDiarios = last8Days.map((dia) => ({
      dia,
      ingresos: ingresosMap.get(dia) || 0,
      egresos: egresosMap.get(dia) || 0,
    }));

    // Reemplazar ventasDiariasRaw con datos rellenados
    const ventasDiariasCompletas = last8Days.map((dia) => ({
      dia,
      cantidad: ventasMap.get(dia)?.cantidad || 0,
      monto: ventasMap.get(dia)?.monto || 0,
    }));

    return {
      metricas: {
        totalHoy: parseFloat(ventasHoy?.total) || 0,
        cantidadHoy: parseInt(ventasHoy?.cantidad) || 0,
        totalAyer: parseFloat(ventasAyer?.total) || 0,
        cantidadAyer: parseInt(ventasAyer?.cantidad) || 0,
        totalMesActual: parseFloat(ventasMesActual?.total) || 0,
        cantidadMesActual: parseInt(ventasMesActual?.cantidad) || 0,
        totalMesAnterior: parseFloat(ventasMesAnterior?.total) || 0,
        cantidadMesAnterior: parseInt(ventasMesAnterior?.cantidad) || 0,
        mesActualNombre: today.toLocaleString('es', { month: 'long' }),
        mesAnteriorNombre: new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        ).toLocaleString('es', { month: 'long' }),
      },
      ventasDiarias: ventasDiariasCompletas,
      ingresosEgresosDiarios,
    };
  }
}
