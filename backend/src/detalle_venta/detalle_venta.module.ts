import { Module } from '@nestjs/common';
import { DetalleVentaService } from './detalle_venta.service';
import { DetalleVentaController } from './detalle_venta.controller';

@Module({
  controllers: [DetalleVentaController],
  providers: [DetalleVentaService],
})
export class DetalleVentaModule {}
