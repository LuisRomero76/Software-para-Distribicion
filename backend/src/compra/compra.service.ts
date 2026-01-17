import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { Compra, TipoCompra, EstadoCompra } from './entities/compra.entity';
import { DetalleCompra } from 'src/detalle_compra/entities/detalle_compra.entity';
import { Lote } from 'src/lote/entities/lote.entity';
import { Product } from 'src/product/entities/product.entity';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { GastoOperativoService } from 'src/gasto_operativo/gasto_operativo.service';
import { TipoEgreso } from 'src/gasto_operativo/entities/gasto_operativo.entity';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @InjectRepository(DetalleCompra)
    private detalleCompraRepository: Repository<DetalleCompra>,
    @InjectRepository(Lote)
    private loteRepository: Repository<Lote>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,
    private dataSource: DataSource,
    private gastoOperativoService: GastoOperativoService,
  ) {}

  /**
   * Crea una compra y automáticamente genera los lotes en inventario
   * Utiliza transacción para garantizar la integridad de datos
   */
  async create(createCompraDto: CreateCompraDto): Promise<Compra> {
    // Validar proveedor solo si se envía
    let proveedor: Proveedor | null = null;
    if (createCompraDto.proveedor_id) {
      proveedor = await this.proveedorRepository.findOne({
        where: { proveedor_id: createCompraDto.proveedor_id },
      });
      if (!proveedor) {
        throw new NotFoundException(`Proveedor con ID ${createCompraDto.proveedor_id} no encontrado`);
      }
    }

    // Validar que todos los productos existan
    for (const detalle of createCompraDto.detalles) {
      const producto = await this.productRepository.findOne({
        where: { product_id: detalle.product_id },
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${detalle.product_id} no encontrado`);
      }
    }

    // Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calcular el total de la compra
      const total = createCompraDto.detalles.reduce(
        (sum, detalle) => sum + detalle.cantidad * detalle.precio_unitario,
        0
      );

      // Calcular montos según el tipo de compra
      const montoPagado = createCompraDto.monto_pagado || 0;
      const estado = createCompraDto.tipo_compra === TipoCompra.CONTADO ? EstadoCompra.COMPLETADO : EstadoCompra.PENDIENTE;
      const montoAdeudado = total - montoPagado;

      // Crear la compra
      const compra = this.compraRepository.create({
        proveedor_id: proveedor ? proveedor.proveedor_id : null,
        fecha_compra: createCompraDto.fecha_compra ?? new Date(),
        tipo_compra: createCompraDto.tipo_compra,
        total,
        monto_pagado: montoPagado,
        monto_adeudado: createCompraDto.tipo_compra === TipoCompra.CREDITO ? montoAdeudado : 0,
        estado: estado,
        observaciones: createCompraDto.observaciones,
      });

      const compraSaved = await queryRunner.manager.save(compra);

      // Crear los detalles de compra y los lotes
      for (const detalleDto of createCompraDto.detalles) {
        // Obtener información del producto
        const producto = await this.productRepository.findOne({
          where: { product_id: detalleDto.product_id },
        });

        // Convertir cantidad a unidades si es modo paquete
        let cantidadEnUnidades = detalleDto.cantidad;
        if (detalleDto.modo === 'paquete') {
          const unidadesPorPaquete = producto?.cant_por_paquete || 1;
          cantidadEnUnidades = detalleDto.cantidad * unidadesPorPaquete;
        }

        const subtotal = detalleDto.cantidad * detalleDto.precio_unitario;

        const unidadesPorPaquete = producto?.cant_por_paquete || 1;
        const unidadesSueltas = cantidadEnUnidades % unidadesPorPaquete;

        // Crear detalle de compra
        const detalle = this.detalleCompraRepository.create({
          compra_id: compraSaved.compra_id,
          product_id: detalleDto.product_id,
          cantidad: detalleDto.cantidad,
          precio_unitario: detalleDto.precio_unitario,
          subtotal,
          fecha_vencimiento: detalleDto.fecha_vencimiento,
        });

        const detalleSaved = await queryRunner.manager.save(detalle);

        // Crear el lote automáticamente (siempre en unidades)
        const lote = this.loteRepository.create({
          product_id: detalleDto.product_id,
          cantidad_inicial: cantidadEnUnidades,
          cantidad_actual: cantidadEnUnidades,
          unidades_sueltas: unidadesSueltas,
          costo_unitario: detalleDto.precio_unitario,
          fecha_vencimiento: detalleDto.fecha_vencimiento,
          detalle_compra_id: detalleSaved.detalle_compra_id,
        });

        await queryRunner.manager.save(lote);
      }

      // Crear egreso automáticamente
      await this.gastoOperativoService.create({
        tipo: TipoEgreso.COMPRA,
        monto: total,
      });

      await queryRunner.commitTransaction();

      // Retornar la compra con sus relaciones
      return this.findOne(compraSaved.compra_id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error al crear la compra: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Compra[]> {
    return this.compraRepository.find({
      relations: ['proveedor', 'detalles', 'detalles.producto'],
      order: { fecha_compra: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Compra> {
    const compra = await this.compraRepository.findOne({
      where: { compra_id: id },
      relations: ['proveedor', 'detalles', 'detalles.producto', 'detalles.lotes'],
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    return compra;
  }

  async update(id: number, updateCompraDto: UpdateCompraDto): Promise<Compra> {
    const compra = await this.findOne(id);
    Object.assign(compra, updateCompraDto);
    return this.compraRepository.save(compra);
  }

  async remove(id: number): Promise<void> {
    const compra = await this.compraRepository.findOne({
      where: { compra_id: id },
      relations: ['detalles'],
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    // Iniciar transacción para eliminar en orden correcto
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Primero eliminar los lotes asociados a los detalles de compra
      for (const detalle of compra.detalles) {
        // Buscar y eliminar lotes creados por esta compra
        await queryRunner.manager.delete('lote', {
          detalle_compra_id: detalle.detalle_compra_id,
        });
      }

      // Luego eliminar los detalles de compra
      await queryRunner.manager.delete('detalle_compra', {
        compra_id: id,
      });

      // Eliminar el egreso asociado si existe
      await queryRunner.manager.delete('gasto_operativo', {
        descripcion: `Compra #${id}`,
      });

      // Finalmente eliminar la compra
      await queryRunner.manager.delete('compra', {
        compra_id: id,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
