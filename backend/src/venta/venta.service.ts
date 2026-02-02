import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta, TipoVenta, EstadoVenta } from './entities/venta.entity';
import { DetalleVenta } from 'src/detalle_venta/entities/detalle_venta.entity';
import { Lote } from 'src/lote/entities/lote.entity';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { IngresoService } from 'src/ingreso/ingreso.service';
import { TipoIngreso } from 'src/ingreso/entities/ingreso.entity';

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
    private ingresoService: IngresoService,
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
      let subtotal = 0;

      // Validar stock de cada lote ANTES de proceder
      for (const detalleDto of createVentaDto.detalles) {
        const lote = await queryRunner.manager.findOne(Lote, {
          where: { lote_id: detalleDto.lote_id },
          relations: ['producto'],
        });

        if (!lote) {
          throw new NotFoundException(`Lote con ID ${detalleDto.lote_id} no encontrado`);
        }

        // Convertir cantidad a unidades si es modo paquete
        let cantidadEnUnidades = detalleDto.cantidad;
        if (detalleDto.modo === 'paquete') {
          const unidadesPorPaquete = lote.producto.cant_por_paquete || 1;
          cantidadEnUnidades = detalleDto.cantidad * unidadesPorPaquete;
        }

        if (lote.cantidad_actual < cantidadEnUnidades) {
          throw new BadRequestException(
            `Stock insuficiente en el lote #${lote.lote_id}. ` +
            `Disponible: ${lote.cantidad_actual}, Solicitado: ${cantidadEnUnidades}`
          );
        }

        // Usar el precio según el modo de venta y si es con factura o sin factura
        let precioVenta: number;
        const conFactura = createVentaDto.con_factura || false;
        
        if (detalleDto.modo === 'paquete') {
          if (conFactura) {
            precioVenta = lote.producto.precio_venta_paquete_con_factura || lote.producto.precio_venta_paquete_sin_factura || lote.producto.precio_venta_sin_factura;
          } else {
            precioVenta = lote.producto.precio_venta_paquete_sin_factura || lote.producto.precio_venta_sin_factura;
          }
        } else {
          if (conFactura) {
            precioVenta = lote.producto.precio_venta_con_factura || lote.producto.precio_venta_sin_factura;
          } else {
            precioVenta = lote.producto.precio_venta_sin_factura;
          }
        }
        
        subtotal += precioVenta * detalleDto.cantidad;
      }

      // Calcular descuento y total
      const descuento = createVentaDto.descuento || 0;
      const totalVenta = subtotal - descuento;

      // Crear la venta
      const montoPagado = createVentaDto.monto_pagado || 0;
      const estado = createVentaDto.tipo_venta === TipoVenta.CONTADO ? EstadoVenta.COMPLETADO : EstadoVenta.PENDIENTE;
      const montoAdeudado = totalVenta - montoPagado;

      const venta = this.ventaRepository.create({
        cliente_id: createVentaDto.cliente_id,
        fecha_venta: createVentaDto.fecha_venta,
        tipo_venta: createVentaDto.tipo_venta,
        subtotal,
        descuento,
        total: totalVenta,
        monto_pagado: montoPagado,
        monto_adeudado: createVentaDto.tipo_venta === TipoVenta.CREDITO ? montoAdeudado : 0,
        estado: estado,
        observaciones: createVentaDto.observaciones,
        con_factura: createVentaDto.con_factura || false,
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

        // Convertir cantidad a unidades si es modo paquete
        let cantidadEnUnidades = detalleDto.cantidad;
        if (detalleDto.modo === 'paquete') {
          const unidadesPorPaquete = lote.producto.cant_por_paquete || 1;
          cantidadEnUnidades = detalleDto.cantidad * unidadesPorPaquete;
        }

        // Usar el precio según el modo de venta y si es con factura
        let precioVenta: number;
        const conFactura = createVentaDto.con_factura || false;
        
        if (detalleDto.modo === 'paquete') {
          if (conFactura) {
            precioVenta = lote.producto.precio_venta_paquete_con_factura || lote.producto.precio_venta_paquete_sin_factura || lote.producto.precio_venta_sin_factura;
          } else {
            precioVenta = lote.producto.precio_venta_paquete_sin_factura || lote.producto.precio_venta_sin_factura;
          }
        } else {
          if (conFactura) {
            precioVenta = lote.producto.precio_venta_con_factura || lote.producto.precio_venta_sin_factura;
          } else {
            precioVenta = lote.producto.precio_venta_sin_factura;
          }
        }
        
        const subtotal = precioVenta * detalleDto.cantidad;

        // Crear detalle de venta
        const detalle = this.detalleVentaRepository.create({
          venta_id: ventaSaved.venta_id,
          lote_id: detalleDto.lote_id,
          cantidad: detalleDto.cantidad,
          modo: detalleDto.modo,
          precio_venta_real: precioVenta,
          subtotal,
        });

        await queryRunner.manager.save(detalle);

        // Descontar del stock del lote (en unidades)
        lote.cantidad_actual -= cantidadEnUnidades;
        await queryRunner.manager.save(lote);
      }

      // Crear ingreso automáticamente
      // Si es CONTADO: registrar el total
      // Si es CREDITO: registrar solo el monto pagado inicial (si existe)
      const montoIngreso = createVentaDto.tipo_venta === TipoVenta.CONTADO 
        ? totalVenta 
        : (createVentaDto.monto_pagado || 0);
      
      if (montoIngreso > 0) {
        await this.ingresoService.create({
          tipo: TipoIngreso.VENTA,
          descripcion: createVentaDto.tipo_venta === TipoVenta.CONTADO
            ? `Venta #${ventaSaved.venta_id} (Contado)`
            : `Venta #${ventaSaved.venta_id} (Pago inicial)`,
          monto: montoIngreso,
          referencia_id: ventaSaved.venta_id,
        });
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
      order: { createdAt: 'DESC' },
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
    const venta = await this.ventaRepository.findOne({
      where: { venta_id: id },
      relations: ['detalles', 'detalles.lote', 'detalles.lote.producto'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    // Si hay detalles en el DTO, actualizar productos vendidos
    if (updateVentaDto.detalles && updateVentaDto.detalles.length > 0) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Restaurar stock de los detalles antiguos
        for (const detalleAntiguo of venta.detalles) {
          const loteAntiguo = await queryRunner.manager.findOne(Lote, {
            where: { lote_id: detalleAntiguo.lote_id },
            relations: ['producto'],
          });

          if (loteAntiguo) {
            // Convertir cantidad a unidades si era modo paquete
            let cantidadEnUnidades = detalleAntiguo.cantidad;
            if (detalleAntiguo.modo === 'paquete') {
              const unidadesPorPaquete = loteAntiguo.producto.cant_por_paquete || 1;
              cantidadEnUnidades = detalleAntiguo.cantidad * unidadesPorPaquete;
            }
            
            loteAntiguo.cantidad_actual += cantidadEnUnidades;
            await queryRunner.manager.save(loteAntiguo);
          }
        }

        // Eliminar detalles antiguos
        await queryRunner.manager.delete('detalle_venta', { venta_id: id });

        // Calcular subtotal, descuento y total
        let subtotal = 0;

        // Validar y crear nuevos detalles
        for (const detalleDto of updateVentaDto.detalles) {
          const lote = await queryRunner.manager.findOne(Lote, {
            where: { lote_id: detalleDto.lote_id },
            relations: ['producto'],
          });

          if (!lote) {
            throw new NotFoundException(`Lote con ID ${detalleDto.lote_id} no encontrado`);
          }

          // Convertir cantidad a unidades si es modo paquete
          let cantidadEnUnidades = detalleDto.cantidad;
          if (detalleDto.modo === 'paquete') {
            const unidadesPorPaquete = lote.producto.cant_por_paquete || 1;
            cantidadEnUnidades = detalleDto.cantidad * unidadesPorPaquete;
          }

          // Validar stock disponible
          if (lote.cantidad_actual < cantidadEnUnidades) {
            throw new BadRequestException(
              `Stock insuficiente en el lote #${lote.lote_id}. ` +
              `Disponible: ${lote.cantidad_actual}, Solicitado: ${cantidadEnUnidades}`
            );
          }

          // Usar el precio según el modo de venta
          let precioVenta: number;
          if (detalleDto.modo === 'paquete') {
            precioVenta = lote.producto.precio_venta_paquete_sin_factura || lote.producto.precio_venta_sin_factura;
          } else {
            precioVenta = lote.producto.precio_venta_sin_factura;
          }

          const subtotalDetalle = precioVenta * detalleDto.cantidad;
          subtotal += subtotalDetalle;

          // Crear nuevo detalle usando SQL directo
          await queryRunner.query(`
            INSERT INTO detalle_venta (venta_id, lote_id, cantidad, modo, precio_venta_real, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [id, detalleDto.lote_id, detalleDto.cantidad, detalleDto.modo, precioVenta, subtotalDetalle]);

          // Descontar stock
          lote.cantidad_actual -= cantidadEnUnidades;
          await queryRunner.manager.save(lote);
        }

        // Calcular descuento y total final
        const descuento = updateVentaDto.descuento !== undefined ? updateVentaDto.descuento : venta.descuento;
        const nuevoTotal = subtotal - descuento;
        const montoAdeudado = nuevoTotal - Number(venta.monto_pagado);
        const nuevoEstado = montoAdeudado <= 0.01 ? EstadoVenta.COMPLETADO : EstadoVenta.PENDIENTE;

        await queryRunner.query(`
          UPDATE venta 
          SET subtotal = ?,
              descuento = ?,
              total = ?,
              monto_adeudado = ?,
              estado = ?,
              cliente_id = ?,
              tipo_venta = ?,
              observaciones = ?
          WHERE venta_id = ?
        `, [
          subtotal,
          descuento,
          nuevoTotal,
          montoAdeudado <= 0 ? 0 : montoAdeudado,
          nuevoEstado,
          updateVentaDto.cliente_id !== undefined ? updateVentaDto.cliente_id : venta.cliente_id,
          updateVentaDto.tipo_venta || venta.tipo_venta,
          updateVentaDto.observaciones !== undefined ? updateVentaDto.observaciones : venta.observaciones,
          id
        ]);

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      // Solo actualizar datos básicos (sin modificar productos)
      let recalcular = false;
      
      // Si se cambia de CREDITO a CONTADO, eliminar todos los pagos asociados
      if (updateVentaDto.tipo_venta === TipoVenta.CONTADO && venta.tipo_venta === TipoVenta.CREDITO) {
        await this.dataSource.query('DELETE FROM pago WHERE venta_id = ?', [id]);
        venta.monto_pagado = venta.total; // Al contado se paga todo
        recalcular = true;
      }
      
      // Actualizar descuento si se envía
      if (updateVentaDto.hasOwnProperty('descuento')) {
        venta.descuento = updateVentaDto.descuento || 0;
        recalcular = true;
      }
      
      // Actualizar monto_pagado si se envía (solo si no cambió a CONTADO)
      if (updateVentaDto.hasOwnProperty('monto_pagado') && updateVentaDto.tipo_venta !== TipoVenta.CONTADO) {
        venta.monto_pagado = updateVentaDto.monto_pagado || 0;
        recalcular = true;
      }
      
      // Si cambió el descuento o el monto pagado, recalcular total y estado
      if (recalcular) {
        // Recalcular total con el nuevo descuento
        venta.total = venta.subtotal - venta.descuento;
        // Recalcular monto adeudado
        venta.monto_adeudado = venta.total - venta.monto_pagado;
        if (venta.monto_adeudado < 0) venta.monto_adeudado = 0;
        // Actualizar estado
        venta.estado = venta.monto_adeudado <= 0.01 ? EstadoVenta.COMPLETADO : EstadoVenta.PENDIENTE;
      }
      
      await this.ventaRepository.update(
        { venta_id: id },
        {
          cliente_id: updateVentaDto.cliente_id,
          tipo_venta: updateVentaDto.tipo_venta,
          observaciones: updateVentaDto.observaciones,
          descuento: venta.descuento,
          total: venta.total,
          monto_pagado: venta.monto_pagado,
          monto_adeudado: venta.monto_adeudado,
          estado: venta.estado,
        }
      );
    }

    return this.findOne(id);
  }


  async remove(id: number): Promise<void> {
    const venta = await this.ventaRepository.findOne({
      where: { venta_id: id },
      relations: ['detalles'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    // Iniciar transacción para eliminar en orden correcto
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Primero devolver el stock a los lotes
      for (const detalle of venta.detalles) {
        const lote = await queryRunner.manager.findOne('lote', {
          where: { lote_id: detalle.lote_id },
          relations: ['producto'],
        }) as any;

        if (lote) {
          // Convertir cantidad a unidades si es modo paquete
          let cantidadEnUnidades = detalle.cantidad;
          if (detalle.modo === 'paquete') {
            const unidadesPorPaquete = lote.producto.cant_por_paquete || 1;
            cantidadEnUnidades = detalle.cantidad * unidadesPorPaquete;
          }
          
          lote.cantidad_actual += cantidadEnUnidades;
          await queryRunner.manager.save('lote', lote);
        }
      }

      // Eliminar los detalles de venta
      await queryRunner.manager.delete('detalle_venta', {
        venta_id: id,
      });

      // Eliminar el ingreso asociado si existe
      await queryRunner.manager.delete('ingreso', {
        referencia_id: id,
      });

      // Finalmente eliminar la venta
      await queryRunner.manager.delete('venta', {
        venta_id: id,
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
