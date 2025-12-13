import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaClienteDto } from './create-categoria_cliente.dto';

export class UpdateCategoriaClienteDto extends PartialType(CreateCategoriaClienteDto) {}
