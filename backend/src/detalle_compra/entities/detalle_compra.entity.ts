import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Compra } from 'src/compra/entities/compra.entity';
import { Product } from 'src/product/entities/product.entity';
import { Lote } from 'src/lote/entities/lote.entity';

@Entity()
export class DetalleCompra {
  @PrimaryGeneratedColumn()
  detalle_compra_id: number;

  @Column()
  compra_id: number;

  @Column()
  product_id: number;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento: Date;

  @ManyToOne(() => Compra, (compra) => compra.detalles)
  @JoinColumn({ name: 'compra_id' })
  compra: Compra;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  producto: Product;

  @OneToMany(() => Lote, (lote) => lote.detalleCompra)
  lotes: Lote[];
}
