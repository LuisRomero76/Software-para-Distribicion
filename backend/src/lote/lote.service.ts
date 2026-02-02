import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { AjusteInventarioDto } from './dto/ajuste-inventario.dto';
import { Lote } from './entities/lote.entity';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class LoteService {
  constructor(
    @InjectRepository(Lote)
    private loteRepository: Repository<Lote>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createLoteDto: CreateLoteDto): Promise<Lote> {
    const lote = this.loteRepository.create(createLoteDto);
    return this.loteRepository.save(lote);
  }

  /**
   * Ajuste de Inventario - Crear lote sin compra asociada
   * Permite registrar inventario inicial o correcciones de stock
   */
  async ajusteInventario(ajusteInventarioDto: AjusteInventarioDto): Promise<Lote> {
    const { producto_id, cantidad, modo, fecha_vencimiento, observaciones } = ajusteInventarioDto;

    // Verificar que el producto exista
    const producto = await this.productRepository.findOne({
      where: { product_id: producto_id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${producto_id} no encontrado`);
    }

    // Calcular cantidad en unidades y paquetes/unidades sueltas
    let cantidadEnUnidades: number;
    let unidadesSueltas: number = 0;
    
    if (modo === 'paquete') {
      // Si es paquete, convertir a unidades totales
      cantidadEnUnidades = cantidad * producto.cant_por_paquete;
    } else {
      // Si es unidad, usar directamente
      cantidadEnUnidades = cantidad;
      unidadesSueltas = cantidad; // Todas son unidades sueltas
    }

    // Crear el lote sin compra asociada
    const lote = this.loteRepository.create({
      product_id: producto_id,
      cantidad_inicial: cantidadEnUnidades,
      cantidad_actual: cantidadEnUnidades,
      unidades_sueltas: unidadesSueltas,
      costo_unitario: producto.precio_compra, // Usar precio de compra del producto
      fecha_vencimiento: new Date(fecha_vencimiento),
      detalle_compra_id: null, // Sin compra asociada (inventario inicial)
    });

    const loteGuardado = await this.loteRepository.save(lote);

    return loteGuardado;
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
