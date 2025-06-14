import { Test, TestingModule } from '@nestjs/testing';
import { BadgeAwardResolver } from './badge-award.resolver';
import { BadgeAwardService } from './badge-award.service';

describe('BadgeAwardResolver', () => {
  let resolver: BadgeAwardResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgeAwardResolver, BadgeAwardService],
    }).compile();

    resolver = module.get<BadgeAwardResolver>(BadgeAwardResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
