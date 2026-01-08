import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { IngresoCategoriaService } from './ingreso_categoria.service';
import { CreateIngresoCategoriaDto } from './dto/create-ingreso_categoria.dto';
import { UpdateIngresoCategoriaDto } from './dto/update-ingreso_categoria.dto';
import { AuthGuard } from '../auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('ingreso/categorias')
export class IngresoCategoriaController {
  constructor(private readonly categoriaService: IngresoCategoriaService) {}

  @Post()
  create(@Body() createDto: CreateIngresoCategoriaDto) {
    return this.categoriaService.create(createDto);
  }

  @Get('activas')
  findActive() {
    return this.categoriaService.findActive();
  }

  @Get()
  findAll() {
    return this.categoriaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateIngresoCategoriaDto) {
    return this.categoriaService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaService.remove(+id);
  }
}
