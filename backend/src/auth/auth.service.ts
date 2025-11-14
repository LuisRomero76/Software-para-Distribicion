import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from 'src/admin/admin.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {

    constructor(
        private readonly adminsService: AdminService,
        private readonly jwtService: JwtService
    ) {}

    async register({ name, email, password }: RegisterDto) {
        await this.adminsService.buscarAdminPorEmail(email);
        
        return await this.adminsService.create({
            name,
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
            name: admin.name,
            rol: admin.rol
        }

        const token = await this.jwtService.signAsync(payload)

        return {
            token,
            email,
            rol: admin.rol
        }

    }
}
