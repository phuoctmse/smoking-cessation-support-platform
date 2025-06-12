import { Test, TestingModule } from '@nestjs/testing';
import { CessationPlanResolver } from './cessation-plan.resolver';
import { CessationPlanService } from './cessation-plan.service';

describe('CessationPlanResolver', () => {
  let resolver: CessationPlanResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CessationPlanResolver, CessationPlanService],
    }).compile();

    resolver = module.get<CessationPlanResolver>(CessationPlanResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
