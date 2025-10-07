import { Module } from '@nestjs/common';
import { SupabaseAuthModule } from '../auth/auth.module';
import { SupabaseStorageService } from './supabase-storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [SupabaseAuthModule],
  controllers: [StorageController],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class StorageModule {}
