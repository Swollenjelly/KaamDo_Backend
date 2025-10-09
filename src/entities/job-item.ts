import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, Index, Unique
} from "typeorm";

type Kind = 'type' | 'task';

@Entity({ name: "job_items" })
@Unique(["parent", "name"])
@Unique(["parent", "slug"])
export class JobItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => JobItem, (item) => item.children, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @Index()
  parent!: JobItem | null; // null => top-level "type"

  @OneToMany(() => JobItem, (item) => item.parent)
  children!: JobItem[];

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 180 })
  slug!: string;

  @Index()
  @Column({ type: "text" })
  kind!: Kind; // 'type' | 'task'

  @Index()
  @Column({ type: "boolean", default: true })
  is_active!: boolean;
}
