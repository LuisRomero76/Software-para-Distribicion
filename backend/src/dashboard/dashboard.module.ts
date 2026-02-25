import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Venta } from 'src/venta/entities/venta.entity';
import { Ingreso } from 'src/ingreso/entities/ingreso.entity';
import { GastoOperativo } from 'src/gasto_operativo/entities/gasto_operativo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, Ingreso, GastoOperativo])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
