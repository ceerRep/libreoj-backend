import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";

import { Repository, DataSource } from "typeorm";
import crypto from "crypto";

import { UserEntity } from "@/user/user.entity";
import { UserService } from "@/user/user.service";
import { UserApiTokenEntity } from "./user-api-token.entity";

@Injectable()
export class AuthApiTokenService {
  constructor(
    @InjectRepository(UserApiTokenEntity)
    private readonly userApiTokenRepository: Repository<UserApiTokenEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  /**
   * Generate a new API token and return both the token and its hash.
   * The token should be shown to the user only once.
   */
  async generateToken(userId: number, name: string): Promise<[token: string, entity: UserApiTokenEntity]> {
    // Generate a secure random token (64 bytes = 512 bits)
    const token = crypto.randomBytes(64).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const entity = new UserApiTokenEntity();
    entity.userId = userId;
    entity.tokenHash = tokenHash;
    entity.name = name;
    entity.createdAt = new Date();
    entity.lastUsedAt = null;

    await this.userApiTokenRepository.save(entity);

    return [token, entity];
  }

  /**
   * Generate a new API token with a maximum count check in a transaction.
   * This ensures atomicity and prevents race conditions.
   * Returns [token, entity] if successful, or throws an error if the limit is reached.
   */
  async generateTokenWithLimitCheck(
    userId: number,
    name: string,
    maxTokens: number
  ): Promise<[token: string, entity: UserApiTokenEntity]> {
    return await this.connection.transaction("READ COMMITTED", async transactionalEntityManager => {
      // Count existing tokens within the transaction
      const tokenCount = await transactionalEntityManager.count(UserApiTokenEntity, {
        where: { userId }
      });

      if (tokenCount >= maxTokens) {
        throw new Error("TOO_MANY_TOKENS");
      }

      // Generate a secure random token (64 bytes = 512 bits)
      const token = crypto.randomBytes(64).toString("base64url");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const entity = new UserApiTokenEntity();
      entity.userId = userId;
      entity.tokenHash = tokenHash;
      entity.name = name;
      entity.createdAt = new Date();
      entity.lastUsedAt = null;

      await transactionalEntityManager.save(entity);

      return [token, entity];
    });
  }

  /**
   * Verify and access an API token.
   * Returns the user entity if the token is valid, null otherwise.
   * Also updates the lastUsedAt timestamp.
   */
  async accessToken(token: string): Promise<[entity: UserApiTokenEntity, user: UserEntity] | [null, null]> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const entity = await this.userApiTokenRepository.findOneBy({ tokenHash });

    if (!entity) {
      return [null, null];
    }

    // Update last used time
    entity.lastUsedAt = new Date();
    await this.userApiTokenRepository.save(entity);

    const user = await this.userService.findUserById(entity.userId);
    if (!user) {
      return [null, null];
    }

    return [entity, user];
  }

  /**
   * List all API tokens for a user.
   */
  async listUserTokens(userId: number): Promise<UserApiTokenEntity[]> {
    return await this.userApiTokenRepository.find({
      where: { userId },
      order: { createdAt: "DESC" }
    });
  }

  /**
   * Delete an API token by UUID.
   * Returns true if the token was found and deleted, false otherwise.
   */
  async deleteToken(userId: number, tokenUUID: string): Promise<boolean> {
    const result = await this.userApiTokenRepository.delete({
      id: tokenUUID,
      userId // Ensure the token belongs to the user
    });

    return result.affected > 0;
  }

  /**
   * Find an API token by UUID.
   * Returns the token entity if found, null otherwise.
   */
  async findTokenByUUID(tokenUUID: string): Promise<UserApiTokenEntity | null> {
    return await this.userApiTokenRepository.findOneBy({ id: tokenUUID });
  }

  /**
   * Delete all API tokens for a user.
   */
  async deleteAllUserTokens(userId: number): Promise<void> {
    await this.userApiTokenRepository.delete({ userId });
  }
}
