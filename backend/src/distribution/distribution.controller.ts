import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { UpdateDistributionDto } from './dto/update-distribution.dto';

@Controller('distribution')
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Post()
  create(@Body() createDistributionDto: CreateDistributionDto) {
    return this.distributionService.create(createDistributionDto);
  }

  @Get()
  findAll() {
    return this.distributionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.distributionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDistributionDto: UpdateDistributionDto) {
    return this.distributionService.update(+id, updateDistributionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.distributionService.remove(+id);
  }
}
