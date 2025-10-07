import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, User } from '@supabase/supabase-js';
import {
  SupabaseAuthUser,
  SupabaseJwtPayload,
} from './interfaces/supabase-user.interface';

@Injectable()
export class SupabaseAuthService {
  private readonly client: ReturnType<typeof createClient>;
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );
    if (!serviceRoleKey) {
      throw new Error('Supabase service role key is not configured');
    }
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async getUserFromAccessToken(
    token: string,
  ): Promise<SupabaseAuthUser | null> {
    try {
      const { data, error } = await this.client.auth.getUser(token);
      if (error || !data?.user) {
        if (error) {
          this.logger.debug(`Supabase getUser error: ${error.message}`);
        }
        return null;
      }
      return mapUserToAuthUser(data.user);
    } catch (error) {
      this.logger.debug(
        `Supabase getUser exception: ${(error as Error).message}`,
      );
      return null;
    }
  }
}

const mapUserToAuthUser = (user: User): SupabaseAuthUser => {
  const rawClaims: SupabaseJwtPayload = {
    sub: user.id,
    aud: user.aud,
    email: user.email ?? undefined,
    role: user.role ?? undefined,
    app_metadata: user.app_metadata ?? undefined,
    user_metadata: user.user_metadata ?? undefined,
  };

  return {
    id: user.id,
    email: user.email ?? undefined,
    role: user.role ?? undefined,
    aud: user.aud ?? undefined,
    appMetadata: user.app_metadata ?? undefined,
    userMetadata: user.user_metadata ?? undefined,
    rawClaims,
  };
};
