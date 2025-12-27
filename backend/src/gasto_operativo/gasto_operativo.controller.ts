import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GastoOperativoService } from './gasto_operativo.service';
import { CreateGastoOperativoDto } from './dto/create-gasto_operativo.dto';
import { UpdateGastoOperativoDto } from './dto/update-gasto_operativo.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('gasto-operativo')
export class GastoOperativoController {
  constructor(private readonly gastoOperativoService: GastoOperativoService) {}

  @Post()
  create(@Body() createGastoOperativoDto: CreateGastoOperativoDto) {
    return this.gastoOperativoService.create(createGastoOperativoDto);
  }

  @Get()
  findAll() {
    return this.gastoOperativoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gastoOperativoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGastoOperativoDto: UpdateGastoOperativoDto) {
    return this.gastoOperativoService.update(+id, updateGastoOperativoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gastoOperativoService.remove(+id);
  }
}
