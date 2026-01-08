import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoService } from './ingreso.service';
import { IngresoController } from './ingreso.controller';
import { IngresoCategoriaService } from './ingreso_categoria.service';
import { IngresoCategoriaController } from './ingreso_categoria.controller';
import { Ingreso } from './entities/ingreso.entity';
import { IngresoCategoria } from './entities/ingreso_categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingreso, IngresoCategoria])],
  controllers: [IngresoCategoriaController, IngresoController],
  providers: [IngresoService, IngresoCategoriaService],
  exports: [IngresoService, IngresoCategoriaService],
})
export class IngresoModule {}
