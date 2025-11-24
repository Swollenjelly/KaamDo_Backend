import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type gender = "male" | "female" | "other";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'varchar', length: 15, unique: true })
    phone!: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    email!: string|null;

    @Column()
    passwordHash!: string;

    @Column({
            type: "enum",
            enum: ["male", "female", "other"],
        })
        gender!: gender;

    @Column()
    location!: string;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

}
