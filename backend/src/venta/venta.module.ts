import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentaService } from './venta.service';
import { VentaController } from './venta.controller';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from 'src/detalle_venta/entities/detalle_venta.entity';
import { Lote } from 'src/lote/entities/lote.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { IngresoModule } from 'src/ingreso/ingreso.module';
import { PagoModule } from 'src/pago/pago.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Lote, Cliente]),
    IngresoModule,
    PagoModule,
  ],
  controllers: [VentaController],
  providers: [VentaService],
  exports: [VentaService],
})
export class VentaModule {}
