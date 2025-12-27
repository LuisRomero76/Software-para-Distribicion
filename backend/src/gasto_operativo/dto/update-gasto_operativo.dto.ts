import { PartialType } from '@nestjs/mapped-types';
import { CreateGastoOperativoDto } from './create-gasto_operativo.dto';

export class UpdateGastoOperativoDto extends PartialType(CreateGastoOperativoDto) {}
