import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "src/category/entities/category.entity";

@Entity()
export class SubCategory {

    @PrimaryGeneratedColumn()
    sub_category_id: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    nombre: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => Category, (category) => category.subCategories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ type: 'int', nullable: false })
    category_id: number;
}
