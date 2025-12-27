import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from './guard/auth.guard';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
    ) {}

    @UseGuards(AuthGuard)
    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto)
    }

    @Post('login')
    Login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }

    @Post('change-password')
    changePassword(@Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(changePasswordDto)
    }

}
