import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseAuthService } from '../supabase-auth.service';
import { ConfigService } from '@nestjs/config';

describe('SupabaseAuthGuard', () => {
  const baseGuardPrototype = Object.getPrototypeOf(
    SupabaseAuthGuard.prototype,
  ) as {
    canActivate: (context: ExecutionContext) => boolean | Promise<boolean>;
  };

  let reflector: Reflector;
  let supabaseAuthService: SupabaseAuthService;
  let guard: SupabaseAuthGuard;
  let baseCanActivateSpy: jest.SpyInstance;
  let configService: ConfigService;

  const createExecutionContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    supabaseAuthService = {
      getUserFromAccessToken: jest.fn().mockResolvedValue(null),
    } as unknown as SupabaseAuthService;

    configService = { get: jest.fn().mockReturnValue(undefined) } as any;

    guard = new SupabaseAuthGuard(reflector, supabaseAuthService, configService);
    baseCanActivateSpy = jest
      .spyOn(baseGuardPrototype, 'canActivate')
      .mockReturnValue(true);
  });

  afterEach(() => {
    baseCanActivateSpy.mockRestore();
  });

  it('returns true when handler is marked as public', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

    const result = await guard.canActivate(createExecutionContext());

    expect(result).toBe(true);
    expect(baseCanActivateSpy).not.toHaveBeenCalled();
  });

  it('delegates to the passport guard when handler is not public', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    const context = createExecutionContext();
    const result = await guard.canActivate(context);

    expect(baseCanActivateSpy).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
  });
});
