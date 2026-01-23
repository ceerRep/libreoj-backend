import { ApiProperty } from "@nestjs/swagger";

export enum DeleteApiTokenResponseError {
  NO_SUCH_TOKEN = "NO_SUCH_TOKEN",
  PERMISSION_DENIED = "PERMISSION_DENIED"
}

export class DeleteApiTokenResponseDto {
  @ApiProperty({ enum: DeleteApiTokenResponseError, required: false })
  error?: DeleteApiTokenResponseError;
}
