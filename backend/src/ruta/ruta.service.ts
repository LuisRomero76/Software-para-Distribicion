import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { Ruta, EstadoRuta } from './entities/ruta.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { Collaborator } from 'src/collaborator/entities/collaborator.entity';

@Injectable()
export class RutaService {
  constructor(
    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Collaborator)
    private readonly collaboratorRepository: Repository<Collaborator>,
  ) {}

  async create(createRutaDto: CreateRutaDto): Promise<Ruta> {
    // Verificar que el cliente existe
    const cliente = await this.clienteRepository.findOne({
      where: { cliente_id: createRutaDto.cliente_id }
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${createRutaDto.cliente_id} no encontrado`);
    }

    // Verificar que el colaborador existe
    const colaborador = await this.collaboratorRepository.findOne({
      where: { collaborator_id: createRutaDto.collaborator_id }
    });
    if (!colaborador) {
      throw new NotFoundException(`Colaborador con ID ${createRutaDto.collaborator_id} no encontrado`);
    }

    // Crear la ruta
    const ruta = this.rutaRepository.create(createRutaDto);
    return await this.rutaRepository.save(ruta);
  }

  async findAll(): Promise<Ruta[]> {
    return await this.rutaRepository.find({
      order: {
        dia_visita: 'DESC',
        createdAt: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Ruta> {
    const ruta = await this.rutaRepository.findOne({
      where: { ruta_id: id }
    });
    if (!ruta) {
      throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
    }
    return ruta;
  }

  async findByColaborador(collaboratorId: number): Promise<Ruta[]> {
    return await this.rutaRepository.find({
      where: { collaborator_id: collaboratorId },
      order: {
        dia_visita: 'ASC'
      }
    });
  }

  async findByCliente(clienteId: number): Promise<Ruta[]> {
    return await this.rutaRepository.find({
      where: { cliente_id: clienteId },
      order: {
        dia_visita: 'DESC'
      }
    });
  }

  async findByFecha(fecha: Date): Promise<Ruta[]> {
    return await this.rutaRepository.find({
      where: { dia_visita: fecha },
      order: {
        createdAt: 'ASC'
      }
    });
  }

  async findByEstado(estado: EstadoRuta): Promise<Ruta[]> {
    return await this.rutaRepository.find({
      where: { estado },
      order: {
        dia_visita: 'ASC'
      }
    });
  }

  async update(id: number, updateRutaDto: UpdateRutaDto): Promise<Ruta> {
    const ruta = await this.findOne(id);

    // Si se actualiza el cliente, verificar que existe
    if (updateRutaDto.cliente_id) {
      const cliente = await this.clienteRepository.findOne({
        where: { cliente_id: updateRutaDto.cliente_id }
      });
      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${updateRutaDto.cliente_id} no encontrado`);
      }
    }

    // Si se actualiza el colaborador, verificar que existe
    if (updateRutaDto.collaborator_id) {
      const colaborador = await this.collaboratorRepository.findOne({
        where: { collaborator_id: updateRutaDto.collaborator_id }
      });
      if (!colaborador) {
        throw new NotFoundException(`Colaborador con ID ${updateRutaDto.collaborator_id} no encontrado`);
      }
    }

    Object.assign(ruta, updateRutaDto);
    return await this.rutaRepository.save(ruta);
  }

  async remove(id: number): Promise<void> {
    const ruta = await this.findOne(id);
    await this.rutaRepository.remove(ruta);
  }

  async cambiarEstado(id: number, estado: EstadoRuta): Promise<Ruta> {
    const ruta = await this.findOne(id);
    ruta.estado = estado;
    return await this.rutaRepository.save(ruta);
  }
}
