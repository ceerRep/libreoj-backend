import { Entity, PrimaryGeneratedColumn, Index, ManyToOne, Column, JoinColumn } from "typeorm";

import { UserEntity } from "@/user/user.entity";

@Entity("user_api_token")
@Index(["userId", "tokenHash"], { unique: true })
@Index(["userId"])
export class UserApiTokenEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UserEntity, {
    onDelete: "CASCADE"
  })
  @JoinColumn()
  user: Promise<UserEntity>;

  @Column()
  userId: number;

  @Column({ type: "varchar", length: 255 })
  tokenHash: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "datetime" })
  createdAt: Date;

  @Column({ type: "datetime", nullable: true })
  lastUsedAt: Date | null;
}
