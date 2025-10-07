import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthUser } from '../auth/interfaces/supabase-user.interface';

type UserEntity = Awaited<ReturnType<PrismaService['user']['findUnique']>>;
type ResolvedUserEntity = NonNullable<UserEntity>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUser(authUser: SupabaseAuthUser): Promise<ResolvedUserEntity> {
    const supabaseId = authUser.id;

    const email = sanitizeEmail(authUser.email);
    const displayName = resolveMetadataString(authUser.userMetadata, [
      'full_name',
      'name',
      'displayName',
    ]);
    const phoneNumber = resolveMetadataString(authUser.userMetadata, [
      'phone',
      'phone_number',
      'mobile',
    ]);

    const user = await this.prisma.user.upsert({
      where: { supabaseId },
      update: {
        email: email ?? null,
        displayName: displayName ?? null,
        phoneNumber: phoneNumber ?? null,
      },
      create: {
        supabaseId,
        email: email ?? null,
        displayName: displayName ?? null,
        phoneNumber: phoneNumber ?? null,
      },
    });

    return user;
  }

  async findBySupabaseId(supabaseId: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }
}

const sanitizeEmail = (candidate?: string): string | undefined => {
  if (!candidate) {
    return undefined;
  }

  const normalized = candidate.trim().toLowerCase();
  return normalized.length ? normalized : undefined;
};

const resolveMetadataString = (
  metadata: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined => {
  if (!metadata) {
    return undefined;
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim().length) {
      return value.trim();
    }
  }

  return undefined;
};
