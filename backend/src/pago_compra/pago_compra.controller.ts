import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PagoCompraService } from './pago_compra.service';
import { CreatePagoCompraDto } from './dto/create-pago_compra.dto';
import { UpdatePagoCompraDto } from './dto/update-pago_compra.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('pago-compra')
export class PagoCompraController {
  constructor(private readonly pagoCompraService: PagoCompraService) {}

  @Post()
  create(@Body() createPagoCompraDto: CreatePagoCompraDto) {
    return this.pagoCompraService.create(createPagoCompraDto);
  }

  @Get()
  findAll() {
    return this.pagoCompraService.findAll();
  }

  @Get('compra/:compraId')
  findByCompra(@Param('compraId') compraId: string) {
    return this.pagoCompraService.findByCompra(+compraId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagoCompraService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePagoCompraDto: UpdatePagoCompraDto) {
    return this.pagoCompraService.update(+id, updatePagoCompraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagoCompraService.remove(+id);
  }
}
