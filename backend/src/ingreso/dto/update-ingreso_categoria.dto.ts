import { PartialType } from '@nestjs/mapped-types';
import { CreateIngresoCategoriaDto } from './create-ingreso_categoria.dto';

export class UpdateIngresoCategoriaDto extends PartialType(CreateIngresoCategoriaDto) {}
