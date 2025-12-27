import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Compra } from 'src/compra/entities/compra.entity';

@Entity()
export class Proveedor {
  @PrimaryGeneratedColumn()
  proveedor_id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ruc: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => Compra, (compra) => compra.proveedor)
  compras: Compra[];
}
