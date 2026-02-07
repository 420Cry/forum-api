import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HEALTH_SERVICE } from './health.service.interface';

const mockHealthService = {
  getStatus: () => ({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  }),
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HEALTH_SERVICE,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return health status', () => {
    const health = controller.getHealth();
    expect(health).toHaveProperty('status', 'ok');
    expect(health).toHaveProperty('timestamp');
    expect(new Date(health.timestamp).getTime()).not.toBeNaN();
  });
});
