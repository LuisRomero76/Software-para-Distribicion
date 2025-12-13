import { Module } from '@nestjs/common';
import { CategoriaClientesService } from './categoria_clientes.service';
import { CategoriaClientesController } from './categoria_clientes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaCliente } from './entities/categoria_cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoriaCliente])
  ],
  controllers: [CategoriaClientesController],
  providers: [CategoriaClientesService],
})
export class CategoriaClientesModule {}
