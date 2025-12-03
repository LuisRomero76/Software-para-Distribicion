import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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

  async create(createAdminDto: CreateAdminDto) {
    const admin = this.adminRepository.create(createAdminDto);
    return await this.adminRepository.save(admin);
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

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    const admin = await this.findOne(id);
    
    // Si se está actualizando el email, verificar que no exista en otro admin
    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const existingAdmin = await this.adminRepository.findOneBy({ email: updateAdminDto.email });
      if (existingAdmin) {
        throw new BadRequestException('El email ya está registrado por otro administrador');
      }
    }

    // Actualizar campos
    Object.assign(admin, updateAdminDto);
    
    return await this.adminRepository.save(admin);
  }

  async remove(id: number) {
    const admin = await this.findOne(id);
    await this.adminRepository.remove(admin);
    return { message: `Administrador #${id} eliminado exitosamente` };
  }


  buscarPorEmail(email: string) {
    return this.adminRepository.findOne({
      where: { email },
      select: [ 'admin_id', 'email', 'nombre', 'apellido', 'telefono', 'password' ]
    })
  }

  async buscarAdminPorEmail(email: string){

    const adminEmail = await this.adminRepository.findOneBy({ email })

    if (adminEmail) {
      throw new UnauthorizedException('El Email ya se encuentra registrado')
    }

    return adminEmail;
  }

}
