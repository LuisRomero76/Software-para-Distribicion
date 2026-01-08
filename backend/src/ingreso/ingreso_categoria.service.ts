import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngresoCategoria } from './entities/ingreso_categoria.entity';
import { CreateIngresoCategoriaDto } from './dto/create-ingreso_categoria.dto';
import { UpdateIngresoCategoriaDto } from './dto/update-ingreso_categoria.dto';

@Injectable()
export class IngresoCategoriaService {
  constructor(
    @InjectRepository(IngresoCategoria)
    private categoriaRepository: Repository<IngresoCategoria>,
  ) {}

  async create(createDto: CreateIngresoCategoriaDto): Promise<IngresoCategoria> {
    const existente = await this.categoriaRepository.findOne({
      where: { nombre: createDto.nombre },
    });

    if (existente) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const categoria = this.categoriaRepository.create(createDto);
    return await this.categoriaRepository.save(categoria);
  }

  async findAll(): Promise<IngresoCategoria[]> {
    return await this.categoriaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findActive(): Promise<IngresoCategoria[]> {
    return await this.categoriaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<IngresoCategoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { categoria_id: id },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }

  async update(id: number, updateDto: UpdateIngresoCategoriaDto): Promise<IngresoCategoria> {
    const categoria = await this.findOne(id);

    if (updateDto.nombre && updateDto.nombre !== categoria.nombre) {
      const existente = await this.categoriaRepository.findOne({
        where: { nombre: updateDto.nombre },
      });

      if (existente) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    Object.assign(categoria, updateDto);
    return await this.categoriaRepository.save(categoria);
  }

  async remove(id: number): Promise<void> {
    const categoria = await this.findOne(id);
    await this.categoriaRepository.remove(categoria);
  }
}
