import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ClusterModule } from "@/cluster/cluster.module";

import { CodeLanguageService } from "./code-language.service";
import { CodeDialectService } from "./code-dialect.service";
import { CodeLanguageController } from "./code-language.controller";
import { CodeDialectEntity } from "./code-dialect.entity";
import { SubmissionEntity } from "@/submission/submission.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CodeDialectEntity, SubmissionEntity]), ClusterModule],
  providers: [CodeDialectService, CodeLanguageService],
  controllers: [CodeLanguageController],
  exports: [CodeLanguageService, CodeDialectService]
})
export class CodeLanguageModule {}
