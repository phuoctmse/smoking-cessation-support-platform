import { Test, TestingModule } from '@nestjs/testing';
import { ProgressRecordResolver } from './progress-record.resolver';
import { ProgressRecordService } from './progress-record.service';

describe('ProgressRecordResolver', () => {
  let resolver: ProgressRecordResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressRecordResolver, ProgressRecordService],
    }).compile();

    resolver = module.get<ProgressRecordResolver>(ProgressRecordResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
