import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { DetalleCompra } from 'src/detalle_compra/entities/detalle_compra.entity';
import { PagoCompra } from 'src/pago_compra/entities/pago_compra.entity';

export enum TipoCompra {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO'
}

export enum EstadoCompra {
  PENDIENTE = 'PENDIENTE',
  COMPLETADO = 'COMPLETADO'
}

@Entity()
export class Compra {
  @PrimaryGeneratedColumn()
  compra_id: number;

  @Column({ nullable: true })
  proveedor_id: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_compra: Date;

  @Column({ type: 'enum', enum: TipoCompra, default: TipoCompra.CONTADO })
  tipo_compra: TipoCompra;

  @Column({ type: 'enum', enum: EstadoCompra, default: EstadoCompra.COMPLETADO })
  estado: EstadoCompra;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_pagado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_adeudado: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.compras, { nullable: true })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor | null;

  @OneToMany(() => DetalleCompra, (detalle) => detalle.compra, { cascade: true })
  detalles: DetalleCompra[];

  @OneToMany(() => PagoCompra, (pago) => pago.compra, { cascade: true })
  pagos: PagoCompra[];
}
