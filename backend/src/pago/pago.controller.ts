import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PagoService } from './pago.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('pago')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  @Post()
  create(@Body() createPagoDto: CreatePagoDto) {
    return this.pagoService.create(createPagoDto);
  }

  @Get('venta/:ventaId')
  findByVenta(@Param('ventaId') ventaId: string) {
    return this.pagoService.findByVenta(+ventaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagoService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.pagoService.remove(+id);
    return { message: 'Pago eliminado correctamente' };
  }
}
