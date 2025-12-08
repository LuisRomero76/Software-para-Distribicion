import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistributionService } from './distribution.service';
import { DistributionController } from './distribution.controller';
import { VehicleAssignment } from './entities/vehicle-assignment.entity';
import { VehicleModule } from '../vehicle/vehicle.module';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleAssignment]), VehicleModule],
  controllers: [DistributionController],
  providers: [DistributionService],
})
export class DistributionModule {}
