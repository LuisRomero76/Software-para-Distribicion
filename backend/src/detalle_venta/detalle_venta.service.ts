import { Injectable } from '@nestjs/common';
import { CreateDetalleVentaDto } from './dto/create-detalle_venta.dto';
import { UpdateDetalleVentaDto } from './dto/update-detalle_venta.dto';

@Injectable()
export class DetalleVentaService {
  create(createDetalleVentaDto: CreateDetalleVentaDto) {
    return 'This action adds a new detalleVenta';
  }

  findAll() {
    return `This action returns all detalleVenta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} detalleVenta`;
  }

  update(id: number, updateDetalleVentaDto: UpdateDetalleVentaDto) {
    return `This action updates a #${id} detalleVenta`;
  }

  remove(id: number) {
    return `This action removes a #${id} detalleVenta`;
  }
}
