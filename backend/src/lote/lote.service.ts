import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { Lote } from './entities/lote.entity';

@Injectable()
export class LoteService {
  constructor(
    @InjectRepository(Lote)
    private loteRepository: Repository<Lote>,
  ) {}

  async create(createLoteDto: CreateLoteDto): Promise<Lote> {
    const lote = this.loteRepository.create(createLoteDto);
    return this.loteRepository.save(lote);
  }

  async findAll(): Promise<Lote[]> {
    return this.loteRepository.find({
      relations: ['producto', 'detalleCompra'],
      order: { fecha_ingreso: 'DESC' },
    });
  }

  /**
   * Obtener lotes disponibles (con stock > 0)
   */
  async findAvailable(): Promise<Lote[]> {
    return this.loteRepository
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.producto', 'producto')
      .where('lote.cantidad_actual > 0')
      .orderBy('lote.fecha_ingreso', 'ASC')
      .getMany();
  }

  /**
   * Obtener lotes por producto
   */
  async findByProduct(productId: number): Promise<Lote[]> {
    return this.loteRepository.find({
      where: { product_id: productId, },
      relations: ['producto'],
      order: { fecha_ingreso: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Lote> {
    const lote = await this.loteRepository.findOne({
      where: { lote_id: id },
      relations: ['producto', 'detalleCompra'],
    });

    if (!lote) {
      throw new NotFoundException(`Lote con ID ${id} no encontrado`);
    }

    return lote;
  }

  async update(id: number, updateLoteDto: UpdateLoteDto): Promise<Lote> {
    const lote = await this.findOne(id);
    Object.assign(lote, updateLoteDto);
    return this.loteRepository.save(lote);
  }

  async remove(id: number): Promise<void> {
    const lote = await this.findOne(id);
    await this.loteRepository.remove(lote);
  }
}
