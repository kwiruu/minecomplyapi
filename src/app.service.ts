import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getApiMetadata() {
    return {
      name: this.configService.get<string>('app.name'),
      description: this.configService.get<string>('app.description'),
      version: this.configService.get<string>('app.version'),
      environment: this.configService.get<string>('app.environment'),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
