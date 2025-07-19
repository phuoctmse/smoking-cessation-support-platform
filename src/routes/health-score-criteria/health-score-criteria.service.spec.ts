import { Test, TestingModule } from '@nestjs/testing';
import { HealthScoreCriteriaService } from './health-score-criteria.service';

describe('HealthScoreCriteriaService', () => {
  let service: HealthScoreCriteriaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthScoreCriteriaService],
    }).compile();

    service = module.get<HealthScoreCriteriaService>(HealthScoreCriteriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
