import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaService } from './ruta.service';
import { RutaController } from './ruta.controller';
import { Ruta } from './entities/ruta.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { Collaborator } from 'src/collaborator/entities/collaborator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ruta, Cliente, Collaborator])
  ],
  controllers: [RutaController],
  providers: [RutaService],
  exports: [RutaService]
})
export class RutaModule {}
