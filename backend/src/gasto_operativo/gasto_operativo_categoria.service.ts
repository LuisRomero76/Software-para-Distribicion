import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGastoOperativoCategoriasDto } from './dto/create-gasto_operativo_categoria.dto';
import { UpdateGastoOperativoCategoriasDto } from './dto/update-gasto_operativo_categoria.dto';
import { GastoOperativoCategoria } from './entities/gasto_operativo_categoria.entity';

@Injectable()
export class GastoOperativoCategoriaService {
  constructor(
    @InjectRepository(GastoOperativoCategoria)
    private categoriaRepository: Repository<GastoOperativoCategoria>,
  ) {}

  async create(createDto: CreateGastoOperativoCategoriasDto): Promise<GastoOperativoCategoria> {
    // Verificar que la categoría no exista
    const existe = await this.categoriaRepository.findOne({
      where: { nombre: createDto.nombre },
    });

    if (existe) {
      throw new BadRequestException(`La categoría "${createDto.nombre}" ya existe`);
    }

    const categoria = this.categoriaRepository.create(createDto);
    return this.categoriaRepository.save(categoria);
  }

  async findAll(): Promise<GastoOperativoCategoria[]> {
    return this.categoriaRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<GastoOperativoCategoria[]> {
    return this.categoriaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<GastoOperativoCategoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { categoria_id: id },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }

  async update(id: number, updateDto: UpdateGastoOperativoCategoriasDto): Promise<GastoOperativoCategoria> {
    const categoria = await this.findOne(id);

    // Si se cambia el nombre, verificar que no exista otra categoría con ese nombre
    if (updateDto.nombre && updateDto.nombre !== categoria.nombre) {
      const existe = await this.categoriaRepository.findOne({
        where: { nombre: updateDto.nombre },
      });
      if (existe) {
        throw new BadRequestException(`La categoría "${updateDto.nombre}" ya existe`);
      }
    }

    Object.assign(categoria, updateDto);
    return this.categoriaRepository.save(categoria);
  }

  async remove(id: number): Promise<void> {
    const categoria = await this.findOne(id);
    await this.categoriaRepository.remove(categoria);
  }
}
