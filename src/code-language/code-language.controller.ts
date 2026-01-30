import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { CodeDialectService } from "./code-dialect.service";

export class GetCodeDialectsResponseDto {
  dialects: Array<{
    name: string;
    displayName: string;
    parentLanguage: string;
  }>;
}

@ApiTags("Code Language")
@Controller("codeLanguage")
export class CodeLanguageController {
  constructor(private readonly codeDialectService: CodeDialectService) {}

  @Get("getDialects")
  @ApiOperation({
    summary: "获取方言列表"
  })
  async getDialects(): Promise<GetCodeDialectsResponseDto> {
    const dialects = this.codeDialectService.getDialectsFromConfig();
    return {
      dialects: dialects.map(d => ({
        name: d.name,
        displayName: d.displayName,
        parentLanguage: d.parentLanguage
      }))
    };
  }
}
