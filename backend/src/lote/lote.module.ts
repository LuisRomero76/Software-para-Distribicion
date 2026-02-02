import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoteService } from './lote.service';
import { LoteController } from './lote.controller';
import { Lote } from './entities/lote.entity';
import { Product } from 'src/product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lote, Product])],
  controllers: [LoteController],
  providers: [LoteService],
  exports: [LoteService],
})
export class LoteModule {}
