import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { DetalleCompra } from '../detalle_compra/entities/detalle_compra.entity';
import { DetalleVenta } from '../detalle_venta/entities/detalle_venta.entity';
import { Lote } from '../lote/entities/lote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, DetalleCompra, DetalleVenta, Lote])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
