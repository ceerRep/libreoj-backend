import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserModule } from "@/user/user.module";
import { GroupModule } from "@/group/group.module";
import { RedisModule } from "@/redis/redis.module";
import { MailModule } from "@/mail/mail.module";
import { AuditModule } from "@/audit/audit.module";
import { MigrationModule } from "@/migration/migration.module";

import { UserAuthEntity } from "./user-auth.entity";
import { UserApiTokenEntity } from "./user-api-token.entity";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthEmailVerificationCodeService } from "./auth-email-verification-code.service";
import { AuthSessionService } from "./auth-session.service";
import { AuthIpLocationService } from "./auth-ip-location.service";
import { AuthApiTokenService } from "./auth-api-token.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAuthEntity, UserApiTokenEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
    forwardRef(() => RedisModule),
    forwardRef(() => MailModule),
    forwardRef(() => AuditModule),
    forwardRef(() => MigrationModule)
  ],
  providers: [
    AuthService,
    AuthEmailVerificationCodeService,
    AuthSessionService,
    AuthIpLocationService,
    AuthApiTokenService
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    AuthEmailVerificationCodeService,
    AuthSessionService,
    AuthIpLocationService,
    AuthApiTokenService
  ]
})
export class AuthModule {}
