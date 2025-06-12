import { Test, TestingModule } from '@nestjs/testing';
import { CessationPlanService } from './cessation-plan.service';

describe('CessationPlanService', () => {
  let service: CessationPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CessationPlanService],
    }).compile();

    service = module.get<CessationPlanService>(CessationPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
