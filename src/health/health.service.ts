import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealthStatus() {
    const environment = this.configService.get<string>('app.environment');
    const service = this.configService.get<string>('app.name');

    return {
      status: 'ok',
      environment: environment ?? 'unknown',
      service: service ?? 'MineComply API',
      time: new Date().toISOString(),
    };
  }

  getLivenessStatus() {
    return {
      status: 'live',
      uptime: process.uptime(),
    };
  }

  getReadinessStatus() {
    return {
      status: 'ready',
      dependencies: {
        supabaseAuth: this.isSupabaseConfigured(),
        supabaseStorage: this.isSupabaseStorageConfigured(),
      },
    };
  }

  private isSupabaseConfigured() {
    const url = this.configService.get<string>('supabase.url');
    const anonKey = this.configService.get<string>('supabase.anonKey');

    return Boolean(url && anonKey);
  }

  private isSupabaseStorageConfigured() {
    const bucket = this.configService.get<string>('supabase.storageBucket');

    return Boolean(bucket);
  }
}
