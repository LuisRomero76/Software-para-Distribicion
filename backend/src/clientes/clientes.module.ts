import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaborator } from 'src/collaborator/entities/collaborator.entity';
import { Cliente } from './entities/cliente.entity';
import { TelefonoReferencia } from './entities/telefono-referencia.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Collaborator, TelefonoReferencia])],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
