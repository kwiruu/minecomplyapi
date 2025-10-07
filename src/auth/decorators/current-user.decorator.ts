import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupabaseAuthUser } from '../interfaces/supabase-user.interface';

type AuthenticatedRequest = { user?: SupabaseAuthUser };

export const CurrentUser = createParamDecorator(
  <TKey extends keyof SupabaseAuthUser | undefined>(
    data: TKey,
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user) {
      return undefined;
    }

    if (!data) {
      return user;
    }

    return user[data];
  },
);
