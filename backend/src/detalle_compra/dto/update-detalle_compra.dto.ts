import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleCompraDto } from './create-detalle_compra.dto';

export class UpdateDetalleCompraDto extends PartialType(CreateDetalleCompraDto) {}
