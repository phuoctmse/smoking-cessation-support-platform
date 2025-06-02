import { Test, TestingModule } from '@nestjs/testing';
import { PlanStageResolver } from './plan-stage.resolver';
import { PlanStageService } from './plan-stage.service';

describe('PlanStageResolver', () => {
  let resolver: PlanStageResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanStageResolver, PlanStageService],
    }).compile();

    resolver = module.get<PlanStageResolver>(PlanStageResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
