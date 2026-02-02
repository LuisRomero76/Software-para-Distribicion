import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoService } from './pago.service';
import { PagoController } from './pago.controller';
import { Pago } from './entities/pago.entity';
import { Venta } from 'src/venta/entities/venta.entity';
import { IngresoModule } from 'src/ingreso/ingreso.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Venta]),
    IngresoModule,
  ],
  controllers: [PagoController],
  providers: [PagoService],
  exports: [PagoService],
})
export class PagoModule {}
