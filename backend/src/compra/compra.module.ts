import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompraService } from './compra.service';
import { CompraController } from './compra.controller';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from 'src/detalle_compra/entities/detalle_compra.entity';
import { Lote } from 'src/lote/entities/lote.entity';
import { Product } from 'src/product/entities/product.entity';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { GastoOperativoModule } from 'src/gasto_operativo/gasto_operativo.module';
import { PagoCompraModule } from 'src/pago_compra/pago_compra.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, DetalleCompra, Lote, Product, Proveedor]),
    GastoOperativoModule,
    PagoCompraModule,
  ],
  controllers: [CompraController],
  providers: [CompraService],
  exports: [CompraService],
})
export class CompraModule {}
