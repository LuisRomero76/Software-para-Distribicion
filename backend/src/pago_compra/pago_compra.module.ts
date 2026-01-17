import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoCompraService } from './pago_compra.service';
import { PagoCompraController } from './pago_compra.controller';
import { PagoCompra } from './entities/pago_compra.entity';
import { Compra } from 'src/compra/entities/compra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PagoCompra, Compra])],
  controllers: [PagoCompraController],
  providers: [PagoCompraService],
  exports: [PagoCompraService],
})
export class PagoCompraModule {}
