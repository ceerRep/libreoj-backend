import { Entity, PrimaryColumn, Column, Index } from "typeorm";

/**
 * 方言实体
 * 用于存储方言与父语言的对应关系
 * 仅在启动时同步，用于删除方言时跟踪父语言
 */
@Entity("code_dialect")
@Index(["dialectName"], { unique: true })
export class CodeDialectEntity {
  @PrimaryColumn({ type: "varchar", length: 50 })
  dialectName: string;

  @Column({ type: "varchar", length: 50 })
  parentLanguage: string;
}
