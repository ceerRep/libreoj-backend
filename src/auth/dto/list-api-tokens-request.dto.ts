import { ApiProperty } from "@nestjs/swagger";

import { IsUsername } from "@/common/validators";

export class ListApiTokensRequestDto {
  @ApiProperty({
    description: "Username of the user to list tokens for. Regular users can only specify their own username."
  })
  @IsUsername()
  readonly username: string;
}
