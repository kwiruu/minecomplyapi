import { Controller, Get, Headers } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import type { SupabaseAuthUser } from './interfaces/supabase-user.interface';
import { Public } from './decorators/public.decorator';

@Controller('auth-debug')
export class AuthDebugController {
  @Get('me')
  whoami(
    @CurrentUser() user: SupabaseAuthUser,
    @Headers() headers: Record<string, unknown>,
  ) {
    return {
      user,
      authorization: headers?.authorization ?? headers?.Authorization ?? null,
    };
  }

  @Public()
  @Get('headers')
  headers(@Headers() headers: Record<string, unknown>) {
    const auth = (headers?.authorization ?? headers?.Authorization) as
      | string
      | undefined;
    const token = typeof auth === 'string' ? auth.split(/\s+/)[1] : undefined;

    let header: Record<string, unknown> | null = null;
    let payload: Record<string, unknown> | null = null;
    if (token && token.includes('.')) {
      const [h, p] = token.split('.', 3);
      try {
        const hbuf = Buffer.from(
          h.replace(/-/g, '+').replace(/_/g, '/'),
          'base64',
        );
        header = JSON.parse(hbuf.toString('utf8')) as Record<string, unknown>;
      } catch {
        // ignore
      }
      try {
        const pbuf = Buffer.from(
          p.replace(/-/g, '+').replace(/_/g, '/'),
          'base64',
        );
        payload = JSON.parse(pbuf.toString('utf8')) as Record<string, unknown>;
      } catch {
        // ignore
      }
    }

    return {
      authorization: auth ? `${auth.slice(0, 16)}…` : null,
      header,
      payload,
    };
  }
}
