import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePagoCompraDto } from './dto/create-pago_compra.dto';
import { UpdatePagoCompraDto } from './dto/update-pago_compra.dto';
import { PagoCompra } from './entities/pago_compra.entity';
import { Compra } from 'src/compra/entities/compra.entity';
import { EstadoCompra } from 'src/compra/entities/compra.entity';
import { GastoOperativoService } from 'src/gasto_operativo/gasto_operativo.service';
import { TipoEgreso } from 'src/gasto_operativo/entities/gasto_operativo.entity';

@Injectable()
export class PagoCompraService {
  constructor(
    @InjectRepository(PagoCompra)
    private pagoCompraRepository: Repository<PagoCompra>,
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    private gastoOperativoService: GastoOperativoService,
  ) {}

  async create(createPagoCompraDto: CreatePagoCompraDto): Promise<PagoCompra> {
    const compra = await this.compraRepository.findOne({
      where: { compra_id: createPagoCompraDto.compra_id },
    });

    if (!compra) {
      throw new NotFoundException(`Compra con ID ${createPagoCompraDto.compra_id} no encontrada`);
    }

    // Verificar que el monto a pagar no exceda el monto adeudado
    if (createPagoCompraDto.monto > compra.monto_adeudado) {
      throw new BadRequestException(
        `El monto del pago (${createPagoCompraDto.monto}) no puede ser mayor al monto adeudado (${compra.monto_adeudado})`
      );
    }

    // Crear el pago
    const pago = this.pagoCompraRepository.create(createPagoCompraDto);
    const pagoSaved = await this.pagoCompraRepository.save(pago);

    // Actualizar el monto_pagado y monto_adeudado de la compra
    compra.monto_pagado = Number(compra.monto_pagado) + Number(createPagoCompraDto.monto);
    compra.monto_adeudado = Number(compra.monto_adeudado) - Number(createPagoCompraDto.monto);

    // Si el monto adeudado llega a 0, cambiar el estado a COMPLETADO
    if (compra.monto_adeudado <= 0.01) {
      compra.estado = EstadoCompra.COMPLETADO;
      compra.monto_adeudado = 0;
    }

    await this.compraRepository.save(compra);

    // Registrar egreso por el pago de compra a crédito (vinculado al pago)
    await this.gastoOperativoService.create({
      tipo: TipoEgreso.COMPRA,
      monto: createPagoCompraDto.monto,
      referencia_id: pagoSaved.pago_compra_id,
    });

    return pagoSaved;
  }

  async findAll(): Promise<PagoCompra[]> {
    return this.pagoCompraRepository.find({
      relations: ['compra', 'compra.proveedor'],
      order: { fecha_pago: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PagoCompra> {
    const pago = await this.pagoCompraRepository.findOne({
      where: { pago_compra_id: id },
      relations: ['compra', 'compra.proveedor'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago de compra con ID ${id} no encontrado`);
    }

    return pago;
  }

  async findByCompra(compraId: number): Promise<PagoCompra[]> {
    return this.pagoCompraRepository.find({
      where: { compra_id: compraId },
      order: { fecha_pago: 'DESC' },
    });
  }

  async update(id: number, updatePagoCompraDto: UpdatePagoCompraDto): Promise<PagoCompra> {
    const pago = await this.pagoCompraRepository.findOne({
      where: { pago_compra_id: id },
      relations: ['compra'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago de compra con ID ${id} no encontrado`);
    }

    const compra = pago.compra;
    const montoAnterior = parseFloat(pago.monto as any) || 0;
    const montoNuevo = parseFloat(updatePagoCompraDto.monto as any) || 0;

    // Si el monto cambió, actualizar los totales de la compra
    if (montoAnterior !== montoNuevo) {
      const diferencia = montoNuevo - montoAnterior;

      // Verificar que el nuevo monto no exceda el total disponible
      const montoAdeudadoActual = parseFloat(compra.monto_adeudado as any) || 0;
      const maximoPermitido = montoAnterior + montoAdeudadoActual;
      
      if (montoNuevo > maximoPermitido + 0.01) {
        throw new BadRequestException(
          `El nuevo monto del pago excede el total de la compra. Máximo permitido: Bs ${maximoPermitido.toFixed(2)}`
        );
      }

      // Actualizar los montos de la compra
      compra.monto_pagado = (parseFloat(compra.monto_pagado as any) || 0) + diferencia;
      compra.monto_adeudado = (parseFloat(compra.monto_adeudado as any) || 0) - diferencia;

      // Actualizar el estado según el monto adeudado
      if (compra.monto_adeudado <= 0.01) {
        compra.estado = EstadoCompra.COMPLETADO;
        compra.monto_adeudado = 0;
      } else {
        compra.estado = EstadoCompra.PENDIENTE;
      }

      await this.compraRepository.save(compra);

      // Sincronizar el egreso asociado al pago
      await this.gastoOperativoService.updateByReferenciaId(id, montoNuevo);
    }

    // Actualizar el pago
    Object.assign(pago, updatePagoCompraDto);
    return this.pagoCompraRepository.save(pago);
  }

  async remove(id: number): Promise<void> {
    const pago = await this.pagoCompraRepository.findOne({
      where: { pago_compra_id: id },
      relations: ['compra'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago de compra con ID ${id} no encontrado`);
    }

    // Revertir el monto del pago en la compra
    const compra = pago.compra;
    compra.monto_pagado = Number(compra.monto_pagado) - Number(pago.monto);
    compra.monto_adeudado = Number(compra.monto_adeudado) + Number(pago.monto);
    compra.estado = EstadoCompra.PENDIENTE;

    await this.compraRepository.save(compra);

    // Eliminar el egreso asociado al pago
    await this.gastoOperativoService.removeByReferenciaId(pago.pago_compra_id);

    await this.pagoCompraRepository.remove(pago);
  }
}
