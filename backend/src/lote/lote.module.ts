import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoteService } from './lote.service';
import { LoteController } from './lote.controller';
import { Lote } from './entities/lote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lote])],
  controllers: [LoteController],
  providers: [LoteService],
  exports: [LoteService],
})
export class LoteModule {}
