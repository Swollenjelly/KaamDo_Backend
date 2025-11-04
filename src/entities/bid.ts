import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, Unique} from "typeorm";
import { Vendor } from "./vendor";
import { JobListings } from "./job-listing";

// the vendor can only see open jobs 
export type BidStatus = "open" | "close";

@Entity({ name: "bids" })
@Unique(["job", "vendor"]) // one bid per vendor per job

export class Bid {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => JobListings, { nullable: false, onDelete: "CASCADE" })
    @Index()
    job!: JobListings;

    @ManyToOne(() => Vendor, { nullable: false, onDelete: "CASCADE" })
    @Index()
    vendor!: Vendor;

    @Column({ type: "numeric", precision: 12, scale: 2 })
    amount!: string; // store as string for numeric

    @Column({ type: "varchar", length: 500, nullable: true })
    message!: string | null;

    @Column({ type: "text", default: "open" })
    status!: BidStatus;

    @CreateDateColumn({ type: "timestamptz" })
    created_at!: Date;
}
