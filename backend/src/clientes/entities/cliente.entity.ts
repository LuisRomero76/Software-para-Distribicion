import { Collaborator } from "src/collaborator/entities/collaborator.entity";
import { Visita } from "src/common/enums/visita.enum";
import { DiaVisita } from "src/common/enums/dia-visita.enum";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TelefonoReferencia } from "./telefono-referencia.entity";

@Entity()
export class Cliente {

    @PrimaryGeneratedColumn()
    cliente_id: number;

    @Column({ type: 'varchar', length: 100 })
    sub_canal: string;

    @Column({ type: 'enum', enum: Visita, default: Visita.DIA, nullable: true })
    visita?: Visita;

    @Column({ type: 'enum', enum: DiaVisita, nullable: true })
    dia_visita?: DiaVisita;

    @Column({ type: 'bigint', unique: true, nullable: true })
    nit_ci?: number;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'varchar', length: 200 })
    direccion: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ciudad?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    coordenadas?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telefono?: string;

    @Column({ type: 'int', nullable: true })
    preventista_id?: number;

    @ManyToOne(() => Collaborator, collaborator => collaborator.clientes, {
        eager: true,
    })
    @JoinColumn({ name: 'preventista_id' })
    preventista: Collaborator;

    @OneToMany(() => TelefonoReferencia, telefono => telefono.cliente, {
        cascade: true,
        eager: true,
    })
    telefonos_referencia: TelefonoReferencia[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

}
