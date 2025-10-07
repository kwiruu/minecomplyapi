import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  const mockConfig = {
    'app.name': 'MineComply API',
    'app.description': 'MineComply compliance management backend',
    'app.version': '0.1.0',
    'app.environment': 'test',
  } as const;

  const configServiceMock = {
    get: jest.fn((key: keyof typeof mockConfig) => mockConfig[key]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API metadata', () => {
      const result = appController.getApiMetadata();

      expect(configServiceMock.get).toHaveBeenCalledWith('app.name');
      expect(result).toMatchObject({
        name: mockConfig['app.name'],
        description: mockConfig['app.description'],
        version: mockConfig['app.version'],
        environment: mockConfig['app.environment'],
      });
      expect(typeof result.uptime).toBe('number');
      expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
