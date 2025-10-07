import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable, isObservable, lastValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SupabaseAuthService } from '../supabase-auth.service';
import { consumeAuthToken } from '../token-store';
import type { SupabaseAuthUser } from '../interfaces/supabase-user.interface';

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('supabase-jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Bypass all auth if DISABLE_AUTH=true in env
    const disableAuth = this.configService.get<string>('DISABLE_AUTH');
    if (disableAuth && disableAuth.toLowerCase() === 'true') {
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'authenticated',
        aud: 'authenticated',
        appMetadata: { provider: 'email', providers: ['email'] },
        userMetadata: { email: 'dev@example.com', email_verified: true },
        rawClaims: {},
      };
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    try {
      const activationResult = super.canActivate(context);
      const resolved = await resolveCanActivateResult(activationResult);
      if (resolved) {
        return true;
      }
      return this.attemptSupabaseFallback(context);
    } catch (error) {
      return this.attemptSupabaseFallback(context, error);
    }
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Authentication failed');
    }

    return user as TUser;
  }

  private async attemptSupabaseFallback(
    context: ExecutionContext,
    originalError?: unknown,
  ): Promise<boolean> {
    const token = consumeAuthToken();
    if (!token) {
      throw this.asUnauthorized(originalError);
    }

    const supabaseUser =
      await this.supabaseAuthService.getUserFromAccessToken(token);

    if (!supabaseUser) {
      throw this.asUnauthorized(originalError);
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: SupabaseAuthUser }>();
    request.user = supabaseUser;

    return true;
  }

  private asUnauthorized(candidate?: unknown): UnauthorizedException {
    if (candidate instanceof UnauthorizedException) {
      return candidate;
    }
    if (candidate instanceof Error) {
      return new UnauthorizedException(candidate.message);
    }
    if (typeof candidate === 'string') {
      return new UnauthorizedException(candidate);
    }
    return new UnauthorizedException();
  }
}

const resolveCanActivateResult = async (
  result: boolean | Promise<boolean> | Observable<boolean>,
): Promise<boolean> => {
  if (result instanceof Promise) {
    return await result;
  }
  if (isObservable(result)) {
    return lastValueFrom(result);
  }
  if (typeof result === 'boolean') {
    return result;
  }
  return Boolean(result);
};
