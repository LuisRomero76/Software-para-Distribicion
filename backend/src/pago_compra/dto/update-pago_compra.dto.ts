import { PartialType } from '@nestjs/mapped-types';
import { CreatePagoCompraDto } from './create-pago_compra.dto';

export class UpdatePagoCompraDto extends PartialType(CreatePagoCompraDto) {}
