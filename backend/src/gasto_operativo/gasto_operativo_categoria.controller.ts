import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GastoOperativoCategoriaService } from './gasto_operativo_categoria.service';
import { CreateGastoOperativoCategoriasDto } from './dto/create-gasto_operativo_categoria.dto';
import { UpdateGastoOperativoCategoriasDto } from './dto/update-gasto_operativo_categoria.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('gasto-operativo/categorias')
export class GastoOperativoCategoriaController {
  constructor(private readonly categoriaService: GastoOperativoCategoriaService) {}

  @Post()
  create(@Body() createDto: CreateGastoOperativoCategoriasDto) {
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
  update(@Param('id') id: string, @Body() updateDto: UpdateGastoOperativoCategoriasDto) {
    return this.categoriaService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaService.remove(+id);
  }
}
