import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from 'src/detalle_venta/entities/detalle_venta.entity';
import { Lote } from 'src/lote/entities/lote.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';

@Injectable()
export class VentaService {
  constructor(
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private detalleVentaRepository: Repository<DetalleVenta>,
    @InjectRepository(Lote)
    private loteRepository: Repository<Lote>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private dataSource: DataSource,
  ) {}

  /**
   * Crea una venta validando y descontando el stock de los lotes
   * Utiliza transacción para garantizar la integridad de datos
   */
  async create(createVentaDto: CreateVentaDto): Promise<Venta> {
    // Validar que el cliente exista si se proporciona
    if (createVentaDto.cliente_id) {
      const cliente = await this.clienteRepository.findOne({
        where: { cliente_id: createVentaDto.cliente_id },
      });

      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${createVentaDto.cliente_id} no encontrado`);
      }
    }

    // Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalVenta = 0;

      // Validar stock de cada lote ANTES de proceder
      for (const detalleDto of createVentaDto.detalles) {
        const lote = await queryRunner.manager.findOne(Lote, {
          where: { lote_id: detalleDto.lote_id },
          relations: ['producto'],
        });

        if (!lote) {
          throw new NotFoundException(`Lote con ID ${detalleDto.lote_id} no encontrado`);
        }

        if (lote.cantidad_actual < detalleDto.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente en el lote #${lote.lote_id}. ` +
            `Disponible: ${lote.cantidad_actual}, Solicitado: ${detalleDto.cantidad}`
          );
        }

        // Usar el precio del producto como precio de venta
        const precioVenta = lote.producto.precio;
        totalVenta += precioVenta * detalleDto.cantidad;
      }

      // Crear la venta
      const venta = this.ventaRepository.create({
        cliente_id: createVentaDto.cliente_id,
        fecha_venta: createVentaDto.fecha_venta,
        tipo_venta: createVentaDto.tipo_venta,
        total: totalVenta,
        observaciones: createVentaDto.observaciones,
      });

      const ventaSaved = await queryRunner.manager.save(venta);

      // Crear detalles de venta y descontar stock
      for (const detalleDto of createVentaDto.detalles) {
        const lote = await queryRunner.manager.findOne(Lote, {
          where: { lote_id: detalleDto.lote_id },
          relations: ['producto'],
        });

        if (!lote) {
          throw new NotFoundException(`Lote con ID ${detalleDto.lote_id} no encontrado`);
        }

        const precioVenta = lote.producto.precio;
        const subtotal = precioVenta * detalleDto.cantidad;

        // Crear detalle de venta
        const detalle = this.detalleVentaRepository.create({
          venta_id: ventaSaved.venta_id,
          lote_id: detalleDto.lote_id,
          cantidad: detalleDto.cantidad,
          precio_venta_real: precioVenta,
          subtotal,
        });

        await queryRunner.manager.save(detalle);

        // Descontar del stock del lote
        lote.cantidad_actual -= detalleDto.cantidad;
        await queryRunner.manager.save(lote);
      }

      await queryRunner.commitTransaction();

      // Retornar la venta con sus relaciones
      return this.findOne(ventaSaved.venta_id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error instanceof NotFoundException || error instanceof BadRequestException
        ? error
        : new BadRequestException(`Error al crear la venta: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Venta[]> {
    return this.ventaRepository.find({
      relations: ['cliente', 'detalles', 'detalles.lote', 'detalles.lote.producto'],
      order: { fecha_venta: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Venta> {
    const venta = await this.ventaRepository.findOne({
      where: { venta_id: id },
      relations: ['cliente', 'detalles', 'detalles.lote', 'detalles.lote.producto'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return venta;
  }

  async update(id: number, updateVentaDto: UpdateVentaDto): Promise<Venta> {
    const venta = await this.findOne(id);
    Object.assign(venta, updateVentaDto);
    return this.ventaRepository.save(venta);
  }

  async remove(id: number): Promise<void> {
    const venta = await this.findOne(id);
    await this.ventaRepository.remove(venta);
  }
}
