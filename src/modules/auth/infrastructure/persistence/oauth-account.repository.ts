import { eq, and } from 'drizzle-orm';
import { accounts } from 'src/shared/core/infrastructure/database/schema';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { IOAuthAccountRepository } from '../../domain/repositories/oauth-account.repository.interface';
import {
  OAuthAccount,
  OAuthProvider,
} from '../../domain/entities/oauth-account.entity';

/**
 * OAuth Account repository implementation using Drizzle ORM
 */
export class OAuthAccountRepository implements IOAuthAccountRepository {
  constructor(private readonly db: Database) {}

  async findByProvider(
    provider: OAuthProvider,
    providerUserId: string,
  ): Promise<OAuthAccount | null> {
    const result = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.subject, providerUserId),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return OAuthAccount.fromPersistence(
      row.id,
      row.user_id,
      row.provider as OAuthProvider,
      row.subject,
      row.is_verified || false,
      row.created_at,
      row.updated_at,
    );
  }

  async findByUserId(userId: string): Promise<OAuthAccount[]> {
    const result = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.user_id, userId));

    return result.map((row) =>
      OAuthAccount.fromPersistence(
        row.id,
        row.user_id,
        row.provider as OAuthProvider,
        row.subject,
        row.is_verified || false,
        row.created_at,
        row.updated_at,
      ),
    );
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider,
  ): Promise<OAuthAccount | null> {
    const result = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.user_id, userId), eq(accounts.provider, provider)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return OAuthAccount.fromPersistence(
      row.id,
      row.user_id,
      row.provider as OAuthProvider,
      row.subject,
      row.is_verified || false,
      row.created_at,
      row.updated_at,
    );
  }

  async save(account: OAuthAccount): Promise<OAuthAccount> {
    const accountData = {
      id: account.id,
      user_id: account.userId,
      provider: account.provider,
      subject: account.providerUserId,
      is_verified: account.isVerified,
      updated_at: account.updatedAt,
    };

    const existing = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, account.id))
      .limit(1);

    if (existing.length > 0) {
      // Update
      await this.db
        .update(accounts)
        .set(accountData)
        .where(eq(accounts.id, account.id));
    } else {
      // Insert
      await this.db.insert(accounts).values({
        ...accountData,
        created_at: account.createdAt,
      });
    }

    return account;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(accounts).where(eq(accounts.id, id));
  }
}
