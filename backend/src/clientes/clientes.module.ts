import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaCliente } from 'src/categoria_clientes/entities/categoria_cliente.entity';
import { Cliente } from './entities/cliente.entity';
import { TelefonoReferencia } from './entities/telefono-referencia.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, CategoriaCliente, TelefonoReferencia])],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
