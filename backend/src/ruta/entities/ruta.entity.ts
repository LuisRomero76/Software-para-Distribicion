import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Cliente } from "src/clientes/entities/cliente.entity";
import { Collaborator } from "src/collaborator/entities/collaborator.entity";

export enum EstadoRuta {
    PENDIENTE = 'pendiente',
    EN_PROGRESO = 'en_progreso',
    COMPLETADA = 'completada',
    CANCELADA = 'cancelada'
}

@Entity()
export class Ruta {
    @PrimaryGeneratedColumn()
    ruta_id: number;

    @Column({ type: 'date' })
    dia_visita: Date;

    @Column({ type: 'enum', enum: EstadoRuta, default: EstadoRuta.PENDIENTE })
    estado: EstadoRuta;

    @Column({ type: 'text', nullable: true })
    observaciones?: string;

    @ManyToOne(() => Cliente, { eager: true })
    @JoinColumn({ name: 'cliente_id' })
    cliente: Cliente;

    @Column()
    cliente_id: number;

    @ManyToOne(() => Collaborator, { eager: true })
    @JoinColumn({ name: 'collaborator_id' })
    colaborador: Collaborator;

    @Column()
    collaborator_id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
