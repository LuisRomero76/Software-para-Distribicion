import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { SubCategory } from '../../sub-category/entities/sub-category.entity';
import { ProductShipping } from './product-shipping.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  product_id: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  cod_barra: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tamaño: string;

  @Column()
  category_id: number;

  @Column({ nullable: true })
  sub_category_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_creacion: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => SubCategory)
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;

  @OneToMany(() => ProductShipping, (shipping) => shipping.product, { cascade: true })
  shippingInfo: ProductShipping[];
}
