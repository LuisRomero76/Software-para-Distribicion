import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductShipping {
  @PrimaryGeneratedColumn()
  shipping_id: number;

  @Column()
  product_id: number;

  @Column({ type: 'int', nullable: false })
  unidades_caja: number; // Ejemplo: 6 botellas por caja

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio_unidad_envio: number; // Precio de envío por unidad

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio_caja_envio: number; // Precio de envío por caja

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  flete: number; // Costo de flete

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Product, (product) => product.shippingInfo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
