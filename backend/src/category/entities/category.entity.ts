import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SubCategory } from "src/sub-category/entities/sub-category.entity";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    category_id: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    nombre: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @OneToMany(() => SubCategory, (subCategory) => subCategory.category)
    subCategories: SubCategory[];

}
