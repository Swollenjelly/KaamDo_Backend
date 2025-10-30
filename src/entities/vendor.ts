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

    @Column({ type: "varchar", unique: true })
    phone!: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    email!: string|null;

    @Column()
    password!: string;

    @Column({
        type: "enum",
        enum: ["male", "female", "other"],
    })
    gender!: gender;

    @Column({
        type: "enum",
        enum: ["mumbai" , "pune" , "banglore" , "delhi" , "chennai" , "hyderabad" , "kolkata"]
})
    location!: location;

    @Column({
        type: "enum",
        enum: ["inside", "outside", "both"]
    })
    preferredWorkLocation!: PreferredWorkLocation;

    @Column({
        type: "enum",
        enum: ["individual", "company"],
    })
    vendorType!: VendorType;

    @Column({
        type: "enum",
        enum: ["aadhar" ,"pan" , "driving_license" , "voter_id" , "passport"]
    })
    documentType!: DocumentType;
    


}
