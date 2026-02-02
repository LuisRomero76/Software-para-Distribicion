import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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
      // Calcular el subtotal de la compra (suma de todos los productos)
      const subtotal = createCompraDto.detalles.reduce(
        (sum, detalle) => sum + detalle.cantidad * detalle.precio_unitario,
        0
      );

      // Calcular el descuento y el total final
      const descuento = createCompraDto.descuento || 0;
      const total = subtotal - descuento;

      // Calcular montos según el tipo de compra
      const montoPagado = createCompraDto.monto_pagado || 0;
      const estado = createCompraDto.tipo_compra === TipoCompra.CONTADO ? EstadoCompra.COMPLETADO : EstadoCompra.PENDIENTE;
      const montoAdeudado = total - montoPagado;

      // Crear la compra
      const compra = this.compraRepository.create({
        proveedor_id: proveedor ? proveedor.proveedor_id : null,
        fecha_compra: createCompraDto.fecha_compra ?? new Date(),
        tipo_compra: createCompraDto.tipo_compra,
        subtotal,
        descuento,
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
          modo: detalleDto.modo || 'unidad',
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
      // Si es CONTADO: registrar el total
      // Si es CREDITO: registrar solo el monto pagado inicial (si existe)
      const montoEgreso = createCompraDto.tipo_compra === TipoCompra.CONTADO 
        ? total 
        : (createCompraDto.monto_pagado || 0);
      
      if (montoEgreso > 0) {
        await this.gastoOperativoService.create({
          tipo: TipoEgreso.COMPRA,
          monto: montoEgreso,
        });
      }

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

  async findByProveedor(proveedorId: number): Promise<Compra[]> {
    return this.compraRepository.find({
      where: { proveedor: { proveedor_id: proveedorId } },
      relations: ['proveedor', 'detalles', 'detalles.producto'],
      order: { fecha_compra: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Compra> {
    const compra = await this.compraRepository.findOne({
      where: { compra_id: id },
      relations: ['proveedor', 'detalles', 'detalles.producto', 'detalles.lotes'],
      cache: false,
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    return compra;
  }

  async update(id: number, updateCompraDto: UpdateCompraDto): Promise<Compra> {
    const compra = await this.compraRepository.findOne({
      where: { compra_id: id },
      relations: ['detalles', 'detalles.lotes'],
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    // Si se envían detalles, actualizar completamente usando SQL directo
    if (updateCompraDto.detalles && updateCompraDto.detalles.length > 0) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Obtener detalles actuales de la compra
        const detallesActuales = await queryRunner.manager.find(DetalleCompra, {
          where: { compra_id: id },
          relations: ['lotes'],
        });

        // Separar detalles en: actualizar, crear nuevos, eliminar
        const detallesParaActualizar = updateCompraDto.detalles.filter(d => d.detalle_compra_id);
        const detallesParaCrear = updateCompraDto.detalles.filter(d => !d.detalle_compra_id);
        const idsEnviados = detallesParaActualizar.map(d => d.detalle_compra_id);
        const detallesParaEliminar = detallesActuales.filter(d => !idsEnviados.includes(d.detalle_compra_id));

        // PASO 1: Eliminar detalles que ya no están en la lista
        for (const detalleAEliminar of detallesParaEliminar) {
          // Eliminar lotes asociados
          await queryRunner.manager.query(
            `DELETE FROM lote WHERE detalle_compra_id = ?`,
            [detalleAEliminar.detalle_compra_id]
          );
          // Eliminar el detalle
          await queryRunner.manager.remove(detalleAEliminar);
        }

        // PASO 2: Actualizar detalles existentes
        for (const detalleDto of detallesParaActualizar) {
          const detalleExistente = detallesActuales.find(d => d.detalle_compra_id === detalleDto.detalle_compra_id);
          
          if (!detalleExistente) {
            throw new NotFoundException(`Detalle de compra con ID ${detalleDto.detalle_compra_id} no encontrado`);
          }
          
          // Obtener información del producto
          const producto = await this.productRepository.findOne({
            where: { product_id: detalleDto.product_id },
          });

          if (!producto) {
            throw new NotFoundException(`Producto con ID ${detalleDto.product_id} no encontrado`);
          }

          // Convertir valores a números
          const cantidadNueva = Number(detalleDto.cantidad);
          const precioNuevo = Number(detalleDto.precio_unitario);
          
          // Calcular cantidad en unidades
          let cantidadUnidades = cantidadNueva;
          if (detalleDto.modo === 'paquete') {
            cantidadUnidades = cantidadNueva * (producto.cant_por_paquete || 1);
          }

          const datosActualizados = {
            product_id: Number(detalleDto.product_id),
            cantidad: cantidadNueva,
            precio_unitario: precioNuevo,
            subtotal: cantidadNueva * precioNuevo,
            modo: String(detalleDto.modo || 'unidad'),
            fecha_vencimiento: detalleDto.fecha_vencimiento ? new Date(detalleDto.fecha_vencimiento) : null,
          };

          // Ejecutar UPDATE SQL directo
          const updateResult = await queryRunner.query(
            `UPDATE detalle_compra 
             SET product_id = ?, cantidad = ?, precio_unitario = ?, subtotal = ?, modo = ?, fecha_vencimiento = ?
             WHERE detalle_compra_id = ?`,
            [
              datosActualizados.product_id,
              datosActualizados.cantidad,
              datosActualizados.precio_unitario,
              datosActualizados.subtotal,
              datosActualizados.modo,
              datosActualizados.fecha_vencimiento,
              detalleExistente.detalle_compra_id
            ]
          );
          
          // Actualizar el lote
          const loteExistente = detalleExistente.lotes && detalleExistente.lotes.length > 0 ? detalleExistente.lotes[0] : null;
          
          if (loteExistente) {
            // Calcular diferencia de cantidad
            const cantidadInicialAnterior = Number(loteExistente.cantidad_inicial);
            const diferenciaCantidad = cantidadUnidades - cantidadInicialAnterior;
            const nuevaCantidadActual = Number(loteExistente.cantidad_actual) + diferenciaCantidad;
            
            // Validar que no se venda más de lo que hay
            if (nuevaCantidadActual < 0) {
              throw new BadRequestException(
                `No se puede reducir la cantidad porque ya se han vendido unidades de este lote.`
              );
            }
            
            // Actualizar lote con SQL directo
            await queryRunner.query(
              `UPDATE lote 
               SET cantidad_inicial = ?, cantidad_actual = ?, unidades_sueltas = ?, costo_unitario = ?, fecha_vencimiento = ?
               WHERE lote_id = ?`,
              [
                cantidadUnidades,
                nuevaCantidadActual,
                nuevaCantidadActual % (producto.cant_por_paquete || 1),
                precioNuevo,
                datosActualizados.fecha_vencimiento,
                loteExistente.lote_id
              ]
            );
          }
        }

        // PASO 3: Crear nuevos detalles (los que no tienen detalle_compra_id)
        for (const detalleDto of detallesParaCrear) {
          const producto = await this.productRepository.findOne({
            where: { product_id: detalleDto.product_id },
          });

          if (!producto) {
            throw new NotFoundException(`Producto con ID ${detalleDto.product_id} no encontrado`);
          }

          // Convertir valores a números
          const cantidadNueva = Number(detalleDto.cantidad);
          const precioNuevo = Number(detalleDto.precio_unitario);
          
          // Calcular cantidad en unidades
          let cantidadUnidades = cantidadNueva;
          if (detalleDto.modo === 'paquete') {
            cantidadUnidades = cantidadNueva * (producto.cant_por_paquete || 1);
          }

          // Crear nuevo detalle
          const nuevoDetalle = queryRunner.manager.create(DetalleCompra, {
            compra_id: Number(id),
            product_id: Number(detalleDto.product_id),
            cantidad: cantidadNueva,
            precio_unitario: precioNuevo,
            subtotal: cantidadNueva * precioNuevo,
            modo: detalleDto.modo || 'unidad',
            fecha_vencimiento: detalleDto.fecha_vencimiento ? new Date(detalleDto.fecha_vencimiento) : null,
          });

          const detalleSaved = await queryRunner.manager.save(DetalleCompra, nuevoDetalle);
          
          // Crear el lote
          const lote = this.loteRepository.create({
            product_id: Number(detalleDto.product_id),
            detalle_compra_id: detalleSaved.detalle_compra_id,
            cantidad_inicial: cantidadUnidades,
            cantidad_actual: cantidadUnidades,
            unidades_sueltas: cantidadUnidades % (producto.cant_por_paquete || 1),
            costo_unitario: precioNuevo,
            fecha_vencimiento: detalleDto.fecha_vencimiento ? new Date(detalleDto.fecha_vencimiento) : null,
          });

          await queryRunner.manager.save(lote);
        }

        // Calcular subtotal, descuento y total
        const subtotal = updateCompraDto.detalles.reduce(
          (sum, detalle) => sum + detalle.cantidad * detalle.precio_unitario,
          0
        );
        const descuento = updateCompraDto.descuento || 0;
        const total = subtotal - descuento;
        const tipoCompraFinal = updateCompraDto.tipo_compra ?? compra.tipo_compra;
        const montoPagado = updateCompraDto.monto_pagado !== undefined ? updateCompraDto.monto_pagado : compra.monto_pagado;
        const montoAdeudado = total - montoPagado;

        // Actualizar campos básicos de la compra con SQL directo
        const proveedorIdFinal = updateCompraDto.hasOwnProperty('proveedor_id') 
          ? (updateCompraDto.proveedor_id ?? null) 
          : compra.proveedor_id;
        const observacionesFinal = updateCompraDto.observaciones !== undefined 
          ? updateCompraDto.observaciones 
          : compra.observaciones;

        await queryRunner.query(
          `UPDATE compra 
           SET tipo_compra = ?, subtotal = ?, descuento = ?, total = ?, 
               monto_pagado = ?, monto_adeudado = ?, estado = ?, 
               proveedor_id = ?, observaciones = ?
           WHERE compra_id = ?`,
          [
            tipoCompraFinal,
            subtotal,
            descuento,
            total,
            montoPagado,
            tipoCompraFinal === TipoCompra.CREDITO ? montoAdeudado : 0,
            tipoCompraFinal === TipoCompra.CONTADO ? EstadoCompra.COMPLETADO : (montoAdeudado <= 0 ? EstadoCompra.COMPLETADO : EstadoCompra.PENDIENTE),
            proveedorIdFinal,
            observacionesFinal,
            id
          ]
        );

        await queryRunner.commitTransaction();
        
        // Verificar en la BD directamente antes de retornar
        if (detallesParaActualizar.length > 0) {
          const verificacion = await queryRunner.query(
            'SELECT detalle_compra_id, cantidad, modo, precio_unitario FROM detalle_compra WHERE detalle_compra_id = ?',
            [detallesParaActualizar[0].detalle_compra_id]
          );
        }

        await queryRunner.release();

        // Retornar la compra actualizada con sus relaciones (sin caché)
        const compraFinal = await this.compraRepository.findOne({
          where: { compra_id: id },
          relations: ['proveedor', 'detalles', 'detalles.producto', 'detalles.lotes'],
          cache: false,
        });
        
        if (!compraFinal) {
          throw new NotFoundException(`Compra con ID ${id} no encontrada después de la actualización`);
        }
        
        return compraFinal;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      // Si no se envían detalles, solo actualizar campos básicos
      if (updateCompraDto.hasOwnProperty('proveedor_id')) {
        compra.proveedor_id = updateCompraDto.proveedor_id ?? null;
      }
      
      // Si se cambia de CREDITO a CONTADO, eliminar todos los pagos asociados
      if (updateCompraDto.tipo_compra === TipoCompra.CONTADO && compra.tipo_compra === TipoCompra.CREDITO) {
        await this.dataSource.query('DELETE FROM pago_compra WHERE compra_id = ?', [id]);
      }
      
      // Actualizar descuento si se envía
      if (updateCompraDto.hasOwnProperty('descuento')) {
        compra.descuento = updateCompraDto.descuento || 0;
        // Recalcular total con el nuevo descuento
        compra.total = compra.subtotal - compra.descuento;
      }
      
      // Actualizar monto pagado si se envía (solo si no cambió a CONTADO)
      if (updateCompraDto.hasOwnProperty('monto_pagado') && updateCompraDto.tipo_compra !== TipoCompra.CONTADO) {
        compra.monto_pagado = updateCompraDto.monto_pagado || 0;
      }
      
      // Actualizar tipo de compra y recalcular montos
      if (updateCompraDto.tipo_compra !== undefined) {
        compra.tipo_compra = updateCompraDto.tipo_compra;
      }
      
      // Recalcular monto adeudado y estado basado en el tipo de compra
      if (compra.tipo_compra === TipoCompra.CONTADO) {
        compra.monto_pagado = compra.total;
        compra.monto_adeudado = 0;
        compra.estado = EstadoCompra.COMPLETADO;
      } else {
        // Para CREDITO, calcular el adeudado basado en el monto pagado
        compra.monto_adeudado = compra.total - compra.monto_pagado;
        compra.estado = compra.monto_adeudado <= 0 ? EstadoCompra.COMPLETADO : EstadoCompra.PENDIENTE;
      }
      
      if (updateCompraDto.observaciones !== undefined) {
        compra.observaciones = updateCompraDto.observaciones;
      }
      return this.compraRepository.save(compra);
    }
  }

  async remove(id: number): Promise<void> {
    const compra = await this.compraRepository.findOne({
      where: { compra_id: id },
      relations: ['detalles'],
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    // Verificar si algún lote de esta compra tiene ventas asociadas
    for (const detalle of compra.detalles) {
      const lotes = await this.loteRepository.find({
        where: { detalle_compra_id: detalle.detalle_compra_id },
        relations: ['detallesVenta'],
      });

      for (const lote of lotes) {
        if (lote.detallesVenta && lote.detallesVenta.length > 0) {
          throw new ConflictException(
            `No se puede eliminar esta compra porque tiene ${lote.detallesVenta.length} venta${lote.detallesVenta.length > 1 ? 's' : ''} registrada${lote.detallesVenta.length > 1 ? 's' : ''}.`
          );
        }
      }
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
