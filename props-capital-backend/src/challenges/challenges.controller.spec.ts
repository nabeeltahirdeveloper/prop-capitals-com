import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';

describe('ChallengesController', () => {
  let controller: ChallengesController;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    trackBrandLinkClick: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengesController],
      providers: [{ provide: ChallengesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ChallengesController>(ChallengesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to the service', () => {
    serviceMock.findAll.mockReturnValue(['dto']);
    expect(controller.findAll()).toEqual(['dto']);
    expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
  });
});
