import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUser {
  id: string;
  email: string;
  roleId?: number | null;
  role?: string;
  onboardingComplete?: boolean;
}

/**
 * Get current authenticated user from request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    return request.user!;
  },
);


