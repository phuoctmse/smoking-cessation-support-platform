import { Test, TestingModule } from '@nestjs/testing';
import { BadgeTypeResolver } from './badge-type.resolver';
import { BadgeTypeService } from './badge-type.service';

describe('BadgeTypeResolver', () => {
  let resolver: BadgeTypeResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgeTypeResolver, BadgeTypeService],
    }).compile();

    resolver = module.get<BadgeTypeResolver>(BadgeTypeResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
