import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  ping() {
    return this.healthService.getHealthStatus();
  }

  @Get('live')
  liveness() {
    return this.healthService.getLivenessStatus();
  }

  @Get('ready')
  readiness() {
    return this.healthService.getReadinessStatus();
  }
}
