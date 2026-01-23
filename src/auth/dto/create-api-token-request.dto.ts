import { ApiProperty } from "@nestjs/swagger";

import { IsString, MaxLength, MinLength } from "class-validator";

import { IsUsername } from "@/common/validators";

export class CreateApiTokenRequestDto {
  @ApiProperty({
    description: "A name to identify this API token (e.g., 'My CI/CD Pipeline')"
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  readonly name: string;

  @ApiProperty({
    description: "Username of the user to create token for. Regular users can only specify their own username."
  })
  @IsUsername()
  readonly username: string;
}
