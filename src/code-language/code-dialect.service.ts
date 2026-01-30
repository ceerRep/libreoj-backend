import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

import { logger } from "@/logger";
import { ConfigService } from "@/config/config.service";
import { ClusterService } from "@/cluster/cluster.service";

import { CodeDialectEntity } from "./code-dialect.entity";
import { SubmissionEntity } from "@/submission/submission.entity";

export interface CodeDialectInfo {
  name: string;
  displayName: string;
  parentLanguage: string;
}

@Injectable()
export class CodeDialectService implements OnModuleInit {
  private dialectsFromConfig: Map<string, CodeDialectInfo> = new Map();

  constructor(
    @InjectRepository(CodeDialectEntity)
    private readonly codeDialectRepository: Repository<CodeDialectEntity>,
    @InjectRepository(SubmissionEntity)
    private readonly submissionRepository: Repository<SubmissionEntity>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly clusterService: ClusterService
  ) {}

  async onModuleInit(): Promise<void> {
    // 只在主进程中执行同步，避免多进程重复操作
    // 在 cluster 模式下，主进程不会处理请求，可以安全地执行数据库操作
    if (this.clusterService.isMaster) {
      await this.syncDialects();
    } else {
      // Worker 进程只加载配置，不执行数据库同步
      await this.loadDialectsFromConfig();
    }
  }

  /**
   * 仅从config加载方言列表（不操作数据库）
   */
  private async loadDialectsFromConfig(): Promise<void> {
    const configDialects = this.getDialectsFromConfig();
    this.dialectsFromConfig.clear();
    for (const dialect of configDialects) {
      this.dialectsFromConfig.set(dialect.name, dialect);
    }
  }

  /**
   * 从config中获取方言列表
   */
  getDialectsFromConfig(): CodeDialectInfo[] {
    const dialects = this.configService.config.preference?.codeDialects?.dialects || [];
    return dialects.map(d => ({
      name: d.name,
      displayName: d.displayName,
      parentLanguage: d.parentLanguage
    }));
  }

  /**
   * 检查语言是否为方言
   */
  isDialect(language: string): boolean {
    return this.dialectsFromConfig.has(language);
  }

  /**
   * 获取方言的父语言，如果不是方言则返回自身
   */
  getParentLanguage(language: string): string {
    const dialect = this.dialectsFromConfig.get(language);
    return dialect ? dialect.parentLanguage : language;
  }

  /**
   * 获取所有有效语言（包括基础语言和方言）
   */
  getAllValidLanguages(baseLanguages: string[]): string[] {
    const dialects = Array.from(this.dialectsFromConfig.keys());
    return [...baseLanguages, ...dialects];
  }

  /**
   * 同步config和数据库中的方言
   */
  private async syncDialects(): Promise<void> {
    // 从config读取方言列表
    const configDialects = this.getDialectsFromConfig();
    this.dialectsFromConfig.clear();
    for (const dialect of configDialects) {
      this.dialectsFromConfig.set(dialect.name, dialect);
    }

    // 从数据库读取方言列表
    const dbDialects = await this.codeDialectRepository.find();

    // 构建config方言的Map，key为方言名，value为父语言
    const configDialectMap = new Map<string, string>();
    for (const dialect of configDialects) {
      configDialectMap.set(dialect.name, dialect.parentLanguage);
    }

    // 构建数据库方言的Map
    const dbDialectMap = new Map<string, string>();
    for (const dialect of dbDialects) {
      dbDialectMap.set(dialect.dialectName, dialect.parentLanguage);
    }

    // 找出需要删除的方言（在数据库中但不在config中，或对应关系不匹配）
    const dialectsToDelete: string[] = [];
    for (const dbDialect of dbDialects) {
      const configParent = configDialectMap.get(dbDialect.dialectName);
      if (!configParent || configParent !== dbDialect.parentLanguage) {
        dialectsToDelete.push(dbDialect.dialectName);
      }
    }

    // 删除方言并重命名提交
    for (const dialectName of dialectsToDelete) {
      const dbDialect = dbDialects.find(d => d.dialectName === dialectName);
      if (dbDialect) {
        logger.log(`删除方言: ${dialectName}，父语言: ${dbDialect.parentLanguage}`);
        await this.deleteDialectAndRenameSubmissions(dialectName, dbDialect.parentLanguage);
      }
    }

    // 找出需要新增的方言（在config中但不在数据库中）
    const dialectsToAdd: CodeDialectInfo[] = [];
    for (const dialect of configDialects) {
      const dbDialect = dbDialects.find(d => d.dialectName === dialect.name);
      if (!dbDialect) {
        dialectsToAdd.push(dialect);
      }
    }

    // 新增方言
    if (dialectsToAdd.length > 0) {
      const entities = dialectsToAdd.map(dialect => {
        const entity = new CodeDialectEntity();
        entity.dialectName = dialect.name;
        entity.parentLanguage = dialect.parentLanguage;
        return entity;
      });
      await this.codeDialectRepository.save(entities);
      logger.log(`新增方言: ${dialectsToAdd.map(d => d.name).join(", ")}`);
    }

    // 更新已存在但父语言可能改变的方言
    for (const dialect of configDialects) {
      const dbDialect = dbDialects.find(d => d.dialectName === dialect.name);
      if (dbDialect && dbDialect.parentLanguage !== dialect.parentLanguage) {
        dbDialect.parentLanguage = dialect.parentLanguage;
        await this.codeDialectRepository.save(dbDialect);
        logger.log(`更新方言 ${dialect.name} 的父语言为: ${dialect.parentLanguage}`);
      }
    }
  }

  /**
   * 删除方言并将所有使用该方言的提交重命名为父语言
   */
  private async deleteDialectAndRenameSubmissions(dialectName: string, parentLanguage: string): Promise<void> {
    await this.dataSource.transaction("READ COMMITTED", async transactionalEntityManager => {
      // 更新所有使用该方言的提交
      const updateResult = await transactionalEntityManager
        .createQueryBuilder()
        .update(SubmissionEntity)
        .set({ codeLanguage: parentLanguage })
        .where("codeLanguage = :dialectName", { dialectName })
        .execute();

      if (updateResult.affected > 0) {
        logger.log(`已将 ${updateResult.affected} 个提交从方言 ${dialectName} 重命名为父语言 ${parentLanguage}`);
      }

      // 删除方言记录
      await transactionalEntityManager.delete(CodeDialectEntity, { dialectName });
    });
  }
}
