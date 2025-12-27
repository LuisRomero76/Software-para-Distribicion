import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { DetalleCompra } from 'src/detalle_compra/entities/detalle_compra.entity';

@Entity()
export class Compra {
  @PrimaryGeneratedColumn()
  compra_id: number;

  @Column({ nullable: true })
  proveedor_id: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_compra: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.compras, { nullable: true })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor | null;

  @OneToMany(() => DetalleCompra, (detalle) => detalle.compra, { cascade: true })
  detalles: DetalleCompra[];
}
