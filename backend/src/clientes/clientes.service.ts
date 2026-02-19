import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Collaborator } from 'src/collaborator/entities/collaborator.entity';
import { CollaboratorRole } from 'src/common/enums/collaborator-role.enum';
import { Repository, DataSource } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { TelefonoReferencia } from './entities/telefono-referencia.entity';

@Injectable()
export class ClientesService {

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Collaborator)
    private readonly collaboratorRepository: Repository<Collaborator>,
    @InjectRepository(TelefonoReferencia)
    private readonly telefonoReferenciaRepository: Repository<TelefonoReferencia>,
    private readonly dataSource: DataSource,
  ) {}

  private async validarPreventista(preventista_id: number): Promise<Collaborator> {
    const preventista = await this.collaboratorRepository.findOne({ 
      where: { collaborator_id: preventista_id } 
    });
    
    if (!preventista) {
      throw new NotFoundException(`El colaborador con id ${preventista_id} no existe`);
    }
    
    if (preventista.rol !== CollaboratorRole.PREVENTISTA) {
      throw new BadRequestException('El colaborador asignado debe tener el rol de preventista');
    }
    
    return preventista;
  }

  async create(createClienteDto: CreateClienteDto) {
    try {
      await this.validarPreventista(createClienteDto.preventista_id);
      
      const { preventista_id, telefonos_referencia, ...data } = createClienteDto;
      
      const cliente = this.clienteRepository.create({ 
        ...data,
        preventista_id,
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
    const clientes = await this.clienteRepository.find({
      relations: ['preventista', 'telefonos_referencia']
    });
    return clientes;
  }

  async findOne(id: number) {
    const cliente = await this.clienteRepository.findOne({ 
      where: { cliente_id: id },
      relations: ['preventista', 'telefonos_referencia']
    });
    if (!cliente) {
      throw new NotFoundException(`El cliente con id ${id} no existe`);
    }
    return cliente;
  }

  async findByPreventista(preventista_id: number) {
    return await this.clienteRepository.find({
      where: { preventista_id },
      relations: ['preventista', 'telefonos_referencia']
    });
  }

  async findByPreventistaAndDia(preventista_id: number, dia_visita: string) {
    return await this.clienteRepository.find({
      where: { 
        preventista_id,
        dia_visita: dia_visita as any
      },
      relations: ['preventista', 'telefonos_referencia']
    });
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    try {
      const cliente = await this.findOne(id);

      if (updateClienteDto.preventista_id !== undefined && updateClienteDto.preventista_id !== null) {
        await this.validarPreventista(updateClienteDto.preventista_id);
      }

      const { preventista_id, telefonos_referencia, ...data } = updateClienteDto;
      
      const updateData: any = { ...data };
      
      if (preventista_id !== undefined && preventista_id !== null) {
        updateData.preventista_id = preventista_id;
      }
      
      await this.clienteRepository.update(
        { cliente_id: id },
        updateData
      );
      
      if (telefonos_referencia !== undefined) {
        await this.telefonoReferenciaRepository.delete({ cliente_id: id });
        
        if (telefonos_referencia.length > 0) {
          const nuevos = telefonos_referencia.map(tel =>
            this.telefonoReferenciaRepository.create({ ...tel, cliente_id: id })
          );
          await this.telefonoReferenciaRepository.save(nuevos);
        }
      }
      
      // Recargar el cliente con todas sus relaciones para asegurar que se retornen correctamente
      const clienteActualizado = await this.clienteRepository.findOne({
        where: { cliente_id: id },
        relations: ['preventista', 'telefonos_referencia']
      });
      
      if (!clienteActualizado) {
        throw new NotFoundException(`No se pudo encontrar el cliente actualizado con id ${id}`);
      }
      
      return clienteActualizado;
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
