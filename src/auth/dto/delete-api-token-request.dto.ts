import { ApiProperty } from "@nestjs/swagger";

import { IsString, IsUUID } from "class-validator";

import { IsUsername } from "@/common/validators";

export class DeleteApiTokenRequestDto {
  @ApiProperty({
    description: "The UUID of the API token to delete"
  })
  @IsString()
  @IsUUID()
  readonly tokenUUID: string;

  @ApiProperty({
    description: "Username of the user who owns the token. Regular users can only specify their own username."
  })
  @IsUsername()
  readonly username: string;
}
