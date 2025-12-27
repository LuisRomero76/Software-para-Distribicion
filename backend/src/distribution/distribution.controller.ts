import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { CreateVehicleAssignmentDto } from './dto/vehicle-assignment.dto';
import { UpdateVehicleAssignmentDto } from './dto/update-distribution.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('distribution')
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Post('assignment')
  createAssignment(@Body() createAssignmentDto: CreateVehicleAssignmentDto) {
    return this.distributionService.createAssignment(createAssignmentDto);
  }

  @Get('assignments')
  findAllAssignments() {
    return this.distributionService.findAllAssignments();
  }

  @Get('assignments/active')
  getActiveAssignments() {
    return this.distributionService.getActiveAssignments();
  }

  @Get('assignment/:id')
  findAssignmentById(@Param('id') id: string) {
    return this.distributionService.findAssignmentById(+id);
  }

  @Get('assignments/collaborator/:id')
  findAssignmentsByCollaborator(@Param('id') id: string) {
    return this.distributionService.findAssignmentsByCollaborator(+id);
  }

  @Get('assignments/vehicle/:id')
  findAssignmentsByVehicle(@Param('id') id: string) {
    return this.distributionService.findAssignmentsByVehicle(+id);
  }

  @Patch('assignment/:id')
  updateAssignment(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateVehicleAssignmentDto,
  ) {
    return this.distributionService.updateAssignment(+id, updateAssignmentDto);
  }

  @Delete('assignment/:id')
  removeAssignment(@Param('id') id: string) {
    return this.distributionService.removeAssignment(+id);
  }
}
