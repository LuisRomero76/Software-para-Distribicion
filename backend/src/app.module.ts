import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.BD_HOST,
      port: parseInt(process.env.BD_PORT ?? '3306'),
      username: process.env.BD_USERNAME,
      password: process.env.BD_PASSWORD,
      database: process.env.BD_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    AdminModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
