import { Test, TestingModule } from '@nestjs/testing';
import { UserBadgeResolver } from './user-badge.resolver';
import { UserBadgeService } from './user-badge.service';

describe('UserBadgeResolver', () => {
  let resolver: UserBadgeResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserBadgeResolver, UserBadgeService],
    }).compile();

    resolver = module.get<UserBadgeResolver>(UserBadgeResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
