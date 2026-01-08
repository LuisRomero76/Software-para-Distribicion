import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Ingreso } from './ingreso.entity';

@Entity('ingreso_categoria')
export class IngresoCategoria {
  @PrimaryGeneratedColumn()
  categoria_id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Ingreso, (ingreso) => ingreso.categoriaRelacion)
  ingresos: Ingreso[];
}
