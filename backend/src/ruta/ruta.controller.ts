import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RutaService } from './ruta.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { EstadoRuta } from './entities/ruta.entity';

@Controller('ruta')
export class RutaController {
  constructor(private readonly rutaService: RutaService) {}

  @Post()
  create(@Body() createRutaDto: CreateRutaDto) {
    return this.rutaService.create(createRutaDto);
  }

  @Get()
  findAll() {
    return this.rutaService.findAll();
  }

  @Get('colaborador/:collaboratorId')
  findByColaborador(@Param('collaboratorId') collaboratorId: string) {
    return this.rutaService.findByColaborador(+collaboratorId);
  }

  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.rutaService.findByCliente(+clienteId);
  }

  @Get('fecha/:fecha')
  findByFecha(@Param('fecha') fecha: string) {
    return this.rutaService.findByFecha(new Date(fecha));
  }

  @Get('estado/:estado')
  findByEstado(@Param('estado') estado: EstadoRuta) {
    return this.rutaService.findByEstado(estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rutaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRutaDto: UpdateRutaDto) {
    return this.rutaService.update(+id, updateRutaDto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: EstadoRuta) {
    return this.rutaService.cambiarEstado(+id, estado);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rutaService.remove(+id);
  }
}
