import { ApiProperty } from "@nestjs/swagger";

export class ApiTokenInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  lastUsedAt: Date | null;
}

export enum ListApiTokensResponseError {
  PERMISSION_DENIED = "PERMISSION_DENIED"
}

export class ListApiTokensResponseDto {
  @ApiProperty({ enum: ListApiTokensResponseError })
  error?: ListApiTokensResponseError;

  @ApiProperty({ type: [ApiTokenInfoDto] })
  tokens: ApiTokenInfoDto[];
}
