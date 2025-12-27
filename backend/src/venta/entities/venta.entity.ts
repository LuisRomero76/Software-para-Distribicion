import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { DetalleVenta } from 'src/detalle_venta/entities/detalle_venta.entity';

export enum TipoVenta {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO'
}

@Entity()
export class Venta {
  @PrimaryGeneratedColumn()
  venta_id: number;

  @Column({ nullable: true })
  cliente_id: number;

  @Column({ type: 'date' })
  fecha_venta: Date;

  @Column({ type: 'enum', enum: TipoVenta, default: TipoVenta.CONTADO })
  tipo_venta: TipoVenta;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta, { cascade: true })
  detalles: DetalleVenta[];
}
