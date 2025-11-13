import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>
  ){}

  create(createAdminDto: CreateAdminDto) {
    return 'This action adds a new admin';
  }

  async findAll() {
    return await this.adminRepository.find();
  }

  async findOne(id: number) {
    const admin = await this.adminRepository.findOneBy({
      admin_id: id
    })

    if (!admin) {
      throw new BadRequestException(`Admin con el id ${id} no encontrado`)
    }

    return admin;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}
