import { ApiProperty } from "@nestjs/swagger";

export enum CreateApiTokenResponseError {
  PERMISSION_DENIED = "PERMISSION_DENIED",
  TOO_MANY_TOKENS = "TOO_MANY_TOKENS"
}

export class CreateApiTokenResponseDto {
  @ApiProperty({ enum: CreateApiTokenResponseError })
  error?: CreateApiTokenResponseError;

  @ApiProperty({
    description: "The API token. This will only be shown once. Store it securely."
  })
  token: string;

  @ApiProperty({
    description: "The token UUID for management purposes"
  })
  tokenUUID: string;

  @ApiProperty({
    description: "The name of the token"
  })
  name: string;

  @ApiProperty({
    description: "When the token was created"
  })
  createdAt: Date;
}