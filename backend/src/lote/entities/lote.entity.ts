import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { DetalleCompra } from 'src/detalle_compra/entities/detalle_compra.entity';
import { DetalleVenta } from 'src/detalle_venta/entities/detalle_venta.entity';

@Entity()
export class Lote {
  @PrimaryGeneratedColumn()
  lote_id: number;

  @Column()
  product_id: number;

  @Column({ type: 'int' })
  cantidad_inicial: number;

  @Column({ type: 'int' })
  cantidad_actual: number;

  @Column({ type: 'int', default: 0, comment: 'Unidades sueltas (no completan un paquete)' })
  unidades_sueltas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costo_unitario: number;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento: Date | null;

  @Column({ nullable: true })
  detalle_compra_id: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_ingreso: Date;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  producto: Product;

  @ManyToOne(() => DetalleCompra, (detalle) => detalle.lotes)
  @JoinColumn({ name: 'detalle_compra_id' })
  detalleCompra: DetalleCompra;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.lote)
  detallesVenta: DetalleVenta[];
}
