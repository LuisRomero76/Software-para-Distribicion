import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastoOperativoService } from './gasto_operativo.service';
import { GastoOperativoController } from './gasto_operativo.controller';
import { GastoOperativo } from './entities/gasto_operativo.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GastoOperativo, Vehicle])],
  controllers: [GastoOperativoController],
  providers: [GastoOperativoService],
  exports: [GastoOperativoService],
})
export class GastoOperativoModule {}
