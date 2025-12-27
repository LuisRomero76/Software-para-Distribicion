import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGastoOperativoDto } from './dto/create-gasto_operativo.dto';
import { UpdateGastoOperativoDto } from './dto/update-gasto_operativo.dto';
import { GastoOperativo, CategoriaGasto } from './entities/gasto_operativo.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Injectable()
export class GastoOperativoService {
  constructor(
    @InjectRepository(GastoOperativo)
    private gastoRepository: Repository<GastoOperativo>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createGastoOperativoDto: CreateGastoOperativoDto): Promise<GastoOperativo> {
    const { categoria, vehiculo_id, ...rest } = createGastoOperativoDto;

    // Validar que el vehículo exista si se proporciona
    if (vehiculo_id) {
      const vehiculo = await this.vehicleRepository.findOne({ where: { vehicle_id: vehiculo_id } });
      if (!vehiculo) {
        throw new NotFoundException(`Vehículo con ID ${vehiculo_id} no encontrado`);
      }
    }

    // Validación adicional de negocio
    if ((categoria === CategoriaGasto.COMBUSTIBLE || categoria === CategoriaGasto.MANTENIMIENTO) && !vehiculo_id) {
      throw new BadRequestException('Los gastos de COMBUSTIBLE o MANTENIMIENTO requieren un vehículo asociado');
    }

    const gastoData: Partial<GastoOperativo> = {
      ...rest,
      categoria,
    };

    if (categoria !== CategoriaGasto.GENERAL) {
      gastoData.vehiculo_id = vehiculo_id;
    }

    const gasto = this.gastoRepository.create(gastoData);

    return this.gastoRepository.save(gasto);
  }

  async findAll(): Promise<GastoOperativo[]> {
    return this.gastoRepository.find({
      relations: ['vehiculo'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: number): Promise<GastoOperativo> {
    const gasto = await this.gastoRepository.findOne({
      where: { gasto_id: id },
      relations: ['vehiculo'],
    });

    if (!gasto) {
      throw new NotFoundException(`Gasto operativo con ID ${id} no encontrado`);
    }

    return gasto;
  }

  async update(id: number, updateGastoOperativoDto: UpdateGastoOperativoDto): Promise<GastoOperativo> {
    const gasto = await this.findOne(id);
    Object.assign(gasto, updateGastoOperativoDto);
    return this.gastoRepository.save(gasto);
  }

  async remove(id: number): Promise<void> {
    const gasto = await this.findOne(id);
    await this.gastoRepository.remove(gasto);
  }
}
