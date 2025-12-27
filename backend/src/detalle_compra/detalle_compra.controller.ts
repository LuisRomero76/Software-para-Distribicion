import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DetalleCompraService } from './detalle_compra.service';
import { CreateDetalleCompraDto } from './dto/create-detalle_compra.dto';
import { UpdateDetalleCompraDto } from './dto/update-detalle_compra.dto';

@Controller('detalle-compra')
export class DetalleCompraController {
  constructor(private readonly detalleCompraService: DetalleCompraService) {}

  @Post()
  create(@Body() createDetalleCompraDto: CreateDetalleCompraDto) {
    return this.detalleCompraService.create(createDetalleCompraDto);
  }

  @Get()
  findAll() {
    return this.detalleCompraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detalleCompraService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDetalleCompraDto: UpdateDetalleCompraDto) {
    return this.detalleCompraService.update(+id, updateDetalleCompraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detalleCompraService.remove(+id);
  }
}
