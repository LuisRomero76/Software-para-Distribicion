import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create(createCategoryDto);
    await this.categoryRepository.save(category);
    return { message: 'Categoría creada exitosamente', category };
  }

  async findAll() {
    return await this.categoryRepository.find({
      relations: ['subCategories'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { category_id: id },
      relations: ['subCategories']
    });
    
    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }
    
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    Object.assign(category, updateCategoryDto);
    await this.categoryRepository.save(category);

    return { message: 'Categoría actualizada exitosamente', category };
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    await this.categoryRepository.remove(category);
    return { message: 'Categoría eliminada exitosamente', category };
  }
}
