import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriaCliente } from 'src/categoria_clientes/entities/categoria_cliente.entity';
import { In, Repository, DataSource } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { TelefonoReferencia } from './entities/telefono-referencia.entity';

@Injectable()
export class ClientesService {

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(CategoriaCliente)
    private readonly categoriaClienteRepository: Repository<CategoriaCliente>,
    @InjectRepository(TelefonoReferencia)
    private readonly telefonoReferenciaRepository: Repository<TelefonoReferencia>,
    private readonly dataSource: DataSource,
  ) {}

  private async ensureCategorias(cliente_categoria_ids: number[]) {
    const categorias = await this.categoriaClienteRepository.find({ where: { cliente_categoria_id: In(cliente_categoria_ids) } });
    if (categorias.length !== cliente_categoria_ids.length) {
      const encontrados = categorias.map(c => c.cliente_categoria_id);
      const faltantes = cliente_categoria_ids.filter(id => !encontrados.includes(id));
      throw new NotFoundException(`Las categorías de cliente con id ${faltantes.join(', ')} no existen`);
    }
    return categorias;
  }

  async create(createClienteDto: CreateClienteDto) {
    try {
      const categorias = await this.ensureCategorias(createClienteDto.cliente_categoria_ids);
      const { cliente_categoria_ids, telefonos_referencia, ...data } = createClienteDto;
      
      const cliente = this.clienteRepository.create({ 
        ...data, 
        categorias,
        telefonos_referencia: telefonos_referencia?.map(tel => 
          this.telefonoReferenciaRepository.create(tel)
        ) || []
      });
      
      return await this.clienteRepository.save(cliente);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('nit_ci')) {
          throw new ConflictException('El NIT/CI ingresado ya está registrado en otro cliente');
        }
        throw new ConflictException('Ya existe un cliente con estos datos');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.clienteRepository.find({
      relations: ['categorias', 'telefonos_referencia']
    });
  }

  async findOne(id: number) {
    const cliente = await this.clienteRepository.findOne({ 
      where: { cliente_id: id },
      relations: ['categorias', 'telefonos_referencia']
    });
    if (!cliente) {
      throw new NotFoundException(`El cliente con id ${id} no existe`);
    }
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    try {
      const cliente = await this.findOne(id);

      if (updateClienteDto.cliente_categoria_ids) {
        cliente.categorias = await this.ensureCategorias(updateClienteDto.cliente_categoria_ids);
      }

      if (updateClienteDto.telefonos_referencia !== undefined) {
        // Eliminar teléfonos anteriores
        await this.telefonoReferenciaRepository.delete({ cliente_id: id });
        
        // Crear nuevos teléfonos
        cliente.telefonos_referencia = updateClienteDto.telefonos_referencia?.map(tel =>
          this.telefonoReferenciaRepository.create({ ...tel, cliente_id: id })
        ) || [];
      }

      const { cliente_categoria_ids, telefonos_referencia, ...data } = updateClienteDto;
      Object.assign(cliente, data);
      return await this.clienteRepository.save(cliente);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('nit_ci')) {
          throw new ConflictException('El NIT/CI ingresado ya está registrado en otro cliente');
        }
        throw new ConflictException('Ya existe un cliente con estos datos');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const cliente = await this.clienteRepository.findOne({
      where: { cliente_id: id },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Iniciar transacción para eliminar en orden correcto
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Primero eliminar las rutas asociadas al cliente
      await queryRunner.manager.delete('ruta', {
        cliente_id: id,
      });

      // Eliminar ventas asociadas (si existen)
      // Primero obtener las ventas del cliente
      const ventas = await queryRunner.manager.find('venta', {
        where: { cliente_id: id },
      }) as any[];

      // Para cada venta, eliminar sus detalles y devolver stock
      for (const venta of ventas) {
        // Obtener detalles de la venta
        const detalles = await queryRunner.manager.find('detalle_venta', {
          where: { venta_id: venta.venta_id },
        }) as any[];

        // Devolver stock a los lotes
        for (const detalle of detalles) {
          const lote = await queryRunner.manager.findOne('lote', {
            where: { lote_id: detalle.lote_id },
          }) as any;

          if (lote) {
            lote.cantidad_actual += detalle.cantidad;
            await queryRunner.manager.save('lote', lote);
          }
        }

        // Eliminar detalles de venta
        await queryRunner.manager.delete('detalle_venta', {
          venta_id: venta.venta_id,
        });

        // Eliminar ingreso asociado
        await queryRunner.manager.delete('ingreso', {
          referencia_id: venta.venta_id,
        });

        // Eliminar la venta
        await queryRunner.manager.delete('venta', {
          venta_id: venta.venta_id,
        });
      }

      // Eliminar teléfonos de referencia
      await queryRunner.manager.delete('telefono_referencia', {
        cliente_id: id,
      });

      // Finalmente eliminar el cliente
      await queryRunner.manager.delete('cliente', {
        cliente_id: id,
      });

      await queryRunner.commitTransaction();
      return { deleted: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
