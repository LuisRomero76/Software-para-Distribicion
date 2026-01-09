import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { SubCategory } from '../../sub-category/entities/sub-category.entity';

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

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  precio_compra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  precio_compra_paquete: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  precio_venta_paquete: number;

  @Column({ type: 'int', nullable: true, default: 1 })
  cant_por_paquete: number;

  @Column()
  category_id: number;

  @Column({ nullable: true })
  sub_category_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_creacion: Date;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => SubCategory)
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;
}
