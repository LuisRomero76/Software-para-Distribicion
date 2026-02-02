import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Venta, EstadoVenta } from 'src/venta/entities/venta.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { IngresoService } from 'src/ingreso/ingreso.service';
import { TipoIngreso } from 'src/ingreso/entities/ingreso.entity';

@Injectable()
export class PagoService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    private ingresoService: IngresoService,
  ) {}

  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    // Validar que la venta exista (SIN cargar la relación de pagos)
    const venta = await this.ventaRepository.findOne({
      where: { venta_id: createPagoDto.venta_id },
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${createPagoDto.venta_id} no encontrada`);
    }

    // Validar que no se pague más de lo adeudado
    if (createPagoDto.monto > venta.monto_adeudado) {
      throw new BadRequestException(
        `El monto a pagar (${createPagoDto.monto}) no puede ser mayor al adeudado (${venta.monto_adeudado})`
      );
    }

    // Crear el pago
    const pago = this.pagoRepository.create(createPagoDto);
    const pagoSaved = await this.pagoRepository.save(pago);

    // Calcular nuevos montos
    const nuevoMontoPagado = Number(venta.monto_pagado) + Number(createPagoDto.monto);
    const nuevoMontoAdeudado = Number(venta.total) - nuevoMontoPagado;
    const nuevoEstado = nuevoMontoAdeudado <= 0 ? EstadoVenta.COMPLETADO : venta.estado;

    // Actualizar la venta usando update() para evitar problemas con relaciones
    await this.ventaRepository.update(
      { venta_id: createPagoDto.venta_id },
      {
        monto_pagado: nuevoMontoPagado,
        monto_adeudado: nuevoMontoAdeudado <= 0 ? 0 : nuevoMontoAdeudado,
        estado: nuevoEstado,
      }
    );

    // Registrar ingreso por el pago de venta a crédito
    await this.ingresoService.create({
      tipo: TipoIngreso.VENTA,
      descripcion: `Pago de Venta #${createPagoDto.venta_id} - Pago #${pagoSaved.pago_id}`,
      monto: createPagoDto.monto,
      referencia_id: createPagoDto.venta_id,
    });

    return pagoSaved;
  }

  async findByVenta(ventaId: number): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { venta_id: ventaId },
      order: { fecha_pago: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({
      where: { pago_id: id },
      relations: ['venta'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    return pago;
  }

  async update(id: number, updatePagoDto: Partial<CreatePagoDto>): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({
      where: { pago_id: id },
      relations: ['venta'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    const venta = pago.venta;
    const montoAnterior = parseFloat(pago.monto as any) || 0;
    const montoNuevo = parseFloat(updatePagoDto.monto as any) || 0;

    // Si el monto cambió, actualizar los totales de la venta
    if (montoAnterior !== montoNuevo) {
      const diferencia = montoNuevo - montoAnterior;

      // Verificar que el nuevo monto no exceda el total disponible
      const montoAdeudadoActual = parseFloat(venta.monto_adeudado as any) || 0;
      const maximoPermitido = montoAnterior + montoAdeudadoActual;
      
      if (montoNuevo > maximoPermitido + 0.01) {
        throw new BadRequestException(
          `El nuevo monto del pago excede el total de la venta. Máximo permitido: Bs ${maximoPermitido.toFixed(2)}`
        );
      }

      // Actualizar los montos de la venta
      venta.monto_pagado = (parseFloat(venta.monto_pagado as any) || 0) + diferencia;
      venta.monto_adeudado = (parseFloat(venta.monto_adeudado as any) || 0) - diferencia;

      // Actualizar el estado según el monto adeudado
      if (venta.monto_adeudado <= 0.01) {
        venta.estado = EstadoVenta.COMPLETADO;
        venta.monto_adeudado = 0;
      } else {
        venta.estado = EstadoVenta.PENDIENTE;
      }

      await this.ventaRepository.save(venta);
    }

    // Actualizar el pago
    Object.assign(pago, updatePagoDto);
    return this.pagoRepository.save(pago);
  }

  async remove(id: number): Promise<void> {
    const pago = await this.findOne(id);
    const venta = await this.ventaRepository.findOne({
      where: { venta_id: pago.venta_id },
    });

    if (!venta) {
      throw new NotFoundException(`Venta asociada no encontrada`);
    }

    // Calcular nuevos montos después de eliminar el pago
    const nuevoMontoPagado = Number(venta.monto_pagado) - Number(pago.monto);
    const nuevoMontoAdeudado = Number(venta.total) - nuevoMontoPagado;

    // Actualizar la venta usando update()
    await this.ventaRepository.update(
      { venta_id: pago.venta_id },
      {
        monto_pagado: nuevoMontoPagado,
        monto_adeudado: nuevoMontoAdeudado,
        estado: EstadoVenta.PENDIENTE, // Volver a pendiente si se elimina un pago
      }
    );

    await this.pagoRepository.remove(pago);
  }
}
