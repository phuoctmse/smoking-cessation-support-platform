import { Test, TestingModule } from '@nestjs/testing';
import { UserBadgeService } from './user-badge.service';

describe('UserBadgeService', () => {
  let service: UserBadgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserBadgeService],
    }).compile();

    service = module.get<UserBadgeService>(UserBadgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
