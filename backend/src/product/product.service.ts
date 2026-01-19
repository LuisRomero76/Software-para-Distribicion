import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { DetalleCompra } from '../detalle_compra/entities/detalle_compra.entity';
import { DetalleVenta } from '../detalle_venta/entities/detalle_venta.entity';
import { Lote } from '../lote/entities/lote.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(DetalleCompra)
    private detalleCompraRepository: Repository<DetalleCompra>,
    @InjectRepository(DetalleVenta)
    private detalleVentaRepository: Repository<DetalleVenta>,
    @InjectRepository(Lote)
    private loteRepository: Repository<Lote>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validar que el código de barras sea único si se proporciona
    if (createProductDto.cod_barra) {
      const existingProduct = await this.productRepository.findOne({
        where: { cod_barra: createProductDto.cod_barra },
      });

      if (existingProduct) {
        throw new ConflictException(`El código de barras ${createProductDto.cod_barra} ya existe`);
      }
    }

    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    return this.findOne(savedProduct.product_id);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'subCategory'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: id },
      relations: ['category', 'subCategory'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async findByBarcode(cod_barra: string): Promise<Product> {
    if (!cod_barra || cod_barra.trim() === '') {
      throw new BadRequestException('Código de barras no puede estar vacío');
    }

    const product = await this.productRepository.findOne({
      where: { cod_barra },
      relations: ['category', 'subCategory'],
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

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);

    // Verificar si el producto tiene registros de compras
    const comprasCount = await this.detalleCompraRepository.count({
      where: { product_id: id },
    });

    if (comprasCount > 0) {
      throw new ConflictException(
        `No se puede eliminar este producto porque tiene ${comprasCount} compra${comprasCount > 1 ? 's' : ''} registrada${comprasCount > 1 ? 's' : ''}.`
      );
    }

    // Verificar si tiene lotes en inventario con ventas
    const lotes = await this.loteRepository.find({
      where: { product_id: id },
      relations: ['detallesVenta'],
    });

    let ventasCount = 0;
    for (const lote of lotes) {
      if (lote.detallesVenta && lote.detallesVenta.length > 0) {
        ventasCount += lote.detallesVenta.length;
      }
    }

    if (ventasCount > 0) {
      throw new ConflictException(
        `No se puede eliminar este producto porque tiene ${ventasCount} venta${ventasCount > 1 ? 's' : ''} registrada${ventasCount > 1 ? 's' : ''}.`
      );
    }

    // Verificar si tiene lotes en inventario
    if (lotes.length > 0) {
      throw new ConflictException(
        `No se puede eliminar este producto porque tiene ${lotes.length} lote${lotes.length > 1 ? 's' : ''} en inventario.`
      );
    }

    // Si no tiene relaciones, proceder con la eliminación
    await this.productRepository.remove(product);
  }

  async importProducts(productsData: CreateProductDto[]): Promise<{ success: number; failed: number; errors: any[] }> {
    const errors: Array<{ row: number; error: string; data: CreateProductDto }> = [];
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
