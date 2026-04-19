import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type gender = "male" | "female" | "other";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
    phone!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    email!: string | null;

    @Column({ type: "varchar", nullable: true })
    passwordHash!: string | null;

    @Column({
        type: "enum",
        enum: ["male", "female", "other"],
        nullable: true
    })
    gender!: gender | null;

    @Column({ type: "varchar", nullable: true })
    location!: string | null;

    @Column({ type: "varchar", unique: true, nullable: true })
    googleId!: string | null;

    @Column({ type: "varchar", unique: true, nullable: true })
    appleId!: string | null;

    @Column({
        type: "enum",
        enum: ["local", "google", "apple"],
        default: "local"
    })
    authProvider!: "local" | "google" | "apple";

    @Column({ type: "boolean", default: false })
    isProfileComplete!: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    profileImageUrl!: string | null;
}
