import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum VendorType {
    INDIVIDUAL = "individual",
    COMPANY = "company"
}

export enum PreferredWorkLocation {
    inside = "inside",
    outside = "outside",
    both = "both",
}

export enum gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}

export enum DocumentType {
    AADHAR = "aadhar",
    PAN = "pan",
    DRIVING_LICENSE = "driving_license",
    VOTER_ID = "voter_id",
    PASSPORT = "passport"
}

@Entity("vendors")
export class Vendor {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: "varchar", unique: true })
    phone!: string;

    @Column({ nullable: true })
    email!: string;

    @Column()
    password!: string;

    @Column({
        type: "enum",
        enum: gender,
    })
    gender!: gender;

    @Column()
    location!: number;

    @Column({
        type: "enum",
        enum: PreferredWorkLocation,
        default: PreferredWorkLocation.both,
    })
    preferredWorkLocation!: PreferredWorkLocation;

    @Column({
        type: "enum",
        enum: VendorType,
        default: VendorType.INDIVIDUAL,
    })
    vendorType!: VendorType;

    @Column({
        type: "enum",
        enum: DocumentType,
    })
    documentType!: DocumentType;
    


}
