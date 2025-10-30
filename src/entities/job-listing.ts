import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { User } from "./user";
import { JobItem } from "./job-item";
import { Vendor } from "./vendor";

export type JobStatus = 'open'|'assigned'|'in_progress'|'completed'|'cancelled'|'draft';

@Entity({ name: "job_listings" })
export class JobListings {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @Index()
  user!: User;

  @ManyToOne(() => JobItem, { nullable: false })
  @Index()
  job_item!: JobItem;

  @Column({ type: "text", nullable: true })
  details!: string | null;

  // @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
  // budget_amount!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city!: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  pincode!: string | null;

//   @Column({ type: "timestamptz", nullable: true })
//   scheduled_at!: Date | null;

  @Column({ type: "text", default: "open" })
  status!: JobStatus;

  // in JobListings entity

  @ManyToOne(() => Vendor, { nullable: true, onDelete: "SET NULL" })
  assigned_vendor!: Vendor | null;


//   @CreateDateColumn({ type: "timestamptz" })
//   created_at!: Date;

//   @UpdateDateColumn({ type: "timestamptz" })
//   updated_at!: Date;
}
