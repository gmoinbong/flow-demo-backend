/**
 * Metric type value object
 */
export enum MetricType {
  FOLLOWERS = 'followers',
  FOLLOWING = 'following',
  POSTS = 'posts',
  VIEWS = 'views',
  ENGAGEMENT_RATE = 'engagement_rate',
  LIKES = 'likes',
  COMMENTS = 'comments',
  SHARES = 'shares',
}

export class MetricTypeVO {
  private constructor(public readonly value: MetricType) {}

  static create(type: string): MetricTypeVO {
    const validType = Object.values(MetricType).find(
      (t) => t === type.toLowerCase(),
    );
    if (!validType) {
      throw new Error(`Invalid metric type: ${type}`);
    }
    return new MetricTypeVO(validType);
  }
}

