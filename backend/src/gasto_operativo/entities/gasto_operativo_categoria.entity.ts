import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GastoOperativo } from './gasto_operativo.entity';

@Entity('gasto_operativo_categoria')
export class GastoOperativoCategoria {
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

  @OneToMany(() => GastoOperativo, (gasto) => gasto.categoriaRelacion)
  gastos: GastoOperativo[];
}
