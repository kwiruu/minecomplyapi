import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import applicationConfig from './config/application.config';
import { configValidationSchema } from './config/config.validation';
import supabaseConfig from './config/supabase.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseAuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ComplianceModule } from './compliance/compliance.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      expandVariables: true,
      load: [applicationConfig, supabaseConfig],
      validationSchema: configValidationSchema,
    }),
    SupabaseAuthModule,
    PrismaModule,
    HealthModule,
    ComplianceModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
