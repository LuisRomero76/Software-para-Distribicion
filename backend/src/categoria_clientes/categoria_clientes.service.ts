import { Injectable } from '@nestjs/common';
import { CreateCategoriaClienteDto } from './dto/create-categoria_cliente.dto';
import { UpdateCategoriaClienteDto } from './dto/update-categoria_cliente.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriaCliente } from './entities/categoria_cliente.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriaClientesService {

  constructor(
    @InjectRepository(CategoriaCliente)
    private categoriaClienteRepository: Repository<CategoriaCliente>,
  ) {}

  async create(createCategoriaClienteDto: CreateCategoriaClienteDto) {
    const categoriaCliente = this.categoriaClienteRepository.create(createCategoriaClienteDto);
    return await this.categoriaClienteRepository.save(categoriaCliente);
  }

  async findAll() {
    return await this.categoriaClienteRepository.find();
  }

  async findOne(id: number) {
    return await this.categoriaClienteRepository.findOneBy({ cliente_categoria_id: id });
  }

  async update(id: number, updateCategoriaClienteDto: UpdateCategoriaClienteDto) {
    const categoriaCliente = await this.findOne(id);

    if (!categoriaCliente) {
      throw new Error(`La Categoria Cliente no existe`);
    }

    Object.assign(categoriaCliente, updateCategoriaClienteDto);
    return await this.categoriaClienteRepository.save(categoriaCliente);
  }

  async remove(id: number) {

    const categoriaCliente = await this.findOne(id);

    if (!categoriaCliente) {
      throw new Error(`La Categoria Cliente no existe`);
    }

    return await this.categoriaClienteRepository.delete(id);
  }
}
