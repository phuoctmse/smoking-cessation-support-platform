import { Test, TestingModule } from '@nestjs/testing';
import { ProgressRecordService } from './progress-record.service';

describe('ProgressRecordService', () => {
  let service: ProgressRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressRecordService],
    }).compile();

    service = module.get<ProgressRecordService>(ProgressRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
