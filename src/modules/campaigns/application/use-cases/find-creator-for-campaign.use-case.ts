import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql, or, isNotNull } from 'drizzle-orm';
import { creator_social_profiles, profile } from 'src/shared/core/infrastructure/database/schema';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';

export interface FindCreatorCommand {
  platforms: string[];
  audienceSize?: 'micro' | 'mid-tier' | 'macro' | 'mega';
  targetLocation?: string;
}

export interface CreatorMatch {
  creatorId: string;
  socialProfileId: string;
  platform: string;
  username: string;
  followers: number;
  engagementRate: number;
  niches: string[];
  location: string | null;
}

@Injectable()
export class FindCreatorForCampaignUseCase {
  constructor(private readonly db: Database) {}

  async execute(command: FindCreatorCommand): Promise<CreatorMatch | null> {
    // Build audience size filter
    let audienceFilter = sql`1=1`; // default: no filter
    if (command.audienceSize) {
      switch (command.audienceSize) {
        case 'micro':
          audienceFilter = sql`COALESCE(${creator_social_profiles.followers_verified}, ${creator_social_profiles.followers_declared}) BETWEEN 1000 AND 10000`;
          break;
        case 'mid-tier':
          audienceFilter = sql`COALESCE(${creator_social_profiles.followers_verified}, ${creator_social_profiles.followers_declared}) BETWEEN 10000 AND 100000`;
          break;
        case 'macro':
          audienceFilter = sql`COALESCE(${creator_social_profiles.followers_verified}, ${creator_social_profiles.followers_declared}) BETWEEN 100000 AND 1000000`;
          break;
        case 'mega':
          audienceFilter = sql`COALESCE(${creator_social_profiles.followers_verified}, ${creator_social_profiles.followers_declared}) > 1000000`;
          break;
      }
    }

    // Build location filter
    // Match if targetLocation is contained in location OR location is contained in targetLocation
    // Example: "New York, USA" matches "United States" and vice versa
    let locationFilter = sql`1=1`;
    if (command.targetLocation) {
      const locationPattern = `%${command.targetLocation}%`;
      // Match if location contains targetLocation OR targetLocation contains location
      locationFilter = sql`(
        ${creator_social_profiles.location} ILIKE ${locationPattern} OR
        ${sql.raw(`'${command.targetLocation.replace(/'/g, "''")}'`)} ILIKE ('%' || ${creator_social_profiles.location} || '%')
      )`;
    }

    // Query for matching creators
    const result = await this.db
      .select({
        creatorId: creator_social_profiles.creator_id,
        socialProfileId: creator_social_profiles.id,
        platform: creator_social_profiles.platform,
        username: creator_social_profiles.username,
        followers: sql<number>`COALESCE(${creator_social_profiles.followers_verified}, ${creator_social_profiles.followers_declared})`.as('followers'),
        engagementRate: sql<number>`COALESCE(${creator_social_profiles.engagement_rate_verified}, ${creator_social_profiles.engagement_rate_declared})`.as('engagement_rate'),
        niches: creator_social_profiles.niches,
        location: creator_social_profiles.location,
      })
      .from(creator_social_profiles)
      .innerJoin(profile, eq(profile.id, creator_social_profiles.creator_id))
      .where(
        and(
          inArray(creator_social_profiles.platform, command.platforms),
          eq(profile.status, 'active'),
          or(
            isNotNull(creator_social_profiles.followers_declared),
            isNotNull(creator_social_profiles.followers_verified),
          ),
          audienceFilter,
          locationFilter,
        ),
      )
      .orderBy(
        // Priority: verified data > declared data
        sql`CASE WHEN ${creator_social_profiles.followers_verified} IS NOT NULL THEN 0 ELSE 1 END`,
        sql`COALESCE(${creator_social_profiles.engagement_rate_verified}, ${creator_social_profiles.engagement_rate_declared}) DESC NULLS LAST`,
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      creatorId: row.creatorId,
      socialProfileId: row.socialProfileId,
      platform: row.platform,
      username: row.username || '',
      followers: row.followers || 0,
      engagementRate: Number(row.engagementRate) || 0,
      niches: (row.niches as string[]) || [],
      location: row.location,
    };
  }
}

