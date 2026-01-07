import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastoOperativoService } from './gasto_operativo.service';
import { GastoOperativoController } from './gasto_operativo.controller';
import { GastoOperativoCategoriaService } from './gasto_operativo_categoria.service';
import { GastoOperativoCategoriaController } from './gasto_operativo_categoria.controller';
import { GastoOperativo } from './entities/gasto_operativo.entity';
import { GastoOperativoCategoria } from './entities/gasto_operativo_categoria.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GastoOperativo, GastoOperativoCategoria, Vehicle])],
  controllers: [GastoOperativoCategoriaController, GastoOperativoController],
  providers: [GastoOperativoService, GastoOperativoCategoriaService],
  exports: [GastoOperativoService, GastoOperativoCategoriaService],
})
export class GastoOperativoModule {}
