import { PartialType } from '@nestjs/mapped-types';
import { CreateProductWithShippingDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductWithShippingDto) {}
