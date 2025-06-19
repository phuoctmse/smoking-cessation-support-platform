import { Test, TestingModule } from '@nestjs/testing';
import { BadgeAwardService } from './badge-award.service';

describe('BadgeAwardService', () => {
  let service: BadgeAwardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgeAwardService],
    }).compile();

    service = module.get<BadgeAwardService>(BadgeAwardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
