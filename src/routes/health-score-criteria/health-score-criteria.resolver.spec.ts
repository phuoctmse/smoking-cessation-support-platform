import { Test, TestingModule } from '@nestjs/testing';
import { HealthScoreCriteriaResolver } from './health-score-criteria.resolver';
import { HealthScoreCriteriaService } from './health-score-criteria.service';

describe('HealthScoreCriteriaResolver', () => {
  let resolver: HealthScoreCriteriaResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthScoreCriteriaResolver, HealthScoreCriteriaService],
    }).compile();

    resolver = module.get<HealthScoreCriteriaResolver>(HealthScoreCriteriaResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
