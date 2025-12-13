import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriaCliente } from 'src/categoria_clientes/entities/categoria_cliente.entity';
import { In, Repository } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { TelefonoReferencia } from './entities/telefono-referencia.entity';

@Injectable()
export class ClientesService {

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(CategoriaCliente)
    private readonly categoriaClienteRepository: Repository<CategoriaCliente>,
    @InjectRepository(TelefonoReferencia)
    private readonly telefonoReferenciaRepository: Repository<TelefonoReferencia>,
  ) {}

  private async ensureCategorias(cliente_categoria_ids: number[]) {
    const categorias = await this.categoriaClienteRepository.find({ where: { cliente_categoria_id: In(cliente_categoria_ids) } });
    if (categorias.length !== cliente_categoria_ids.length) {
      const encontrados = categorias.map(c => c.cliente_categoria_id);
      const faltantes = cliente_categoria_ids.filter(id => !encontrados.includes(id));
      throw new NotFoundException(`Las categorías de cliente con id ${faltantes.join(', ')} no existen`);
    }
    return categorias;
  }

  async create(createClienteDto: CreateClienteDto) {
    const categorias = await this.ensureCategorias(createClienteDto.cliente_categoria_ids);
    const { cliente_categoria_ids, telefonos_referencia, ...data } = createClienteDto;
    
    const cliente = this.clienteRepository.create({ 
      ...data, 
      categorias,
      telefonos_referencia: telefonos_referencia?.map(tel => 
        this.telefonoReferenciaRepository.create(tel)
      ) || []
    });
    
    return await this.clienteRepository.save(cliente);
  }

  async findAll() {
    return await this.clienteRepository.find();
  }

  async findOne(id: number) {
    const cliente = await this.clienteRepository.findOne({ where: { cliente_id: id } });
    if (!cliente) {
      throw new NotFoundException(`El cliente con id ${id} no existe`);
    }
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    const cliente = await this.findOne(id);

    if (updateClienteDto.cliente_categoria_ids) {
      cliente.categorias = await this.ensureCategorias(updateClienteDto.cliente_categoria_ids);
    }

    if (updateClienteDto.telefonos_referencia !== undefined) {
      // Eliminar teléfonos anteriores
      await this.telefonoReferenciaRepository.delete({ cliente_id: id });
      
      // Crear nuevos teléfonos
      cliente.telefonos_referencia = updateClienteDto.telefonos_referencia?.map(tel =>
        this.telefonoReferenciaRepository.create({ ...tel, cliente_id: id })
      ) || [];
    }

    const { cliente_categoria_ids, telefonos_referencia, ...data } = updateClienteDto;
    Object.assign(cliente, data);
    return await this.clienteRepository.save(cliente);
  }

  async remove(id: number) {
    const cliente = await this.findOne(id);
    await this.clienteRepository.remove(cliente);
    return { deleted: true };
  }
}
