import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingreso, TipoIngreso } from './entities/ingreso.entity';
import { IngresoCategoria } from './entities/ingreso_categoria.entity';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';

@Injectable()
export class IngresoService {
  constructor(
    @InjectRepository(Ingreso)
    private ingresoRepository: Repository<Ingreso>,
    @InjectRepository(IngresoCategoria)
    private categoriaRepository: Repository<IngresoCategoria>,
  ) {}

  async create(createIngresoDto: CreateIngresoDto): Promise<Ingreso> {
    const { categoria_id, tipo, ...rest } = createIngresoDto;

    // Validar categoría si se proporciona
    if (categoria_id) {
      const categoria = await this.categoriaRepository.findOne({
        where: { categoria_id },
      });

      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${categoria_id} no encontrada`);
      }
    }

    const ingresoData: Partial<Ingreso> = {
      ...rest,
      tipo: tipo ?? TipoIngreso.OTRO,
      categoria_id: categoria_id || null,
    };

    const ingreso = this.ingresoRepository.create(ingresoData);
    return await this.ingresoRepository.save(ingreso);
  }

  async findAll(): Promise<Ingreso[]> {
    return await this.ingresoRepository.find({
      relations: ['categoriaRelacion'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Ingreso> {
    const ingreso = await this.ingresoRepository.findOne({
      where: { ingreso_id: id },
      relations: ['categoriaRelacion'],
    });

    if (!ingreso) {
      throw new NotFoundException(`Ingreso con ID ${id} no encontrado`);
    }

    return ingreso;
  }

  async update(id: number, updateIngresoDto: UpdateIngresoDto): Promise<Ingreso> {
    const ingreso = await this.findOne(id);
    const { categoria_id, tipo, ...rest } = updateIngresoDto;

    // Validar categoría si se proporciona
    if (categoria_id !== undefined) {
      if (categoria_id) {
        const categoria = await this.categoriaRepository.findOne({
          where: { categoria_id },
        });

        if (!categoria) {
          throw new NotFoundException(`Categoría con ID ${categoria_id} no encontrada`);
        }
      }
      ingreso.categoria_id = categoria_id || null;
    }

    if (tipo !== undefined) {
      ingreso.tipo = tipo as TipoIngreso;
    }

    Object.assign(ingreso, rest);
    return await this.ingresoRepository.save(ingreso);
  }

  async remove(id: number): Promise<void> {
    const ingreso = await this.findOne(id);
    await this.ingresoRepository.remove(ingreso);
  }
}
