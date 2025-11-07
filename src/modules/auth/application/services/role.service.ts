import { eq } from 'drizzle-orm';
import { user_role } from 'src/shared/core/infrastructure/database/schema';
import { Database } from 'src/shared/core/infrastructure/database/database.types';

/**
 * Service for working with user roles
 */
export class RoleService {
  constructor(private readonly db: Database) {}

  /**
   * Get role ID by role name
   */
  async getRoleIdByName(roleName: string): Promise<number | null> {
    const result = await this.db
      .select()
      .from(user_role)
      .where(eq(user_role.name, roleName))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0].id;
  }

  /**
   * Ensure role exists, create if not
   */
  async ensureRoleExists(roleName: string): Promise<number> {
    const existing = await this.getRoleIdByName(roleName);
    if (existing) {
      return existing;
    }

    // Create role if it doesn't exist
    const result = await this.db
      .insert(user_role)
      .values({ name: roleName })
      .returning();

    return result[0].id;
  }
}

