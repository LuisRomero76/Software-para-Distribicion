import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleDto } from "./vehicle.dto";

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
