import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthDebugController } from './debug.controller';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'supabase-jwt' })],
  providers: [SupabaseJwtStrategy, SupabaseAuthGuard, SupabaseAuthService],
  controllers: [AuthDebugController],
  exports: [PassportModule, SupabaseAuthGuard, SupabaseAuthService],
})
export class SupabaseAuthModule {}
