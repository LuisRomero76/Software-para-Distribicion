import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoCompraService } from './pago_compra.service';
import { PagoCompraController } from './pago_compra.controller';
import { PagoCompra } from './entities/pago_compra.entity';
import { Compra } from 'src/compra/entities/compra.entity';
import { GastoOperativoModule } from 'src/gasto_operativo/gasto_operativo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PagoCompra, Compra]),
    GastoOperativoModule,
  ],
  controllers: [PagoCompraController],
  providers: [PagoCompraService],
  exports: [PagoCompraService],
})
export class PagoCompraModule {}
