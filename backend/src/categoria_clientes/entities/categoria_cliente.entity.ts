import { Cliente } from "src/clientes/entities/cliente.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CategoriaCliente {

    @PrimaryGeneratedColumn()
    cliente_categoria_id: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    nombre: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    // @ManyToMany(() => Cliente, cliente => cliente.categorias)
    // clientes: Cliente[];
}
