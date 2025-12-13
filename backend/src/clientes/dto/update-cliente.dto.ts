import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';
import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
	@IsOptional()
	@IsInt()
	@Type(() => Number)
	nit_ci?: number;
}
