import { PartialType } from '@nestjs/mapped-types';
import { CreateGastoOperativoCategoriasDto } from './create-gasto_operativo_categoria.dto';

export class UpdateGastoOperativoCategoriasDto extends PartialType(CreateGastoOperativoCategoriasDto) {}
