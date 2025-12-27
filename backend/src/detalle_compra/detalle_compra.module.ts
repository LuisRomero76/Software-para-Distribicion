import { Module } from '@nestjs/common';
import { DetalleCompraService } from './detalle_compra.service';
import { DetalleCompraController } from './detalle_compra.controller';

@Module({
  controllers: [DetalleCompraController],
  providers: [DetalleCompraService],
})
export class DetalleCompraModule {}
