import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LoteService } from './lote.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { AjusteInventarioDto } from './dto/ajuste-inventario.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('lote')
export class LoteController {
  constructor(private readonly loteService: LoteService) {}

  @Post()
  create(@Body() createLoteDto: CreateLoteDto) {
    return this.loteService.create(createLoteDto);
  }

  @Post('ajuste-inventario')
  ajusteInventario(@Body() ajusteInventarioDto: AjusteInventarioDto) {
    return this.loteService.ajusteInventario(ajusteInventarioDto);
  }

  @Get()
  findAll() {
    return this.loteService.findAll();
  }

  @Get('available')
  findAvailable() {
    return this.loteService.findAvailable();
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.loteService.findByProduct(+productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoteDto: UpdateLoteDto) {
    return this.loteService.update(+id, updateLoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loteService.remove(+id);
  }
}
