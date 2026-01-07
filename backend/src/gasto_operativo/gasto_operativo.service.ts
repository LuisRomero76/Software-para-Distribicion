import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGastoOperativoDto } from './dto/create-gasto_operativo.dto';
import { UpdateGastoOperativoDto } from './dto/update-gasto_operativo.dto';
import { GastoOperativo, CategoriaGasto } from './entities/gasto_operativo.entity';
import { GastoOperativoCategoria } from './entities/gasto_operativo_categoria.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Injectable()
export class GastoOperativoService {
  constructor(
    @InjectRepository(GastoOperativo)
    private gastoRepository: Repository<GastoOperativo>,
    @InjectRepository(GastoOperativoCategoria)
    private categoriaRepository: Repository<GastoOperativoCategoria>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createGastoOperativoDto: CreateGastoOperativoDto): Promise<GastoOperativo> {
    const { categoria, categoria_id, vehiculo_id, ...rest } = createGastoOperativoDto;

    // Validar que el vehículo exista si se proporciona
    if (vehiculo_id) {
      const vehiculo = await this.vehicleRepository.findOne({ where: { vehicle_id: vehiculo_id } });
      if (!vehiculo) {
        throw new NotFoundException(`Vehículo con ID ${vehiculo_id} no encontrado`);
      }
    }

    // Si se proporciona categoria_id, validar que exista
    if (categoria_id) {
      const categoriaDb = await this.categoriaRepository.findOne({ where: { categoria_id } });
      if (!categoriaDb) {
        throw new NotFoundException(`Categoría con ID ${categoria_id} no encontrada`);
      }
    }

    const gastoData: Partial<GastoOperativo> = {
      ...rest,
      categoria: categoria || undefined,
      categoria_id: categoria_id || undefined,
      vehiculo_id: vehiculo_id || undefined,
    };

    const gasto = this.gastoRepository.create(gastoData);
    return this.gastoRepository.save(gasto);
  }

  async findAll(): Promise<GastoOperativo[]> {
    return this.gastoRepository.find({
      relations: ['vehiculo', 'categoriaRelacion'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<GastoOperativo> {
    const gasto = await this.gastoRepository.findOne({
      where: { gasto_id: id },
      relations: ['vehiculo', 'categoriaRelacion'],
    });

    if (!gasto) {
      throw new NotFoundException(`Gasto operativo con ID ${id} no encontrado`);
    }

    return gasto;
  }

  async update(id: number, updateGastoOperativoDto: UpdateGastoOperativoDto): Promise<GastoOperativo> {
    const gasto = await this.findOne(id);
    
    const { categoria, categoria_id, vehiculo_id, ...rest } = updateGastoOperativoDto;

    // Manejar vehículo (setear FK y limpiar/actualizar relación)
    if (vehiculo_id !== undefined) {
      if (vehiculo_id === null || vehiculo_id === 0) {
        gasto.vehiculo_id = null;
      } else {
        const vehiculo = await this.vehicleRepository.findOne({ where: { vehicle_id: vehiculo_id } });
        if (!vehiculo) {
          throw new NotFoundException(`Vehículo con ID ${vehiculo_id} no encontrado`);
        }
        gasto.vehiculo_id = vehiculo_id;
        gasto.vehiculo = vehiculo;
      }
    }

    // Manejar categoría (setear FK y limpiar/actualizar relación)
    if (categoria_id !== undefined) {
      if (categoria_id === null || categoria_id === 0) {
        gasto.categoria_id = null;
        gasto.categoriaRelacion = null;
      } else {
        const categoriaDb = await this.categoriaRepository.findOne({ where: { categoria_id } });
        if (!categoriaDb) {
          throw new NotFoundException(`Categoría con ID ${categoria_id} no encontrada`);
        }
        gasto.categoria_id = categoria_id;
        gasto.categoriaRelacion = categoriaDb;
      }
    }

    // Asignar categoria enum si se proporciona
    if (categoria !== undefined) {
      gasto.categoria = categoria;
    }

    // Asignar el resto de propiedades simples
    Object.assign(gasto, rest);

    await this.gastoRepository.save(gasto);
    
    // Recargar con relaciones para devolver al frontend
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const gasto = await this.findOne(id);
    await this.gastoRepository.remove(gasto);
  }
}
