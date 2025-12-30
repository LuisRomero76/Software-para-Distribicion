import { CategoriaCliente } from "src/categoria_clientes/entities/categoria_cliente.entity";
import { Visita } from "src/common/enums/visita.enum";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TelefonoReferencia } from "./telefono-referencia.entity";

@Entity()
export class Cliente {

    @PrimaryGeneratedColumn()
    cliente_id: number;

    @Column({ type: 'varchar', length: 100 })
    sub_canal: string;

    @Column({ type: 'enum', enum: Visita, default: Visita.DIA, nullable: true })
    visita?: Visita;

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

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefono?: string;

    @OneToMany(() => TelefonoReferencia, telefono => telefono.cliente, {
        cascade: true,
        eager: true,
    })
    telefonos_referencia: TelefonoReferencia[];

    @ManyToMany(() => CategoriaCliente, categoria => categoria.clientes, {
        eager: true,
    })
    @JoinTable({
        name: 'cliente_categoria_rel',
        joinColumn: { name: 'cliente_id', referencedColumnName: 'cliente_id' },
        inverseJoinColumn: { name: 'cliente_categoria_id', referencedColumnName: 'cliente_categoria_id' },
    })
    categorias: CategoriaCliente[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

}
