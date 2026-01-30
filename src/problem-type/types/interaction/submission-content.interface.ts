import { IsString, Length, IsObject, IsBoolean, IsOptional } from "class-validator";

import { SubmissionContent } from "@/submission/submission-content.interface";
import { IsCodeLanguageOrDialect } from "@/common/validators";

export class SubmissionContentInteraction implements SubmissionContent {
  @IsString()
  @IsCodeLanguageOrDialect()
  language: string;

  @IsString()
  @Length(0, 1024 * 1024)
  code: string;

  @IsObject()
  compileAndRunOptions: unknown;

  @IsBoolean()
  @IsOptional()
  skipSamples?: boolean;
}
