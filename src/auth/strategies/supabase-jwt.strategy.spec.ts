import { UnauthorizedException } from '@nestjs/common';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';
import { SupabaseJwtPayload } from '../interfaces/supabase-user.interface';

describe('SupabaseJwtStrategy', () => {
  let strategy: SupabaseJwtStrategy;

  beforeEach(() => {
    strategy = Object.create(
      SupabaseJwtStrategy.prototype,
    ) as SupabaseJwtStrategy;
  });

  it('maps a valid payload to a SupabaseAuthUser', () => {
    const payload: SupabaseJwtPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      role: 'authenticated',
      aud: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: { name: 'User' },
    };

    const result = strategy.validate(payload);

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      role: 'authenticated',
      aud: 'authenticated',
      appMetadata: { provider: 'email' },
      userMetadata: { name: 'User' },
      rawClaims: payload,
    });
  });

  it('throws when the payload does not include a subject', () => {
    const payload = { email: 'user@example.com' } as SupabaseJwtPayload;

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
  });
});
