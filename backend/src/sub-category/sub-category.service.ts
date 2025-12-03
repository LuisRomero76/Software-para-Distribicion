import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from './entities/sub-category.entity';
import { Repository } from 'typeorm';
import { Category } from 'src/category/entities/category.entity';

@Injectable()
export class SubCategoryService {

  constructor(
    @InjectRepository(SubCategory)
    private subCategoryRepository: Repository<SubCategory>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createSubCategoryDto: CreateSubCategoryDto) {
    const category = await this.categoryRepository.findOneBy({ category_id: createSubCategoryDto.category_id });
    if (!category) {
      throw new NotFoundException(`Categoría con id ${createSubCategoryDto.category_id} no encontrada`);
    }

    const subCategory = this.subCategoryRepository.create(createSubCategoryDto);
    await this.subCategoryRepository.save(subCategory);
    return { message: 'Subcategoría creada exitosamente', subCategory };
  }

  async findAll() {
    return await this.subCategoryRepository.find({
      relations: ['category'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { sub_category_id: id },
      relations: ['category']
    });
    
    if (!subCategory) {
      throw new NotFoundException(`Subcategoría con id ${id} no encontrada`);
    }
    
    return subCategory;
  }

  async update(id: number, updateSubCategoryDto: UpdateSubCategoryDto) {
    const subCategory = await this.subCategoryRepository.findOneBy({ sub_category_id: id });
    
    if (!subCategory) {
      throw new NotFoundException(`Subcategoría con id ${id} no encontrada`);
    }

    if (updateSubCategoryDto.category_id && updateSubCategoryDto.category_id !== subCategory.category_id) {
      const category = await this.categoryRepository.findOneBy({ category_id: updateSubCategoryDto.category_id });
      if (!category) {
        throw new NotFoundException(`Categoría con id ${updateSubCategoryDto.category_id} no encontrada`);
      }
    }

    Object.assign(subCategory, updateSubCategoryDto);
    await this.subCategoryRepository.save(subCategory);
    
    return { message: 'Subcategoría actualizada exitosamente', subCategory };
  }

  async remove(id: number) {
    const subCategory = await this.subCategoryRepository.findOneBy({ sub_category_id: id });
    
    if (!subCategory) {
      throw new NotFoundException(`Subcategoría con id ${id} no encontrada`);
    }
    
    await this.subCategoryRepository.remove(subCategory);
    return { message: 'Subcategoría eliminada exitosamente', subCategory };
  }
}
