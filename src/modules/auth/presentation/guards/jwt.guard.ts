import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../../application/services/jwt.service';
import { AUTH_DI_TOKENS } from '../../auth.tokens';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_DI_TOKENS.JWT_SERVICE)
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Attach user info to request
      (request as any).user = {
        id: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

