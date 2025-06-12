import { Test, TestingModule } from '@nestjs/testing';
import { PlanStageService } from './plan-stage.service';

describe('PlanStageService', () => {
  let service: PlanStageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanStageService],
    }).compile();

    service = module.get<PlanStageService>(PlanStageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
