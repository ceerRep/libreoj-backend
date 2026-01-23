import { AsyncLocalStorage } from "async_hooks";

import { NestMiddleware, Injectable } from "@nestjs/common";

import { Request, Response } from "express"; // eslint-disable-line import/no-extraneous-dependencies

import { UserEntity } from "@/user/user.entity";
import { UserPrivilegeService, UserPrivilegeType } from "@/user/user-privilege.service";

import { AuthSessionService } from "./auth-session.service";
import { AuthApiTokenService } from "./auth-api-token.service";
import { UserApiTokenEntity } from "./user-api-token.entity";

const asyncLocalStorage = new AsyncLocalStorage();

export interface Session {
  sessionKey?: string;
  sessionId?: number;
  user?: UserEntity;
  apiTokenEntity?: UserApiTokenEntity;
  userCanSkipRecaptcha: () => Promise<boolean>;
}

export interface RequestWithSession extends Request {
  session?: Session;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly authApiTokenService: AuthApiTokenService,
    private readonly userPrivilegeService: UserPrivilegeService
  ) {}

  async use(req: RequestWithSession, res: Response, next: () => void): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    
    if (token) {
      // First try to verify as session token (JWT format)
      const [sessionId, user] = await this.authSessionService.accessSession(token);
      if (user) {
        req.session = {
          sessionKey: token,
          sessionId,
          user,
          userCanSkipRecaptcha: () => this.userPrivilegeService.userHasPrivilege(user, UserPrivilegeType.SkipRecaptcha)
        };
      } else {
        // If not a session token, try as API token
        const [apiTokenEntity, apiUser] = await this.authApiTokenService.accessToken(token);
        if (apiUser) {
          req.session = {
            sessionKey: token,
            sessionId: null, // API tokens don't have session IDs
            user: apiUser,
            apiTokenEntity: apiTokenEntity,
            userCanSkipRecaptcha: () => this.userPrivilegeService.userHasPrivilege(apiUser, UserPrivilegeType.SkipRecaptcha)
          };
        }
      }
    }

    asyncLocalStorage.run(req, () => next());
  }
}

/**
 * Get the current request object from async local storage.
 *
 * Calling it in a EventEmitter's callback may be not working since EventEmitter's callbacks
 * run in different contexts.
 */
export function getCurrentRequest(): RequestWithSession {
  return asyncLocalStorage.getStore() as RequestWithSession;
}
