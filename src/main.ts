import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  const globalPrefix = configService.get<string>('app.globalPrefix');
  const port = Number(
    configService.get<string | number>('app.port', { infer: true }) ?? 3000,
  );
  const corsOrigins =
    configService.get<string[]>('app.corsOrigins', { infer: true }) ?? [];

  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  });

  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port, '0.0.0.0');
}
void bootstrap();
