import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriaClientesService } from './categoria_clientes.service';
import { CreateCategoriaClienteDto } from './dto/create-categoria_cliente.dto';
import { UpdateCategoriaClienteDto } from './dto/update-categoria_cliente.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('categoria-clientes')
export class CategoriaClientesController {
  constructor(private readonly categoriaClientesService: CategoriaClientesService) {}

  @Post()
  create(@Body() createCategoriaClienteDto: CreateCategoriaClienteDto) {
    return this.categoriaClientesService.create(createCategoriaClienteDto);
  }

  @Get()
  findAll() {
    return this.categoriaClientesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriaClientesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoriaClienteDto: UpdateCategoriaClienteDto) {
    return this.categoriaClientesService.update(+id, updateCategoriaClienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaClientesService.remove(+id);
  }
}
