import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type gender = "male" | "female" | "other";

export type PreferredWorkLocation = "inside" | "outside" | "both"

export type VendorType = "individual" | "company"

export type DocumentType = "aadhar" | "pan" | "driving_license" | "voter_id" | "passport"

export type location = "mumbai" | "pune" | "banglore" | "delhi" | "chennai" | "hyderabad" | "kolkata"

@Entity("vendors")
export class Vendor {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: "varchar", unique: true, nullable: true })
    phone!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    email!: string | null;

    @Column({ type: "varchar", nullable: true })
    password!: string | null;

    @Column({
        type: "enum",
        enum: ["male", "female", "other"],
        nullable: true
    })
    gender!: gender | null;

    @Column({
        type: "enum",
        enum: ["mumbai", "pune", "banglore", "delhi", "chennai", "hyderabad", "kolkata"],
        nullable: true
    })
    location!: location | null;

    @Column({
        type: "enum",
        enum: ["inside", "outside", "both"],
        nullable: true
    })
    preferredWorkLocation!: PreferredWorkLocation | null;

    @Column({
        type: "enum",
        enum: ["individual", "company"],
        nullable: true
    })
    vendorType!: VendorType | null;

    @Column({
        type: "enum",
        enum: ["aadhar", "pan", "driving_license", "voter_id", "passport"],
        nullable: true
    })
    documentType!: DocumentType | null;

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

    @Column({ type: "varchar", length: 255, nullable: true })
    documentFile !: string | null;

}
