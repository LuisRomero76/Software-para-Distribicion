import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { DistributionModule } from './distribution/distribution.module';
import { CollaboratorModule } from './collaborator/collaborator.module';
import { CategoryModule } from './category/category.module';
import { SubCategoryModule } from './sub-category/sub-category.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { ProductModule } from './product/product.module';
import { CategoriaClientesModule } from './categoria_clientes/categoria_clientes.module';
import { ClientesModule } from './clientes/clientes.module';
import { RutaModule } from './ruta/ruta.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { GastoOperativoModule } from './gasto_operativo/gasto_operativo.module';
import { IngresoModule } from './ingreso/ingreso.module';
import { CompraModule } from './compra/compra.module';
import { VentaModule } from './venta/venta.module';
import { DetalleVentaModule } from './detalle_venta/detalle_venta.module';
import { DetalleCompraModule } from './detalle_compra/detalle_compra.module';
import { LoteModule } from './lote/lote.module';
import { PagoModule } from './pago/pago.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.BD_HOST,
      port: parseInt(process.env.BD_PORT ?? '3306'),
      username: process.env.BD_USERNAME,
      password: process.env.BD_PASSWORD,
      database: process.env.BD_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    AdminModule,
    DistributionModule,
    CollaboratorModule,
    CategoryModule,
    SubCategoryModule,
    VehicleModule,
    ProductModule,
    CategoriaClientesModule,
    ClientesModule,
    RutaModule,
    ProveedorModule,
    GastoOperativoModule,
    IngresoModule,
    CompraModule,
    VentaModule,
    DetalleVentaModule,
    DetalleCompraModule,
    LoteModule,
    PagoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
