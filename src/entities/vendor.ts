import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum VendorType {
    individual = "individual",
    company = "company"
}

export enum PreferredWorkLocation {
    inside = "inside",
    outside = "outside",
    both = "both",
}

export enum gender {
    male = "male",
    female = "female",
    other = "other"
}

export enum DocumentType {
    aadhar = "aadhar",
    pan = "pan",
    driving_license = "driving_license",
    voter_id = "voter_id",
    passport = "passport"
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
    location!: string;

    @Column({
        type: "enum",
        enum: PreferredWorkLocation,
        default: PreferredWorkLocation.both,
    })
    preferredWorkLocation!: PreferredWorkLocation;

    @Column({
        type: "enum",
        enum: VendorType,
        default: VendorType.individual,
    })
    vendorType!: VendorType;

    @Column({
        type: "enum",
        enum: DocumentType,
    })
    documentType!: DocumentType;
    


}
