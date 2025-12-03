import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from 'src/admin/admin.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {

    constructor(
        private readonly adminsService: AdminService,
        private readonly jwtService: JwtService
    ) {}

    async register({ nombre, apellido, telefono, email, password }: RegisterDto) {
        await this.adminsService.buscarAdminPorEmail(email);
        
        return await this.adminsService.create({
            nombre,
            apellido,
            telefono,
            email,
            password: await bcrypt.hash(password, 10)
        });
    }

    async login({email, password}: LoginDto) {
        const admin = await this.adminsService.buscarPorEmail(email)

        if (!admin) {
            throw new UnauthorizedException('El Email no es válido')
        }

        const passwordEsValido = await bcrypt.compare(password, admin.password);

        if (!passwordEsValido) {
            throw new UnauthorizedException('La contraseña no es valida')
        }

        const payload = {
            email: admin.email,
            nombre: admin.nombre,
            apellido: admin.apellido,
            admin_id: admin.admin_id
        }

        const token = await this.jwtService.signAsync(payload)

        return {
            token,
            email,
            nombre: admin.nombre,
            apellido: admin.apellido,
            admin_id: admin.admin_id,
            telefono: admin.telefono
        }

    }

    async changePassword({ email, currentPassword, newPassword }: ChangePasswordDto) {
        const admin = await this.adminsService.buscarPorEmail(email);

        if (!admin) {
            throw new UnauthorizedException('El Email no es válido');
        }

        const passwordEsValido = await bcrypt.compare(currentPassword, admin.password);

        if (!passwordEsValido) {
            throw new UnauthorizedException('La contraseña actual no es válida');
        }

        // Actualizar la contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.adminsService.update(admin.admin_id, { password: hashedPassword });

        return {
            message: 'Contraseña actualizada exitosamente'
        };
    }
}
