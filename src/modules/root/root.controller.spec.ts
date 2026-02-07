import { Test, TestingModule } from '@nestjs/testing';
import { RootController } from './root.controller';
import { ROOT_SERVICE } from './root.service.interface';

const mockRootService = {
  getHello: () => 'Hello World!',
};

describe('RootController', () => {
  let controller: RootController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RootController],
      providers: [
        {
          provide: ROOT_SERVICE,
          useValue: mockRootService,
        },
      ],
    }).compile();

    controller = module.get<RootController>(RootController);
  });

  it('should return "Hello World!"', () => {
    expect(controller.getHello()).toBe('Hello World!');
  });
});
