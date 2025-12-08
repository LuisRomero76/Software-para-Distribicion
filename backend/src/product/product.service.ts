import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductShipping } from './entities/product-shipping.entity';
import { CreateProductWithShippingDto, CreateProductShippingDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductShipping)
    private shippingRepository: Repository<ProductShipping>,
  ) {}

  async create(createProductDto: CreateProductWithShippingDto): Promise<Product> {
    // Validar que el código de barras sea único
    const existingProduct = await this.productRepository.findOne({
      where: { cod_barra: createProductDto.cod_barra },
    });

    if (existingProduct) {
      throw new ConflictException(`El código de barras ${createProductDto.cod_barra} ya existe`);
    }

    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    // Crear información de envío si se proporciona
    if (createProductDto.shipping) {
      const shipping = this.shippingRepository.create({
        ...createProductDto.shipping,
        product_id: savedProduct.product_id,
      });
      await this.shippingRepository.save(shipping);
    }

    return this.findOne(savedProduct.product_id);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'subCategory', 'shippingInfo'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: id },
      relations: ['category', 'subCategory', 'shippingInfo'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async findByBarcode(cod_barra: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { cod_barra },
      relations: ['category', 'subCategory', 'shippingInfo'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con código de barras ${cod_barra} no encontrado`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: id },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Validar código de barras único si cambia
    if (updateProductDto.cod_barra && updateProductDto.cod_barra !== product.cod_barra) {
      const existing = await this.productRepository.findOne({
        where: { cod_barra: updateProductDto.cod_barra },
      });

      if (existing) {
        throw new ConflictException(`El código de barras ${updateProductDto.cod_barra} ya existe`);
      }
    }

    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);

    // Actualizar información de envío si se proporciona
    if (updateProductDto.shipping) {
      let shipping = await this.shippingRepository.findOne({
        where: { product_id: id },
      });

      if (shipping) {
        Object.assign(shipping, updateProductDto.shipping);
        await this.shippingRepository.save(shipping);
      } else {
        shipping = this.shippingRepository.create({
          ...updateProductDto.shipping,
          product_id: id,
        });
        await this.shippingRepository.save(shipping);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async importProducts(productsData: CreateProductWithShippingDto[]): Promise<{ success: number; failed: number; errors: any[] }> {
    const errors: Array<{ row: number; error: string; data: CreateProductWithShippingDto }> = [];
    let successCount = 0;

    for (let i = 0; i < productsData.length; i++) {
      try {
        await this.create(productsData[i]);
        successCount++;
      } catch (error) {
        errors.push({
          row: i + 2,
          error: error.message,
          data: productsData[i],
        });
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }
}
